/**
 * Canonical lab defaults for seed + factory reset.
 */
const DEFAULT_NODES = [
  {
    key: "web-primary",
    name: "University Website (main)",
    description: "The main university website students and visitors open in a browser.",
    host: "127.0.0.1",
    port: 9401,
    role: "primary",
    standbyKey: "web-standby",
    recoveryPolicy: "restart",
    isMonitored: true,
  },
  {
    key: "web-standby",
    name: "University Website (backup)",
    description: "Backup copy of the website. Used if the main website fails.",
    host: "127.0.0.1",
    port: 9402,
    role: "standby",
    standbyKey: null,
    recoveryPolicy: "restart",
    isMonitored: false,
  },
  {
    key: "app-primary",
    name: "Campus App (main)",
    description: "Internal campus application used by staff for day-to-day work.",
    host: "127.0.0.1",
    port: 9403,
    role: "primary",
    standbyKey: "app-standby",
    recoveryPolicy: "failover",
    isMonitored: true,
  },
  {
    key: "app-standby",
    name: "Campus App (backup)",
    description: "Backup campus app. Takes over automatically if the main app fails.",
    host: "127.0.0.1",
    port: 9404,
    role: "standby",
    standbyKey: null,
    recoveryPolicy: "restart",
    isMonitored: false,
  },
  {
    key: "api-service",
    name: "Internal API Service",
    description: "Connects different university systems so they can share data.",
    host: "127.0.0.1",
    port: 9405,
    role: "primary",
    standbyKey: null,
    recoveryPolicy: "restart",
    isMonitored: true,
  },
  {
    key: "portal-service",
    name: "Student Portal",
    description: "Where students log in for results, courses, and announcements.",
    host: "127.0.0.1",
    port: 9406,
    role: "primary",
    standbyKey: null,
    recoveryPolicy: "restart",
    isMonitored: true,
  },
];

const DEFAULT_USERS = [
  {
    names: "System Administrator",
    email: "admin@uok.ac.rw",
    password: "Admin@123",
    role: "admin",
    phone: "+250700000001",
  },
  {
    names: "Jean ICT Officer",
    email: "ict@uok.ac.rw",
    password: "Ict@12345",
    role: "ict_officer",
    phone: "+250700000002",
  },
  {
    names: "Grace Viewer",
    email: "viewer@uok.ac.rw",
    password: "View@12345",
    role: "viewer",
    phone: "+250700000003",
  },
];

const DEFAULT_SETTINGS = [
  { key: "checkIntervalMs", value: "5000", description: "Health-check polling interval (ms)" },
  { key: "failureThreshold", value: "3", description: "Consecutive failures before confirmed outage" },
  { key: "healthTimeoutMs", value: "3000", description: "HTTP health-check timeout (ms)" },
  { key: "autoRecoveryEnabled", value: "true", description: "Automatically run recovery actions" },
  { key: "persistHealthChecks", value: "true", description: "Store each health-check row in PostgreSQL" },
];

const DEFAULT_USER_EMAILS = DEFAULT_USERS.map((u) => u.email);
const DEFAULT_NODE_KEYS = DEFAULT_NODES.map((n) => n.key);

module.exports = {
  DEFAULT_NODES,
  DEFAULT_USERS,
  DEFAULT_SETTINGS,
  DEFAULT_USER_EMAILS,
  DEFAULT_NODE_KEYS,
};
