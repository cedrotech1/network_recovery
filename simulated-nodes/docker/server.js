/**
 * Single-container (or local) simulated node entrypoint.
 * Used by local multi-node runner; Docker optional and not required.
 */
const express = require("express");
const cors = require("cors");

const PORT = Number(process.env.PORT || 80);
const NODE_KEY = process.env.NODE_KEY || "node";
const NODE_NAME = process.env.NODE_NAME || "Simulated Node";
const NODE_ROLE = process.env.NODE_ROLE || "primary";

const state = {
  key: NODE_KEY,
  name: NODE_NAME,
  role: NODE_ROLE,
  mode: "healthy",
  timeoutMs: 15000,
  dependencyOk: true,
  startedAt: new Date().toISOString(),
  restartCount: 0,
};

function recover() {
  state.mode = "healthy";
  state.dependencyOk = true;
  state.startedAt = new Date().toISOString();
  state.restartCount += 1;
  return state;
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: state.name,
    key: state.key,
    role: state.role,
    mode: state.mode,
    uptimeSince: state.startedAt,
  });
});

app.get("/health", async (req, res) => {
  if (state.mode === "crashed" || state.mode === "unresponsive") return;

  if (state.mode === "timeout") {
    await new Promise((r) => setTimeout(r, state.timeoutMs));
    return res.status(504).json({ success: false, status: "timeout" });
  }

  if (state.mode === "http500") {
    return res.status(500).json({ success: false, status: "internal_error" });
  }

  if (state.mode === "dependency" || !state.dependencyOk) {
    return res.status(503).json({ success: false, status: "dependency_failure" });
  }

  return res.status(200).json({
    success: true,
    status: "healthy",
    node: state.key,
    role: state.role,
    timestamp: new Date().toISOString(),
  });
});

app.get("/admin/status", (req, res) => res.json({ success: true, data: state }));

app.post("/admin/inject", (req, res) => {
  const mode = String(req.body?.mode || "").toLowerCase();
  const allowed = ["healthy", "http500", "timeout", "unresponsive", "crashed", "dependency"];
  if (!allowed.includes(mode)) {
    return res.status(400).json({ success: false, message: `Invalid mode` });
  }
  state.mode = mode;
  state.dependencyOk = mode !== "dependency";
  if (req.body?.timeoutMs) state.timeoutMs = Number(req.body.timeoutMs);
  return res.json({ success: true, data: state });
});

app.post("/admin/recover", (req, res) => res.json({ success: true, data: recover() }));
app.post("/admin/crash", (req, res) => {
  state.mode = "crashed";
  res.json({ success: true, data: state });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[${NODE_KEY}] listening on :${PORT}`);
});
