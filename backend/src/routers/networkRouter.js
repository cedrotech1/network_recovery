const express = require("express");
const { protect } = require("../middlewares/protect.js");
const {
  requireAdmin,
  requireManageAccess,
  requireInjectAccess,
} = require("../middlewares/roleAccess.js");
const c = require("../controllers/networkController.js");

const router = express.Router();

router.use(protect);

router.get("/dashboard", c.dashboard);
router.get("/metrics", c.metrics);
router.get("/report/general", requireAdmin, c.generalReport);
router.get("/settings", c.getSettings);
router.put("/settings", requireManageAccess, c.updateSettings);

router.get("/nodes", c.listNodes);
router.get("/nodes/:id", c.getNode);
router.post("/nodes", requireManageAccess, c.createNode);
router.put("/nodes/:id", requireManageAccess, c.updateNode);
router.delete("/nodes/:id", requireAdmin, c.deleteNode);
router.post("/nodes/:id/recover", requireManageAccess, c.manualRecover);
router.post("/nodes/:id/provision", requireManageAccess, c.provisionNode);

router.get("/failures", c.listFailures);
router.get("/recoveries", c.listRecoveries);
router.get("/health-checks", c.listHealthChecks);
router.get("/logs", c.activityLogs);

router.post("/experiments/inject", requireInjectAccess, c.injectFailure);
router.post("/experiments/inject-multi", requireInjectAccess, c.injectMulti);
router.post("/experiments/clear-history", requireManageAccess, c.clearHistory);
router.post("/experiments/reset-to-start", requireAdmin, c.resetToStart);
router.post("/monitor/run-cycle", requireManageAccess, c.forceMonitorCycle);

module.exports = router;
