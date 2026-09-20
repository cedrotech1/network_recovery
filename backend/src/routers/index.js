const express = require("express");
const authRouter = require("./authRouter.js");
const networkRouter = require("./networkRouter.js");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Automatic Failure Detection and Recovery System API is running",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRouter);
router.use("/", networkRouter);

module.exports = router;
