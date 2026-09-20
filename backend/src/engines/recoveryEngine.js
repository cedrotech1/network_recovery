const axios = require("axios");
const db = require("../database/models");

/**
 * Restart a failed service by calling its local recover endpoint
 * (process-based simulation — no Docker required).
 */
async function restartNode(node, timeoutMs = 5000) {
  const url = `http://${node.host}:${node.port}${node.recoverPath || "/admin/recover"}`;
  try {
    const response = await axios.post(url, {}, { timeout: timeoutMs, validateStatus: () => true });
    const ok = response.status >= 200 && response.status < 300;
    return {
      success: ok,
      details: ok
        ? `Restarted service ${node.key} via ${url}`
        : `Restart call failed with HTTP ${response.status}`,
      targetNodeKey: node.key,
    };
  } catch (error) {
    return {
      success: false,
      details: `Restart failed: ${error.code || error.message}`,
      targetNodeKey: node.key,
    };
  }
}

/**
 * Fail over traffic responsibility from primary to standby node.
 */
async function failoverNode(primaryNode) {
  if (!primaryNode.standbyKey) {
    return { success: false, details: "No standby node configured", targetNodeKey: null };
  }

  const standby = await db.NetworkNode.findOne({ where: { key: primaryNode.standbyKey } });
  if (!standby) {
    return { success: false, details: `Standby ${primaryNode.standbyKey} not found`, targetNodeKey: null };
  }

  // Ensure standby is healthy / recovered before promotion
  const recoverStandby = await restartNode(standby);
  if (!recoverStandby.success) {
    return {
      success: false,
      details: `Could not prepare standby: ${recoverStandby.details}`,
      targetNodeKey: standby.key,
    };
  }

  await primaryNode.update({
    status: "failed_over",
    isActive: false,
    isMonitored: false,
    failedOverToKey: standby.key,
  });

  await standby.update({
    status: "healthy",
    role: "primary",
    isActive: true,
    isMonitored: true,
    consecutiveFailures: 0,
  });

  return {
    success: true,
    details: `Failover complete: ${primaryNode.key} → ${standby.key}`,
    targetNodeKey: standby.key,
  };
}

async function executeRecovery(node, failureEvent, settings) {
  const startedAt = new Date();
  const policy = node.recoveryPolicy || "restart";
  let result;

  if (policy === "failover" && node.standbyKey) {
    result = await failoverNode(node);
  } else {
    result = await restartNode(node);
    if (result.success) {
      await node.update({
        status: "healthy",
        consecutiveFailures: 0,
        isActive: true,
      });
    }
  }

  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();

  const recovery = await db.RecoveryAction.create({
    nodeId: node.id,
    failureEventId: failureEvent ? failureEvent.id : null,
    actionType: policy === "failover" && node.standbyKey ? "failover" : "restart",
    success: result.success,
    startedAt,
    completedAt,
    durationMs,
    details: result.details,
    targetNodeKey: result.targetNodeKey,
  });

  if (failureEvent && result.success) {
    await failureEvent.update({ resolvedAt: completedAt });
  }

  return recovery;
}

module.exports = {
  restartNode,
  failoverNode,
  executeRecovery,
};
