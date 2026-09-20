/**
 * Simulated network service nodes (University of Kigali LAN laboratory).
 * Default ports 9401–9406 + control API on 9399 to register more lab services
 * when Admin/ICT adds a service from the web UI.
 */
const express = require("express");
const cors = require("cors");
const http = require("http");
const fs = require("fs");
const path = require("path");

const CONTROL_PORT = Number(process.env.SIMULATE_CONTROL_PORT || 9399);
const EXTRA_NODES_FILE = path.join(__dirname, "extra-nodes.json");

const DEFAULT_NODES = [
  { key: "web-primary", name: "Web Server Primary", port: 9401, role: "primary", standbyKey: "web-standby" },
  { key: "web-standby", name: "Web Server Standby", port: 9402, role: "standby", standbyKey: null },
  { key: "app-primary", name: "App Server Primary", port: 9403, role: "primary", standbyKey: "app-standby" },
  { key: "app-standby", name: "App Server Standby", port: 9404, role: "standby", standbyKey: null },
  { key: "api-service", name: "API Gateway", port: 9405, role: "primary", standbyKey: null },
  { key: "portal-service", name: "Student Portal", port: 9406, role: "primary", standbyKey: null },
];

/** @type {Map<string, object>} */
const state = new Map();
/** @type {Map<string, import('http').Server>} */
const servers = new Map();
/** @type {Map<number, string>} */
const portOwners = new Map();

function makeState(node) {
  return {
    ...node,
    mode: "healthy",
    timeoutMs: 15000,
    dependencyOk: true,
    startedAt: new Date().toISOString(),
    restartCount: 0,
  };
}

function resetNode(key) {
  const current = state.get(key);
  if (!current) return null;
  const next = {
    ...current,
    mode: "healthy",
    dependencyOk: true,
    startedAt: new Date().toISOString(),
    restartCount: (current.restartCount || 0) + 1,
  };
  state.set(key, next);
  return next;
}

function createNodeApp(nodeKey) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (req, res) => {
    const n = state.get(nodeKey);
    res.json({
      success: true,
      service: n?.name,
      key: n?.key,
      role: n?.role,
      mode: n?.mode,
      uptimeSince: n?.startedAt,
    });
  });

  app.get("/health", async (req, res) => {
    const n = state.get(nodeKey);

    if (!n || n.mode === "crashed" || n.mode === "unresponsive") {
      return;
    }

    if (n.mode === "timeout") {
      await new Promise((resolve) => setTimeout(resolve, n.timeoutMs || 15000));
      return res.status(504).json({ success: false, status: "timeout" });
    }

    if (n.mode === "http500") {
      return res.status(500).json({ success: false, status: "internal_error", message: "Simulated HTTP 500" });
    }

    if (n.mode === "dependency" || !n.dependencyOk) {
      return res.status(503).json({
        success: false,
        status: "dependency_failure",
        message: "Required dependency unavailable",
      });
    }

    return res.status(200).json({
      success: true,
      status: "healthy",
      node: n.key,
      role: n.role,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/admin/status", (req, res) => {
    const n = state.get(nodeKey);
    res.json({ success: true, data: n });
  });

  app.post("/admin/inject", (req, res) => {
    const n = state.get(nodeKey);
    if (!n) return res.status(404).json({ success: false, message: "Unknown node" });
    const mode = String(req.body?.mode || "").toLowerCase();
    const allowed = ["healthy", "http500", "timeout", "unresponsive", "crashed", "dependency"];
    if (!allowed.includes(mode)) {
      return res.status(400).json({ success: false, message: `mode must be one of: ${allowed.join(", ")}` });
    }
    n.mode = mode;
    if (mode === "dependency") n.dependencyOk = false;
    if (mode === "healthy") n.dependencyOk = true;
    if (req.body?.timeoutMs) n.timeoutMs = Number(req.body.timeoutMs);
    state.set(nodeKey, n);
    return res.json({ success: true, message: `Injected mode=${mode}`, data: n });
  });

  app.post("/admin/recover", (req, res) => {
    const n = resetNode(nodeKey);
    return res.json({ success: true, message: "Node recovered / restarted", data: n });
  });

  app.post("/admin/crash", (req, res) => {
    const n = state.get(nodeKey);
    if (!n) return res.status(404).json({ success: false, message: "Unknown node" });
    n.mode = "crashed";
    state.set(nodeKey, n);
    res.json({ success: true, message: "Node marked crashed" });
  });

  return app;
}

function listenAsync(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off("listening", onListening);
      reject(err);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}

async function startNode(node) {
  const key = String(node.key || "").trim();
  const port = Number(node.port);
  const name = String(node.name || key).trim();
  const role = node.role || "primary";
  const standbyKey = node.standbyKey || null;

  if (!key) throw Object.assign(new Error("key is required"), { status: 400 });
  if (!port || port < 1 || port > 65535) {
    throw Object.assign(new Error("valid port is required"), { status: 400 });
  }
  if (state.has(key)) {
    const existing = state.get(key);
    if (Number(existing.port) === port) {
      return { alreadyRunning: true, data: existing };
    }
    throw Object.assign(new Error(`key '${key}' already exists on port ${existing.port}`), { status: 409 });
  }
  if (portOwners.has(port)) {
    throw Object.assign(new Error(`port ${port} already used by ${portOwners.get(port)}`), { status: 409 });
  }

  const meta = { key, name, port, role, standbyKey };
  state.set(key, makeState(meta));
  const app = createNodeApp(key);
  const server = http.createServer(app);
  server.timeout = 30000;

  try {
    await listenAsync(server, port);
  } catch (err) {
    state.delete(key);
    throw Object.assign(new Error(`Could not bind port ${port}: ${err.code || err.message}`), {
      status: 409,
    });
  }

  servers.set(key, server);
  portOwners.set(port, key);
  console.log(`[node] ${name} (${key}) → http://127.0.0.1:${port}/health`);
  return { alreadyRunning: false, data: state.get(key) };
}

function loadExtraNodes() {
  try {
    if (!fs.existsSync(EXTRA_NODES_FILE)) return [];
    const raw = JSON.parse(fs.readFileSync(EXTRA_NODES_FILE, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveExtraNode(node) {
  const defaultKeys = new Set(DEFAULT_NODES.map((n) => n.key));
  if (defaultKeys.has(node.key)) return;
  const extras = loadExtraNodes().filter((n) => n.key !== node.key);
  extras.push({
    key: node.key,
    name: node.name,
    port: node.port,
    role: node.role || "primary",
    standbyKey: node.standbyKey || null,
  });
  fs.writeFileSync(EXTRA_NODES_FILE, JSON.stringify(extras, null, 2));
}

function createControlApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({
      success: true,
      status: "healthy",
      control: true,
      nodes: state.size,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/admin/nodes", (req, res) => {
    res.json({
      success: true,
      data: [...state.values()].map((n) => ({
        key: n.key,
        name: n.name,
        port: n.port,
        role: n.role,
        mode: n.mode,
      })),
    });
  });

  app.post("/admin/register-node", async (req, res) => {
    try {
      const result = await startNode({
        key: req.body?.key,
        name: req.body?.name,
        port: req.body?.port,
        role: req.body?.role,
        standbyKey: req.body?.standbyKey || null,
      });
      if (!result.alreadyRunning) {
        saveExtraNode({
          key: req.body?.key,
          name: req.body?.name,
          port: req.body?.port,
          role: req.body?.role,
          standbyKey: req.body?.standbyKey || null,
        });
      }
      return res.status(result.alreadyRunning ? 200 : 201).json({
        success: true,
        message: result.alreadyRunning ? "Node already running" : "Simulated node started",
        data: result.data,
      });
    } catch (error) {
      return res.status(error.status || 500).json({
        success: false,
        message: error.message,
      });
    }
  });

  return app;
}

async function start() {
  for (const node of DEFAULT_NODES) {
    await startNode(node);
  }

  const extras = loadExtraNodes();
  for (const node of extras) {
    try {
      await startNode(node);
      console.log(`[node] restored extra service ${node.key} on :${node.port}`);
    } catch (e) {
      console.warn(`[node] could not restore ${node.key}: ${e.message}`);
    }
  }

  const control = http.createServer(createControlApp());
  control.listen(CONTROL_PORT, "127.0.0.1", () => {
    console.log(`\nSimulated UoK LAN nodes ready (${state.size} services).`);
    console.log(`Control API: http://127.0.0.1:${CONTROL_PORT}/admin/register-node`);
    console.log('Inject example: POST http://127.0.0.1:9401/admin/inject {"mode":"http500"}\n');
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

module.exports = { DEFAULT_NODES, state, resetNode, startNode };
