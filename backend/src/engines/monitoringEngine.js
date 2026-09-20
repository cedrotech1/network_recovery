const db = require("../database/models");
const { checkNodeHealth } = require("./healthChecker");
const { executeRecovery } = require("./recoveryEngine");
const { isLocalHost, ensureSimulatedNode, syncLocalLabNodesFromDb } = require("./labProvisioner");

let timer = null;
let running = false;
let ioRef = null;
let lastFullSyncAt = 0;
/** pending injection metadata keyed by node id */
const pendingInjections = new Map();

async function getSettingsMap() {
  const rows = await db.SystemSetting.findAll();
  const map = {};
  rows.forEach((row) => {
    map[row.key] = row.value;
  });
  return {
    checkIntervalMs: Number(map.checkIntervalMs || 5000),
    failureThreshold: Number(map.failureThreshold || 3),
    healthTimeoutMs: Number(map.healthTimeoutMs || 3000),
    autoRecoveryEnabled: String(map.autoRecoveryEnabled || "true") === "true",
    persistHealthChecks: String(map.persistHealthChecks || "true") === "true",
  };
}

function emit(event, payload) {
  if (ioRef) ioRef.emit(event, payload);
}

async function processNode(node, settings) {
  if (!node.isMonitored) return;

  // Always re-register local lab services (defaults + UI-added) so a simulate
  // restart cannot leave them permanently "Not working" in the UI.
  if (isLocalHost(node.host)) {
    await ensureSimulatedNode({
      key: node.key,
      name: node.name,
      port: node.port,
      role: node.role,
      standbyKey: node.standbyKey,
    });
  }

  const result = await checkNodeHealth(node, settings.healthTimeoutMs);

  if (settings.persistHealthChecks) {
    await db.HealthCheck.create({
      nodeId: node.id,
      success: result.success,
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
      errorMessage: result.errorMessage,
      checkedAt: result.checkedAt,
    });
  }

  let consecutive = node.consecutiveFailures || 0;
  let status = node.status;
  let failureEvent = null;

  if (result.success) {
    consecutive = 0;
    if (status !== "failed_over") status = "healthy";

    // Transient fault cleared before threshold → mark as avoided false positive context
    const pending = pendingInjections.get(node.id);
    if (pending && pending.scenarioCode === "S7") {
      pendingInjections.delete(node.id);
    }
  } else {
    consecutive += 1;
    status = consecutive >= settings.failureThreshold ? "failed" : "degraded";

    if (consecutive === settings.failureThreshold) {
      const pending = pendingInjections.get(node.id);
      const detectedAt = new Date();
      let detectionTimeMs = null;
      if (pending?.injectedAt) {
        detectionTimeMs = detectedAt.getTime() - new Date(pending.injectedAt).getTime();
      }

      failureEvent = await db.FailureEvent.create({
        nodeId: node.id,
        failureType: result.errorMessage || "health_check_failed",
        scenarioCode: pending?.scenarioCode || null,
        consecutiveFails: consecutive,
        injectedAt: pending?.injectedAt || null,
        detectedAt,
        detectionTimeMs,
        isFalsePositive: false,
        details: `Confirmed after ${consecutive} consecutive failed checks`,
      });

      pendingInjections.delete(node.id);
      emit("failure:detected", { node, failure: failureEvent });

      if (settings.autoRecoveryEnabled) {
        await node.update({ status: "recovering", consecutiveFailures: consecutive, lastCheckedAt: result.checkedAt, lastLatencyMs: result.latencyMs });
        const recovery = await executeRecovery(node, failureEvent, settings);
        emit("recovery:completed", { nodeId: node.id, recovery });
        const fresh = await db.NetworkNode.findByPk(node.id);
        emit("node:updated", fresh);
        return;
      }
    }
  }

  await node.update({
    status,
    consecutiveFailures: consecutive,
    lastCheckedAt: result.checkedAt,
    lastLatencyMs: result.latencyMs,
  });

  const fresh = await db.NetworkNode.findByPk(node.id);
  emit("node:updated", fresh);
  emit("health:checked", {
    nodeId: node.id,
    key: node.key,
    success: result.success,
    latencyMs: result.latencyMs,
    status: fresh.status,
    consecutiveFailures: fresh.consecutiveFailures,
  });
}

async function runCycle() {
  if (running) return;
  running = true;
  try {
    // Full heal every ~15s (marks healthy + clears consecutiveFailures for UI-added nodes)
    const now = Date.now();
    if (now - lastFullSyncAt > 15000) {
      lastFullSyncAt = now;
      try {
        const sync = await syncLocalLabNodesFromDb();
        if (sync.healed > 0) {
          console.log(`[monitor] re-synced local lab services (healed ${sync.healed})`);
        }
      } catch (e) {
        console.warn("[monitor] local sync skipped:", e.message);
      }
    }

    const settings = await getSettingsMap();
    const nodes = await db.NetworkNode.findAll({
      where: { isMonitored: true },
      order: [["name", "ASC"]],
    });
    for (const node of nodes) {
      // sequential recovery keeps concurrent multi-node failures orderly (S8)
      await processNode(node, settings);
    }
    emit("monitor:cycle", { at: new Date().toISOString(), count: nodes.length });
  } catch (error) {
    console.error("[monitor] cycle error:", error.message);
  } finally {
    running = false;
  }
}

async function startMonitoring(io) {
  ioRef = io;
  if (timer) clearInterval(timer);
  const settings = await getSettingsMap();
  try {
    await syncLocalLabNodesFromDb();
    lastFullSyncAt = Date.now();
  } catch (e) {
    console.warn("[monitor] startup sync skipped:", e.message);
  }
  await runCycle();
  timer = setInterval(runCycle, settings.checkIntervalMs);
  console.log(`[monitor] started — interval ${settings.checkIntervalMs}ms, threshold ${settings.failureThreshold}`);
}

function stopMonitoring() {
  if (timer) clearInterval(timer);
  timer = null;
}

function registerInjection(nodeId, meta) {
  pendingInjections.set(nodeId, meta);
}

function clearInjection(nodeId) {
  pendingInjections.delete(nodeId);
}

async function reloadInterval() {
  if (!timer) return;
  const settings = await getSettingsMap();
  clearInterval(timer);
  timer = setInterval(runCycle, settings.checkIntervalMs);
}

module.exports = {
  startMonitoring,
  stopMonitoring,
  runCycle,
  registerInjection,
  clearInjection,
  reloadInterval,
  getSettingsMap,
};
