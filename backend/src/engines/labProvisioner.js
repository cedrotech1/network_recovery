const axios = require("axios");
const db = require("../database/models");
const { checkNodeHealth } = require("./healthChecker");

const SIMULATE_CONTROL_URL = process.env.SIMULATE_CONTROL_URL || "http://127.0.0.1:9399";

function isLocalHost(host) {
  const h = String(host || "").trim().toLowerCase();
  return !h || h === "127.0.0.1" || h === "localhost" || h === "::1";
}

async function ensureSimulatedNode(payload) {
  try {
    const res = await axios.post(
      `${SIMULATE_CONTROL_URL}/admin/register-node`,
      {
        key: payload.key,
        name: payload.name,
        port: payload.port,
        role: payload.role || "primary",
        standbyKey: payload.standbyKey || null,
      },
      { timeout: 5000, validateStatus: () => true }
    );
    if (res.status >= 200 && res.status < 300 && res.data?.success) {
      return { ok: true, data: res.data.data, message: res.data.message };
    }
    return {
      ok: false,
      message: res.data?.message || `Simulate control returned HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error.code === "ECONNREFUSED"
          ? "Simulated LAN nodes are not running (control :9399)."
          : error.message || "Could not start simulated node",
    };
  }
}

/**
 * Re-create any UI-added local services after simulate restart,
 * then mark healthy when /health succeeds.
 */
async function syncLocalLabNodesFromDb() {
  const nodes = await db.NetworkNode.findAll();
  let started = 0;
  let healed = 0;

  for (const node of nodes) {
    if (!isLocalHost(node.host)) continue;

    const provision = await ensureSimulatedNode({
      key: node.key,
      name: node.name,
      port: node.port,
      role: node.role,
      standbyKey: node.standbyKey,
    });
    if (!provision.ok) continue;
    started += 1;

    await new Promise((r) => setTimeout(r, 80));
    let health = await checkNodeHealth(node, 2500);
    if (!health.success) {
      await new Promise((r) => setTimeout(r, 250));
      health = await checkNodeHealth(node, 2500);
    }
    if (!health.success) continue;

    if (
      node.status !== "healthy" ||
      Number(node.consecutiveFailures || 0) !== 0 ||
      node.lastLatencyMs == null
    ) {
      await node.update({
        status: "healthy",
        consecutiveFailures: 0,
        lastCheckedAt: health.checkedAt,
        lastLatencyMs: health.latencyMs,
        failedOverToKey: null,
      });
      healed += 1;
    }
  }

  return { started, healed };
}

module.exports = {
  SIMULATE_CONTROL_URL,
  isLocalHost,
  ensureSimulatedNode,
  syncLocalLabNodesFromDb,
};
