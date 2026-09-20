const axios = require("axios");
const db = require("../database/models");
const { registerInjection, getSettingsMap, reloadInterval, runCycle } = require("../engines/monitoringEngine");
const { executeRecovery } = require("../engines/recoveryEngine");
const { checkNodeHealth } = require("../engines/healthChecker");
const {
  isLocalHost,
  ensureSimulatedNode,
  syncLocalLabNodesFromDb,
} = require("../engines/labProvisioner");
const { Op } = require("sequelize");

const SCENARIOS = {
  S1: { label: "Container/service unresponsive", mode: "unresponsive", policyHint: "restart" },
  S2: { label: "Health endpoint HTTP 500", mode: "http500", policyHint: "restart" },
  S3: { label: "Health endpoint timeout", mode: "timeout", policyHint: "restart" },
  S4: { label: "Primary fails with standby", mode: "crashed", policyHint: "failover" },
  S5: { label: "Service crash", mode: "crashed", policyHint: "restart" },
  S6: { label: "Dependency failure", mode: "dependency", policyHint: "restart" },
  S7: { label: "Transient fault (clears before threshold)", mode: "http500", policyHint: "none", transient: true },
  S8: { label: "Multiple nodes fail concurrently", mode: "http500", policyHint: "restart", multi: true },
};

const SIMULATE_CONTROL_URL = process.env.SIMULATE_CONTROL_URL || "http://127.0.0.1:9399";

async function nextFreeLabPort(preferred) {
  const used = new Set(
    (await db.NetworkNode.findAll({ attributes: ["port"] })).map((n) => Number(n.port))
  );
  let port = Number(preferred);
  if (!port || used.has(port)) {
    port = 9407;
    while (used.has(port) && port < 9500) port += 1;
  }
  return port;
}

async function listNodes(req, res) {
  // Refresh/local page load: bring local lab services online like the defaults
  if (String(req.query.heal || "1") !== "0") {
    try {
      await syncLocalLabNodesFromDb();
    } catch (e) {
      console.warn("[nodes] heal skipped:", e.message);
    }
  }
  const data = await db.NetworkNode.findAll({ order: [["name", "ASC"]] });
  return res.json({ success: true, data });
}

async function getNode(req, res) {
  const node = await db.NetworkNode.findByPk(req.params.id);
  if (!node) return res.status(404).json({ success: false, message: "Node not found" });
  return res.json({ success: true, data: node });
}

async function createNode(req, res) {
  try {
    const body = req.body || {};
    const key = String(body.key || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    const name = String(body.name || "").trim();
    const host = String(body.host || "127.0.0.1").trim() || "127.0.0.1";
    let port = Number(body.port);
    const healthPath = String(body.healthPath || "/health").trim() || "/health";
    const autoProvision = body.autoProvision !== false;

    if (!key || !name) {
      return res.status(400).json({
        success: false,
        message: "key and name are required",
      });
    }

    const exists = await db.NetworkNode.findOne({ where: { key } });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: `Service key '${key}' already exists`,
      });
    }

    if (isLocalHost(host)) {
      port = await nextFreeLabPort(port);
    } else if (!port) {
      return res.status(400).json({ success: false, message: "port is required for remote hosts" });
    }

    let provision = null;
    if (autoProvision && isLocalHost(host)) {
      // If preferred port is busy in simulate, try a few next ports
      let lastErr = null;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const tryPort = port + attempt;
        provision = await ensureSimulatedNode({
          key,
          name,
          port: tryPort,
          role: body.role || "primary",
          standbyKey: body.standbyKey || null,
        });
        if (provision.ok) {
          port = tryPort;
          lastErr = null;
          break;
        }
        lastErr = provision.message;
        // if key conflict unrelated to port, stop
        if (String(provision.message || "").includes("already exists")) break;
      }
      if (!provision?.ok) {
        return res.status(400).json({
          success: false,
          message: lastErr || "Could not start local lab service on a free port",
        });
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    const probeTarget = { host, port, healthPath };
    let health = await checkNodeHealth(probeTarget, 3000);
    if (!health.success && autoProvision && isLocalHost(host)) {
      await new Promise((r) => setTimeout(r, 300));
      health = await checkNodeHealth(probeTarget, 3000);
    }
    if (!health.success) {
      return res.status(400).json({
        success: false,
        message: `Health check failed at http://${host}:${port}${healthPath} (${health.errorMessage || "unreachable"}).`,
        health,
        provision,
      });
    }

    const node = await db.NetworkNode.create({
      key,
      name,
      description: body.description || null,
      host,
      port,
      healthPath,
      recoverPath: body.recoverPath || "/admin/recover",
      injectPath: body.injectPath || "/admin/inject",
      role: body.role || "primary",
      standbyKey: body.standbyKey || null,
      recoveryPolicy: body.recoveryPolicy || "restart",
      isMonitored: body.isMonitored !== false,
      isActive: body.isActive !== false,
      status: "healthy",
      consecutiveFailures: 0,
      lastCheckedAt: health.checkedAt,
      lastLatencyMs: health.latencyMs,
    });

    // Align with other services immediately
    try {
      await runCycle();
    } catch (e) {
      // ignore
    }

    return res.status(201).json({
      success: true,
      message: `Service added on port ${port} and is working like the other lab services.`,
      data: node,
      health,
      provision,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
}

/**
 * Re-check + optionally auto-start simulated process for an existing DB node.
 */
async function provisionNode(req, res) {
  try {
    const node = await db.NetworkNode.findByPk(req.params.id);
    if (!node) return res.status(404).json({ success: false, message: "Node not found" });

    let provision = null;
    if (isLocalHost(node.host)) {
      provision = await ensureSimulatedNode({
        key: node.key,
        name: node.name,
        port: node.port,
        role: node.role,
        standbyKey: node.standbyKey,
      });
      if (!provision.ok) {
        return res.status(400).json({ success: false, message: provision.message, provision });
      }
      await new Promise((r) => setTimeout(r, 150));
    }

    const health = await checkNodeHealth(node, 3000);
    if (!health.success) {
      return res.status(400).json({
        success: false,
        message: `Still unreachable: ${health.errorMessage || "health failed"}`,
        health,
        provision,
      });
    }

    await node.update({
      status: "healthy",
      consecutiveFailures: 0,
      lastCheckedAt: health.checkedAt,
      lastLatencyMs: health.latencyMs,
    });

    return res.json({
      success: true,
      message: "Service is reachable and marked healthy.",
      data: node,
      health,
      provision,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateNode(req, res) {
  const node = await db.NetworkNode.findByPk(req.params.id);
  if (!node) return res.status(404).json({ success: false, message: "Node not found" });
  await node.update(req.body);
  return res.json({ success: true, data: node });
}

async function deleteNode(req, res) {
  const node = await db.NetworkNode.findByPk(req.params.id);
  if (!node) return res.status(404).json({ success: false, message: "Node not found" });
  await node.destroy();
  return res.json({ success: true, message: "Node deleted" });
}

async function listFailures(req, res) {
  const data = await db.FailureEvent.findAll({
    include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
    order: [["detectedAt", "DESC"]],
    limit: Number(req.query.limit || 100),
  });
  return res.json({ success: true, data });
}

async function listRecoveries(req, res) {
  const data = await db.RecoveryAction.findAll({
    include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
    order: [["startedAt", "DESC"]],
    limit: Number(req.query.limit || 100),
  });
  return res.json({ success: true, data });
}

async function listHealthChecks(req, res) {
  const where = {};
  if (req.query.nodeId) where.nodeId = req.query.nodeId;
  const data = await db.HealthCheck.findAll({
    where,
    order: [["checkedAt", "DESC"]],
    limit: Number(req.query.limit || 50),
  });
  return res.json({ success: true, data });
}

async function dashboard(req, res) {
  // Same heal path as Our services — UI-added lab nodes come back after simulate restart
  try {
    await syncLocalLabNodesFromDb();
  } catch (e) {
    console.warn("[dashboard] heal skipped:", e.message);
  }

  const nodes = await db.NetworkNode.findAll();
  const failures = await db.FailureEvent.count();
  const recoveries = await db.RecoveryAction.findAll({ attributes: ["success", "durationMs", "actionType"] });
  const openFailures = await db.FailureEvent.count({ where: { resolvedAt: null } });

  const successRecoveries = recoveries.filter((r) => r.success);
  const avgRecoveryMs =
    successRecoveries.length === 0
      ? 0
      : Math.round(successRecoveries.reduce((s, r) => s + (r.durationMs || 0), 0) / successRecoveries.length);

  const detectionRows = await db.FailureEvent.findAll({
    where: { detectionTimeMs: { [Op.ne]: null } },
    attributes: ["detectionTimeMs"],
  });
  const avgDetectionMs =
    detectionRows.length === 0
      ? 0
      : Math.round(detectionRows.reduce((s, r) => s + (r.detectionTimeMs || 0), 0) / detectionRows.length);

  const falsePositives = await db.FailureEvent.count({ where: { isFalsePositive: true } });
  const recoverySuccessRate =
    recoveries.length === 0 ? 100 : Math.round((successRecoveries.length / recoveries.length) * 1000) / 10;

  return res.json({
    success: true,
    data: {
      totals: {
        nodes: nodes.length,
        healthy: nodes.filter((n) => n.status === "healthy").length,
        failed: nodes.filter((n) => n.status === "failed" || n.status === "recovering").length,
        standby: nodes.filter((n) => n.role === "standby").length,
        failures,
        openFailures,
        recoveries: recoveries.length,
      },
      kpis: {
        avgDetectionMs,
        avgRecoveryMs,
        recoverySuccessRate,
        falsePositiveRate:
          failures === 0 ? 0 : Math.round((falsePositives / failures) * 1000) / 10,
      },
      nodes,
    },
  });
}

async function getSettings(req, res) {
  const rows = await db.SystemSetting.findAll();
  const data = {};
  rows.forEach((r) => {
    data[r.key] = r.value;
  });
  return res.json({ success: true, data, scenarios: SCENARIOS });
}

async function updateSettings(req, res) {
  const allowed = [
    "checkIntervalMs",
    "failureThreshold",
    "healthTimeoutMs",
    "autoRecoveryEnabled",
    "persistHealthChecks",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const [row] = await db.SystemSetting.findOrCreate({
        where: { key },
        defaults: { value: String(req.body[key]), description: key },
      });
      await row.update({ value: String(req.body[key]) });
    }
  }
  await reloadInterval();
  return getSettings(req, res);
}

async function injectFailure(req, res) {
  try {
    const { nodeId, scenarioCode, mode } = req.body;
    const node = await db.NetworkNode.findByPk(nodeId);
    if (!node) return res.status(404).json({ success: false, message: "Node not found" });

    const scenario = scenarioCode ? SCENARIOS[scenarioCode] : null;
    const injectMode = mode || scenario?.mode || "http500";
    const injectedAt = new Date();

    if (scenarioCode === "S4") {
      await node.update({ recoveryPolicy: "failover" });
    }

    const url = `http://${node.host}:${node.port}${node.injectPath || "/admin/inject"}`;
    await axios.post(
      url,
      { mode: injectMode, timeoutMs: 8000 },
      { timeout: 5000, validateStatus: () => true }
    );

    registerInjection(node.id, {
      scenarioCode: scenarioCode || null,
      injectedAt,
      mode: injectMode,
    });

    // S7: clear fault before threshold so no recovery should fire
    if (scenario?.transient) {
      const settings = await getSettingsMap();
      const clearAfter = Math.max(500, settings.checkIntervalMs * (settings.failureThreshold - 1) - 500);
      setTimeout(async () => {
        try {
          await axios.post(
            url,
            { mode: "healthy" },
            { timeout: 5000, validateStatus: () => true }
          );
        } catch {
          // ignore
        }
      }, clearAfter);
    }

    // S8 handled by caller sending multiple injects; also support nodeIds array
    return res.json({
      success: true,
      message: `Failure injected (${scenarioCode || injectMode})`,
      data: { nodeId: node.id, scenarioCode, mode: injectMode, injectedAt },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function injectMulti(req, res) {
  const { nodeIds, scenarioCode = "S8", mode = "http500" } = req.body;
  if (!Array.isArray(nodeIds) || nodeIds.length < 2) {
    return res.status(400).json({ success: false, message: "Provide at least two nodeIds" });
  }
  const results = [];
  for (const nodeId of nodeIds) {
    req.body = { nodeId, scenarioCode, mode };
    // reuse inject logic inline
    const node = await db.NetworkNode.findByPk(nodeId);
    if (!node) continue;
    const injectedAt = new Date();
    const url = `http://${node.host}:${node.port}${node.injectPath}`;
    await axios.post(url, { mode }, { timeout: 5000, validateStatus: () => true });
    registerInjection(node.id, { scenarioCode, injectedAt, mode });
    results.push(node.key);
  }
  return res.json({ success: true, message: "Multi-node failure injected", data: results });
}

async function manualRecover(req, res) {
  const node = await db.NetworkNode.findByPk(req.params.id);
  if (!node) return res.status(404).json({ success: false, message: "Node not found" });
  const recovery = await executeRecovery(node, null, await getSettingsMap());
  return res.json({ success: true, data: recovery });
}

function dayKey(date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

function avg(nums) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/** Supported live ranges → window + chart bucket size */
const RANGE_PRESETS = {
  "15m": { ms: 15 * 60 * 1000, bucketMs: 30 * 1000, label: "Last 15 minutes", bucketLabel: "every 30 seconds" },
  "1h": { ms: 60 * 60 * 1000, bucketMs: 60 * 1000, label: "Last 1 hour", bucketLabel: "every 1 minute" },
  "6h": { ms: 6 * 60 * 60 * 1000, bucketMs: 5 * 60 * 1000, label: "Last 6 hours", bucketLabel: "every 5 minutes" },
  "24h": { ms: 24 * 60 * 60 * 1000, bucketMs: 15 * 60 * 1000, label: "Last 24 hours", bucketLabel: "every 15 minutes" },
  "7d": { ms: 7 * 24 * 60 * 60 * 1000, bucketMs: 60 * 60 * 1000, label: "Last 7 days", bucketLabel: "every 1 hour" },
  "30d": { ms: 30 * 24 * 60 * 60 * 1000, bucketMs: 24 * 60 * 60 * 1000, label: "Last 30 days", bucketLabel: "every 1 day" },
};

function resolveRange(query) {
  const key = String(query.range || query.window || "").trim();
  if (RANGE_PRESETS[key]) return { key, ...RANGE_PRESETS[key] };

  // backward compatible: hours=24
  const hours = Number(query.hours);
  if (!Number.isNaN(hours) && hours > 0) {
    if (hours <= 1) return { key: "1h", ...RANGE_PRESETS["1h"] };
    if (hours <= 6) return { key: "6h", ...RANGE_PRESETS["6h"] };
    if (hours <= 24) return { key: "24h", ...RANGE_PRESETS["24h"] };
    if (hours <= 168) return { key: "7d", ...RANGE_PRESETS["7d"] };
    return { key: "30d", ...RANGE_PRESETS["30d"] };
  }

  // default: short interval for live demos
  return { key: "15m", ...RANGE_PRESETS["15m"] };
}

function bucketKey(date, bucketMs) {
  const t = new Date(date).getTime();
  const aligned = Math.floor(t / bucketMs) * bucketMs;
  return new Date(aligned).toISOString();
}

function fillTimelineBuckets(since, until, bucketMs, events) {
  const map = {};
  for (let t = Math.floor(since.getTime() / bucketMs) * bucketMs; t <= until.getTime(); t += bucketMs) {
    const iso = new Date(t).toISOString();
    map[iso] = { time: iso, failures: 0, recoveries: 0, successfulRecoveries: 0 };
  }
  for (const e of events.failures || []) {
    const k = bucketKey(e.at, bucketMs);
    if (!map[k]) map[k] = { time: k, failures: 0, recoveries: 0, successfulRecoveries: 0 };
    map[k].failures += 1;
  }
  for (const e of events.recoveries || []) {
    const k = bucketKey(e.at, bucketMs);
    if (!map[k]) map[k] = { time: k, failures: 0, recoveries: 0, successfulRecoveries: 0 };
    map[k].recoveries += 1;
    if (e.success) map[k].successfulRecoveries += 1;
  }
  return Object.values(map).sort((a, b) => a.time.localeCompare(b.time));
}

async function metrics(req, res) {
  const range = resolveRange(req.query);
  const until = new Date();
  const since = new Date(until.getTime() - range.ms);

  const failures = await db.FailureEvent.findAll({
    where: { detectedAt: { [Op.gte]: since } },
    include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
    order: [["detectedAt", "ASC"]],
    limit: 2000,
  });
  const recoveries = await db.RecoveryAction.findAll({
    where: { startedAt: { [Op.gte]: since } },
    include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
    order: [["startedAt", "ASC"]],
    limit: 2000,
  });
  const healthChecks = await db.HealthCheck.findAll({
    where: { checkedAt: { [Op.gte]: since } },
    attributes: ["success", "latencyMs", "checkedAt", "nodeId"],
    order: [["checkedAt", "ASC"]],
    limit: 8000,
  });
  const nodes = await db.NetworkNode.findAll();

  const byScenario = {};
  for (const f of failures) {
    const code = f.scenarioCode || "OTHER";
    if (!byScenario[code]) byScenario[code] = { count: 0, detectionTimes: [], recoveries: [] };
    byScenario[code].count += 1;
    if (f.detectionTimeMs != null) byScenario[code].detectionTimes.push(f.detectionTimeMs);
  }
  for (const r of recoveries) {
    const fail = failures.find((f) => f.id === r.failureEventId);
    const code = fail?.scenarioCode || "OTHER";
    if (!byScenario[code]) byScenario[code] = { count: 0, detectionTimes: [], recoveries: [] };
    byScenario[code].recoveries.push(r);
  }

  const summary = Object.entries(byScenario).map(([code, v]) => ({
    scenarioCode: code,
    label: SCENARIOS[code]?.label || code,
    plainLabel:
      {
        S1: "Service stopped answering",
        S2: "Service returned an error",
        S3: "Service was too slow",
        S4: "Main service failed — switch to backup",
        S5: "Service crashed",
        S6: "Needed helper service failed",
        S7: "Short glitch (should NOT auto-fix)",
        S8: "Several services failed together",
      }[code] || code,
    failures: v.count,
    avgDetectionMs: v.detectionTimes.length ? avg(v.detectionTimes) : null,
    avgRecoveryMs: v.recoveries.filter((x) => x.success).length
      ? avg(v.recoveries.filter((x) => x.success).map((x) => x.durationMs || 0))
      : null,
    recoverySuccessRate: v.recoveries.length
      ? Math.round((v.recoveries.filter((x) => x.success).length / v.recoveries.length) * 1000) / 10
      : null,
  }));

  const timeline = fillTimelineBuckets(since, until, range.bucketMs, {
    failures: failures.map((f) => ({ at: f.detectedAt })),
    recoveries: recoveries.map((r) => ({ at: r.startedAt, success: r.success })),
  });

  // Speed trend uses same short buckets for live demos
  const speedMap = {};
  for (const point of timeline) {
    speedMap[point.time] = {
      time: point.time,
      avgDetectionMs: null,
      avgRecoveryMs: null,
      _det: [],
      _rec: [],
    };
  }
  for (const f of failures) {
    if (f.detectionTimeMs == null) continue;
    const k = bucketKey(f.detectedAt, range.bucketMs);
    if (!speedMap[k]) speedMap[k] = { time: k, avgDetectionMs: null, avgRecoveryMs: null, _det: [], _rec: [] };
    speedMap[k]._det.push(f.detectionTimeMs);
  }
  for (const r of recoveries) {
    if (!r.success || r.durationMs == null) continue;
    const k = bucketKey(r.startedAt, range.bucketMs);
    if (!speedMap[k]) speedMap[k] = { time: k, avgDetectionMs: null, avgRecoveryMs: null, _det: [], _rec: [] };
    speedMap[k]._rec.push(r.durationMs);
  }
  const speedTrend = Object.values(speedMap)
    .sort((a, b) => a.time.localeCompare(b.time))
    .map((p) => ({
      time: p.time,
      day: p.time,
      avgDetectionMs: p._det.length ? avg(p._det) : 0,
      avgRecoveryMs: p._rec.length ? avg(p._rec) : 0,
    }));

  // Daily trend (still useful for long ranges)
  const dailyMap = {};
  for (const f of failures) {
    const k = dayKey(f.detectedAt);
    if (!dailyMap[k]) dailyMap[k] = { day: k, failures: 0, recoveries: 0, avgDetectionMs: [], avgRecoveryMs: [] };
    dailyMap[k].failures += 1;
    if (f.detectionTimeMs != null) dailyMap[k].avgDetectionMs.push(f.detectionTimeMs);
  }
  for (const r of recoveries) {
    const k = dayKey(r.startedAt);
    if (!dailyMap[k]) dailyMap[k] = { day: k, failures: 0, recoveries: 0, avgDetectionMs: [], avgRecoveryMs: [] };
    dailyMap[k].recoveries += 1;
    if (r.success && r.durationMs != null) dailyMap[k].avgRecoveryMs.push(r.durationMs);
  }
  const dailyTrend = Object.values(dailyMap)
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({
      day: d.day,
      failures: d.failures,
      recoveries: d.recoveries,
      avgDetectionMs: avg(d.avgDetectionMs),
      avgRecoveryMs: avg(d.avgRecoveryMs),
    }));

  // Status pie
  const statusBreakdown = [
    { name: "Working well", key: "healthy", value: nodes.filter((n) => n.status === "healthy").length },
    { name: "Having trouble", key: "degraded", value: nodes.filter((n) => n.status === "degraded").length },
    { name: "Failed / fixing", key: "failed", value: nodes.filter((n) => ["failed", "recovering"].includes(n.status)).length },
    { name: "Switched to backup", key: "failed_over", value: nodes.filter((n) => n.status === "failed_over").length },
    { name: "Unknown / other", key: "other", value: nodes.filter((n) => !["healthy", "degraded", "failed", "recovering", "failed_over"].includes(n.status)).length },
  ].filter((x) => x.value > 0);

  // Recovery action types
  const actionBreakdown = [
    {
      name: "Restart service",
      value: recoveries.filter((r) => r.actionType === "restart").length,
    },
    {
      name: "Switch to backup",
      value: recoveries.filter((r) => r.actionType === "failover").length,
    },
  ].filter((x) => x.value > 0);

  // Per-node reliability
  const perNode = nodes.map((n) => {
    const nodeFails = failures.filter((f) => f.nodeId === n.id).length;
    const nodeRec = recoveries.filter((r) => r.nodeId === n.id);
    const okRec = nodeRec.filter((r) => r.success).length;
    const nodeHealth = healthChecks.filter((h) => h.nodeId === n.id);
    const okHealth = nodeHealth.filter((h) => h.success).length;
    return {
      key: n.key,
      name: n.name,
      status: n.status,
      failures: nodeFails,
      recoveries: nodeRec.length,
      recoverySuccessRate: nodeRec.length ? Math.round((okRec / nodeRec.length) * 1000) / 10 : 100,
      uptimePercent: nodeHealth.length ? Math.round((okHealth / nodeHealth.length) * 1000) / 10 : null,
      avgLatencyMs: nodeHealth.length ? avg(nodeHealth.map((h) => h.latencyMs || 0)) : null,
    };
  });

  // Latency over time using same dynamic buckets
  const latencyMap = {};
  for (const h of healthChecks) {
    if (!h.success || h.latencyMs == null) continue;
    const k = bucketKey(h.checkedAt, range.bucketMs);
    if (!latencyMap[k]) latencyMap[k] = [];
    latencyMap[k].push(h.latencyMs);
  }
  const latencyTrend = Object.entries(latencyMap)
    .map(([time, vals]) => ({ time, avgLatencyMs: avg(vals) }))
    .sort((a, b) => a.time.localeCompare(b.time));

  const successRecoveries = recoveries.filter((r) => r.success);
  const falsePositives = failures.filter((f) => f.isFalsePositive).length;
  const healthOk = healthChecks.filter((h) => h.success).length;

  const kpis = {
    totalFailures: failures.length,
    totalRecoveries: recoveries.length,
    recoverySuccessRate: recoveries.length
      ? Math.round((successRecoveries.length / recoveries.length) * 1000) / 10
      : 100,
    avgDetectionMs: avg(failures.map((f) => f.detectionTimeMs).filter((x) => x != null)),
    avgRecoveryMs: avg(successRecoveries.map((r) => r.durationMs || 0)),
    falsePositiveRate: failures.length ? Math.round((falsePositives / failures.length) * 1000) / 10 : 0,
    healthSuccessRate: healthChecks.length ? Math.round((healthOk / healthChecks.length) * 1000) / 10 : 100,
    monitoredNodes: nodes.filter((n) => n.isMonitored).length,
    range: range.key,
    rangeLabel: range.label,
    bucketLabel: range.bucketLabel,
    bucketMs: range.bucketMs,
  };

  return res.json({
    success: true,
    data: {
      summary,
      kpis,
      range: {
        key: range.key,
        label: range.label,
        bucketLabel: range.bucketLabel,
        bucketMs: range.bucketMs,
        since: since.toISOString(),
        until: until.toISOString(),
        presets: Object.entries(RANGE_PRESETS).map(([key, v]) => ({
          key,
          label: v.label,
          bucketLabel: v.bucketLabel,
        })),
      },
      timeline,
      speedTrend,
      dailyTrend,
      statusBreakdown,
      actionBreakdown,
      perNode,
      latencyTrend,
      failures: failures.slice(-100).reverse(),
      recoveries: recoveries.slice(-100).reverse(),
      scenarios: SCENARIOS,
      plainExplanation: {
        whatWeWatch:
          "We watch internal university lab services (website, app, portal, API) — not the whole internet and not your home Wi‑Fi.",
        howItHelps:
          "When a service stops working, the system notices and tries to bring it back automatically, then shows you what happened in charts.",
      },
    },
  });
}

async function forceMonitorCycle(req, res) {
  await runCycle();
  return res.json({ success: true, message: "Monitor cycle executed" });
}

/**
 * Admin-only general system report for dissertation / management overview.
 */
async function generalReport(req, res) {
  try {
    const range = resolveRange(req.query);
    const until = new Date();
    const since = new Date(until.getTime() - range.ms);

    const [nodes, users, settingsRows, failuresAll, recoveriesAll, failures, recoveries, healthChecks] =
      await Promise.all([
        db.NetworkNode.findAll({ order: [["name", "ASC"]] }),
        db.User.findAll({
          attributes: ["id", "names", "email", "role", "phone", "active", "createdAt"],
          order: [["names", "ASC"]],
        }),
        db.SystemSetting.findAll(),
        db.FailureEvent.findAll({
          include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
          order: [["detectedAt", "DESC"]],
        }),
        db.RecoveryAction.findAll({
          include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
          order: [["startedAt", "DESC"]],
        }),
        db.FailureEvent.findAll({
          where: { detectedAt: { [Op.gte]: since } },
          include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
          order: [["detectedAt", "DESC"]],
        }),
        db.RecoveryAction.findAll({
          where: { startedAt: { [Op.gte]: since } },
          include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
          order: [["startedAt", "DESC"]],
        }),
        db.HealthCheck.findAll({
          where: { checkedAt: { [Op.gte]: since } },
          attributes: ["success", "latencyMs", "checkedAt", "nodeId"],
        }),
      ]);

    const settings = {};
    for (const s of settingsRows) settings[s.key] = s.value;

    const successRecoveries = recoveries.filter((r) => r.success);
    const falsePositives = failures.filter((f) => f.isFalsePositive).length;
    const healthOk = healthChecks.filter((h) => h.success).length;
    const openFailures = failuresAll.filter((f) => !f.resolvedAt).length;

    const byScenario = {};
    for (const f of failures) {
      const code = f.scenarioCode || "OTHER";
      if (!byScenario[code]) byScenario[code] = { count: 0, detectionTimes: [], recoveries: [] };
      byScenario[code].count += 1;
      if (f.detectionTimeMs != null) byScenario[code].detectionTimes.push(f.detectionTimeMs);
    }
    for (const r of recoveries) {
      const fail = failures.find((f) => f.id === r.failureEventId);
      const code = fail?.scenarioCode || "OTHER";
      if (!byScenario[code]) byScenario[code] = { count: 0, detectionTimes: [], recoveries: [] };
      byScenario[code].recoveries.push(r);
    }

    const scenarioSummary = Object.entries(byScenario)
      .map(([code, v]) => ({
        scenarioCode: code,
        label: SCENARIOS[code]?.label || code,
        failures: v.count,
        avgDetectionMs: v.detectionTimes.length ? avg(v.detectionTimes) : null,
        avgRecoveryMs: v.recoveries.filter((x) => x.success).length
          ? avg(v.recoveries.filter((x) => x.success).map((x) => x.durationMs || 0))
          : null,
        recoverySuccessRate: v.recoveries.length
          ? Math.round((v.recoveries.filter((x) => x.success).length / v.recoveries.length) * 1000) / 10
          : null,
      }))
      .sort((a, b) => a.scenarioCode.localeCompare(b.scenarioCode));

    const perNode = nodes.map((n) => {
      const nodeFails = failures.filter((f) => f.nodeId === n.id);
      const nodeRec = recoveries.filter((r) => r.nodeId === n.id);
      const okRec = nodeRec.filter((r) => r.success).length;
      const nodeHealth = healthChecks.filter((h) => h.nodeId === n.id);
      const okHealth = nodeHealth.filter((h) => h.success).length;
      return {
        id: n.id,
        key: n.key,
        name: n.name,
        role: n.role,
        status: n.status,
        recoveryPolicy: n.recoveryPolicy,
        isMonitored: n.isMonitored,
        host: n.host,
        port: n.port,
        failures: nodeFails.length,
        recoveries: nodeRec.length,
        recoverySuccessRate: nodeRec.length ? Math.round((okRec / nodeRec.length) * 1000) / 10 : null,
        uptimePercent: nodeHealth.length ? Math.round((okHealth / nodeHealth.length) * 1000) / 10 : null,
        avgLatencyMs: nodeHealth.length ? avg(nodeHealth.map((h) => h.latencyMs || 0)) : null,
      };
    });

    const roleCounts = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    const kpis = {
      totalServices: nodes.length,
      monitoredServices: nodes.filter((n) => n.isMonitored).length,
      healthyServices: nodes.filter((n) => n.status === "healthy").length,
      troubledServices: nodes.filter((n) => ["failed", "degraded", "recovering", "failed_over"].includes(n.status))
        .length,
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.active).length,
      failuresInRange: failures.length,
      recoveriesInRange: recoveries.length,
      failuresAllTime: failuresAll.length,
      recoveriesAllTime: recoveriesAll.length,
      openFailures,
      recoverySuccessRate: recoveries.length
        ? Math.round((successRecoveries.length / recoveries.length) * 1000) / 10
        : 100,
      avgDetectionMs: avg(failures.map((f) => f.detectionTimeMs).filter((x) => x != null)),
      avgRecoveryMs: avg(successRecoveries.map((r) => r.durationMs || 0)),
      falsePositiveRate: failures.length ? Math.round((falsePositives / failures.length) * 1000) / 10 : 0,
      healthSuccessRate: healthChecks.length ? Math.round((healthOk / healthChecks.length) * 1000) / 10 : 100,
      healthChecksInRange: healthChecks.length,
      restartActions: recoveries.filter((r) => r.actionType === "restart").length,
      failoverActions: recoveries.filter((r) => r.actionType === "failover").length,
    };

    const narrative = [
      `This general report summarises the Automatic Failure Detection and Recovery System for the University of Kigali LAN laboratory.`,
      `Reporting window: ${range.label} (${since.toISOString()} to ${until.toISOString()}).`,
      `The laboratory currently manages ${kpis.totalServices} services (${kpis.monitoredServices} monitored), with ${kpis.healthyServices} currently healthy.`,
      `In this period the system confirmed ${kpis.failuresInRange} failure(s) and ran ${kpis.recoveriesInRange} recovery action(s), with a recovery success rate of ${kpis.recoverySuccessRate}%.`,
      `Average detection time was ${kpis.avgDetectionMs ?? 0} ms and average successful recovery time was ${kpis.avgRecoveryMs ?? 0} ms.`,
      `Health-check success rate was ${kpis.healthSuccessRate}%. False-positive rate was ${kpis.falsePositiveRate}%.`,
      `There are ${kpis.totalUsers} system users across roles (admin, ICT officer, viewer).`,
    ].join(" ");

    return res.json({
      success: true,
      data: {
        generatedAt: until.toISOString(),
        generatedBy: {
          id: req.user?.id || null,
          names: req.user?.names || null,
          email: req.user?.email || null,
          role: req.user?.role || null,
        },
        range: {
          key: range.key,
          label: range.label,
          since: since.toISOString(),
          until: until.toISOString(),
          presets: Object.entries(RANGE_PRESETS).map(([key, v]) => ({
            key,
            label: v.label,
          })),
        },
        narrative,
        kpis,
        settings,
        roleCounts,
        scenarioSummary,
        perNode,
        users: users.map((u) => ({
          names: u.names,
          email: u.email,
          role: u.role,
          phone: u.phone,
          active: u.active,
          createdAt: u.createdAt,
        })),
        recentFailures: failures.slice(0, 15).map((f) => ({
          id: f.id,
          service: f.node?.name || f.nodeId,
          failureType: f.failureType,
          scenarioCode: f.scenarioCode,
          detectionTimeMs: f.detectionTimeMs,
          detectedAt: f.detectedAt,
          resolvedAt: f.resolvedAt,
          isFalsePositive: f.isFalsePositive,
        })),
        recentRecoveries: recoveries.slice(0, 15).map((r) => ({
          id: r.id,
          service: r.node?.name || r.nodeId,
          actionType: r.actionType,
          success: r.success,
          durationMs: r.durationMs,
          startedAt: r.startedAt,
          targetNodeKey: r.targetNodeKey,
        })),
        title: "Automatic Failure Detection and Recovery System — General Report",
        institution: "University of Kigali",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Unified activity timeline: failures, recoveries, and notable health checks.
 */
async function activityLogs(req, res) {
  try {
    const limit = Math.min(1000, Math.max(50, Number(req.query.limit || 300)));
    const includeHealthyChecks = String(req.query.includeHealthy || "false") === "true";
    const typeFilter = String(req.query.type || "all"); // all | failure | recovery | health_fail | health_ok

    const [failures, recoveries, healthFails, healthOk] = await Promise.all([
      db.FailureEvent.findAll({
        include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
        order: [["detectedAt", "DESC"]],
        limit,
      }),
      db.RecoveryAction.findAll({
        include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
        order: [["startedAt", "DESC"]],
        limit,
      }),
      db.HealthCheck.findAll({
        where: { success: false },
        include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
        order: [["checkedAt", "DESC"]],
        limit: Math.min(limit, 400),
      }),
      includeHealthyChecks
        ? db.HealthCheck.findAll({
            where: { success: true },
            include: [{ model: db.NetworkNode, as: "node", attributes: ["id", "key", "name"] }],
            order: [["checkedAt", "DESC"]],
            limit: Math.min(limit, 200),
          })
        : Promise.resolve([]),
    ]);

    const logs = [];

    for (const f of failures) {
      logs.push({
        id: `failure-${f.id}`,
        at: f.detectedAt,
        type: "failure",
        level: "danger",
        title: "FAILURE confirmed",
        service: f.node?.name || f.nodeId,
        serviceKey: f.node?.key || null,
        message: f.failureType || "Service failed health checks",
        details: f.details,
        meta: {
          scenarioCode: f.scenarioCode,
          consecutiveFails: f.consecutiveFails,
          detectionTimeMs: f.detectionTimeMs,
          resolvedAt: f.resolvedAt,
          open: !f.resolvedAt,
        },
      });
    }

    for (const r of recoveries) {
      const ok = Boolean(r.success);
      logs.push({
        id: `recovery-${r.id}`,
        at: r.startedAt,
        type: ok ? "auto_fixed" : "recovery_failed",
        level: ok ? "success" : "danger",
        title: ok ? "AUTO FIXED" : "RECOVERY FAILED",
        service: r.node?.name || r.nodeId,
        serviceKey: r.node?.key || null,
        message: ok
          ? `Automatic ${r.actionType} succeeded${r.targetNodeKey ? ` → ${r.targetNodeKey}` : ""}`
          : `Automatic ${r.actionType} failed`,
        details: r.details,
        meta: {
          actionType: r.actionType,
          success: r.success,
          durationMs: r.durationMs,
          targetNodeKey: r.targetNodeKey,
          completedAt: r.completedAt,
        },
      });
    }

    for (const h of healthFails) {
      logs.push({
        id: `health-fail-${h.id}`,
        at: h.checkedAt,
        type: "health_fail",
        level: "warning",
        title: "Health check FAILED",
        service: h.node?.name || h.nodeId,
        serviceKey: h.node?.key || null,
        message: h.errorMessage || `HTTP ${h.statusCode || "error"}`,
        details: null,
        meta: {
          statusCode: h.statusCode,
          latencyMs: h.latencyMs,
        },
      });
    }

    for (const h of healthOk) {
      logs.push({
        id: `health-ok-${h.id}`,
        at: h.checkedAt,
        type: "health_ok",
        level: "info",
        title: "Health check OK",
        service: h.node?.name || h.nodeId,
        serviceKey: h.node?.key || null,
        message: `Healthy reply in ${h.latencyMs != null ? `${h.latencyMs} ms` : "—"}`,
        details: null,
        meta: {
          statusCode: h.statusCode,
          latencyMs: h.latencyMs,
        },
      });
    }

    let filtered = logs;
    if (typeFilter === "failure") filtered = logs.filter((l) => l.type === "failure");
    else if (typeFilter === "recovery") filtered = logs.filter((l) => l.type === "auto_fixed" || l.type === "recovery_failed");
    else if (typeFilter === "health_fail") filtered = logs.filter((l) => l.type === "health_fail");
    else if (typeFilter === "health_ok") filtered = logs.filter((l) => l.type === "health_ok");
    else if (typeFilter === "important") {
      filtered = logs.filter((l) => ["failure", "auto_fixed", "recovery_failed"].includes(l.type));
    }

    filtered.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const data = filtered.slice(0, limit);

    const summary = {
      total: data.length,
      failures: logs.filter((l) => l.type === "failure").length,
      autoFixed: logs.filter((l) => l.type === "auto_fixed").length,
      recoveryFailed: logs.filter((l) => l.type === "recovery_failed").length,
      healthFails: logs.filter((l) => l.type === "health_fail").length,
      healthOk: logs.filter((l) => l.type === "health_ok").length,
    };

    return res.json({ success: true, data, summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Wipe operational history so a presentation starts empty.
 * Does NOT delete users or registered services — only proof data from past tests.
 */
async function clearHistory(req, res) {
  try {
    const deletedRecoveries = await db.RecoveryAction.destroy({ where: {} });
    const deletedFailures = await db.FailureEvent.destroy({ where: {} });
    const deletedChecks = await db.HealthCheck.destroy({ where: {} });

    await db.NetworkNode.update(
      {
        status: "unknown",
        consecutiveFailures: 0,
        lastLatencyMs: null,
        lastCheckedAt: null,
        failedOverToKey: null,
        isActive: true,
      },
      { where: {} }
    );

    // Restore standby monitoring flags
    await db.NetworkNode.update(
      { isMonitored: false, role: "standby", isActive: true },
      { where: { key: { [Op.in]: ["web-standby", "app-standby"] } } }
    );
    await db.NetworkNode.update(
      { isMonitored: true, isActive: true },
      { where: { key: { [Op.notIn]: ["web-standby", "app-standby"] } } }
    );
    await db.NetworkNode.update(
      { recoveryPolicy: "failover", role: "primary" },
      { where: { key: "app-primary" } }
    );
    await db.NetworkNode.update(
      { recoveryPolicy: "restart", role: "primary" },
      { where: { key: { [Op.in]: ["web-primary", "api-service", "portal-service"] } } }
    );

    // Heal all simulated services so baseline is healthy
    const nodes = await db.NetworkNode.findAll();
    for (const node of nodes) {
      try {
        await axios.post(
          `http://${node.host}:${node.port}${node.recoverPath || "/admin/recover"}`,
          {},
          { timeout: 3000, validateStatus: () => true }
        );
      } catch {
        // ignore if node process temporarily unreachable
      }
    }

    return res.json({
      success: true,
      message: "History cleared. Charts are empty until you run a LIVE test.",
      data: { deletedRecoveries, deletedFailures, deletedChecks },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Full lab reset to first-run state:
 * - keep only the 3 default users
 * - restore only the 6 default services
 * - clear all history / charts
 * - restore default settings
 */
async function resetToStart(req, res) {
  try {
    const bcrypt = require("bcryptjs");
    const {
      DEFAULT_NODES,
      DEFAULT_USERS,
      DEFAULT_SETTINGS,
      DEFAULT_USER_EMAILS,
      DEFAULT_NODE_KEYS,
    } = require("../config/labDefaults");

    const deletedRecoveries = await db.RecoveryAction.destroy({ where: {} });
    const deletedFailures = await db.FailureEvent.destroy({ where: {} });
    const deletedChecks = await db.HealthCheck.destroy({ where: {} });

    // Remove extra services first (FK-safe after history wipe)
    const deletedExtraNodes = await db.NetworkNode.destroy({
      where: { key: { [Op.notIn]: DEFAULT_NODE_KEYS } },
    });

    // Restore / recreate the 6 default nodes
    for (const node of DEFAULT_NODES) {
      const [row] = await db.NetworkNode.findOrCreate({
        where: { key: node.key },
        defaults: {
          ...node,
          status: "unknown",
          consecutiveFailures: 0,
          isActive: true,
          healthPath: "/health",
          recoverPath: "/admin/recover",
          injectPath: "/admin/inject",
        },
      });
      await row.update({
        name: node.name,
        description: node.description,
        host: node.host,
        port: node.port,
        role: node.role,
        standbyKey: node.standbyKey,
        recoveryPolicy: node.recoveryPolicy,
        isMonitored: node.isMonitored !== false,
        isActive: true,
        status: "unknown",
        consecutiveFailures: 0,
        lastLatencyMs: null,
        lastCheckedAt: null,
        failedOverToKey: null,
      });
    }

    // Keep only the 3 default accounts
    const deletedExtraUsers = await db.User.destroy({
      where: { email: { [Op.notIn]: DEFAULT_USER_EMAILS } },
    });

    for (const u of DEFAULT_USERS) {
      const [row] = await db.User.findOrCreate({
        where: { email: u.email },
        defaults: {
          names: u.names,
          email: u.email,
          password: await bcrypt.hash(u.password, 10),
          role: u.role,
          phone: u.phone,
          active: true,
          deleted: "no",
        },
      });
      await row.update({
        names: u.names,
        role: u.role,
        phone: u.phone,
        active: true,
        deleted: "no",
        password: await bcrypt.hash(u.password, 10),
      });
    }

    for (const setting of DEFAULT_SETTINGS) {
      const [row] = await db.SystemSetting.findOrCreate({
        where: { key: setting.key },
        defaults: setting,
      });
      await row.update({
        value: setting.value,
        description: setting.description,
      });
    }

    // Heal default simulated services
    const nodes = await db.NetworkNode.findAll({
      where: { key: { [Op.in]: DEFAULT_NODE_KEYS } },
    });
    for (const node of nodes) {
      try {
        await axios.post(
          `http://${node.host}:${node.port}${node.recoverPath || "/admin/recover"}`,
          {},
          { timeout: 3000, validateStatus: () => true }
        );
      } catch {
        // ignore
      }
    }

    try {
      await reloadInterval();
    } catch {
      // ignore
    }

    return res.json({
      success: true,
      message:
        "System reset to start. Kept only the 3 default users and 6 default lab services. History cleared.",
      data: {
        deletedRecoveries,
        deletedFailures,
        deletedChecks,
        deletedExtraNodes,
        deletedExtraUsers,
        keptUsers: DEFAULT_USER_EMAILS,
        keptServices: DEFAULT_NODE_KEYS,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  listNodes,
  getNode,
  createNode,
  updateNode,
  deleteNode,
  provisionNode,
  listFailures,
  listRecoveries,
  listHealthChecks,
  dashboard,
  getSettings,
  updateSettings,
  injectFailure,
  injectMulti,
  manualRecover,
  metrics,
  forceMonitorCycle,
  activityLogs,
  clearHistory,
  resetToStart,
  generalReport,
  SCENARIOS,
};
