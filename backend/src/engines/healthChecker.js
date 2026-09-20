const axios = require("axios");

/**
 * Perform one HTTP health check against a network node.
 */
async function checkNodeHealth(node, timeoutMs = 3000) {
  const url = `http://${node.host}:${node.port}${node.healthPath || "/health"}`;
  const started = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: timeoutMs,
      validateStatus: () => true,
    });
    const latencyMs = Date.now() - started;
    const success = response.status >= 200 && response.status < 300 && response.data?.success !== false;

    return {
      success,
      statusCode: response.status,
      latencyMs,
      errorMessage: success ? null : `HTTP ${response.status}`,
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      statusCode: null,
      latencyMs: Date.now() - started,
      errorMessage: error.code || error.message || "health_check_failed",
      checkedAt: new Date(),
    };
  }
}

module.exports = { checkNodeHealth };
