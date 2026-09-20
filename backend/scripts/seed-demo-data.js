/**
 * Demo / screenshot data seeder (separate from seed-network.js).
 *
 * Usage:
 *   npm run seed            # ensure users + nodes exist first
 *   npm run seed:demo       # replace operational history with rich demo data
 *   npm run seed:demo:append  # keep existing history and ADD more demo rows
 *
 * Env:
 *   DEMO_DAYS=30            # how far back failures/checks can go (default 30)
 *   DEMO_CHECKS=1200        # approximate health_check rows (default 1200)
 *   DEMO_FAILURES=48        # failure_event rows (default 48)
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../src/database/models");

const APPEND = process.argv.includes("--append") || process.env.DEMO_APPEND === "1";
const DEMO_DAYS = Math.max(7, Number(process.env.DEMO_DAYS || 30));
const TARGET_CHECKS = Math.max(200, Number(process.env.DEMO_CHECKS || 1200));
const TARGET_FAILURES = Math.max(12, Number(process.env.DEMO_FAILURES || 48));

const SCENARIOS = [
  { code: "S1", failureType: "service_down", mode: "down", policyHint: "restart" },
  { code: "S2", failureType: "http_500", mode: "http500", policyHint: "restart" },
  { code: "S3", failureType: "timeout", mode: "timeout", policyHint: "restart" },
  { code: "S4", failureType: "primary_outage", mode: "down", policyHint: "failover" },
  { code: "S5", failureType: "process_crash", mode: "crash", policyHint: "restart" },
  { code: "S6", failureType: "dependency_failure", mode: "http500", policyHint: "restart" },
  { code: "S7", failureType: "transient_glitch", mode: "http500", policyHint: "none" },
  { code: "S8", failureType: "multi_service_outage", mode: "http500", policyHint: "restart" },
];

const EXTRA_USERS = [
  { names: "Uwase Claudine", email: "uwase.claudine@uok.ac.rw", role: "ict_officer", phone: "+250788100101" },
  { names: "Habimana Eric", email: "habimana.eric@uok.ac.rw", role: "ict_officer", phone: "+250788100102" },
  { names: "Mukamana Diane", email: "mukamana.diane@uok.ac.rw", role: "viewer", phone: "+250788100103" },
  { names: "Niyonzima Patrick", email: "niyonzima.patrick@uok.ac.rw", role: "viewer", phone: "+250788100104" },
  { names: "Ingabire Alice", email: "ingabire.alice@uok.ac.rw", role: "viewer", phone: "+250788100105" },
  { names: "Bizimana Kevin", email: "bizimana.kevin@uok.ac.rw", role: "admin", phone: "+250788100106" },
  { names: "Uwimana Sarah", email: "uwimana.sarah@uok.ac.rw", role: "ict_officer", phone: "+250788100107" },
  { names: "Nsengimana David", email: "nsengimana.david@uok.ac.rw", role: "viewer", phone: "+250788100108" },
  { names: "Iradukunda Belise", email: "iradukunda.belise@uok.ac.rw", role: "viewer", phone: "+250788100109" },
  { names: "Mugisha Olivier", email: "mugisha.olivier@uok.ac.rw", role: "ict_officer", phone: "+250788100110" },
  { names: "Nyiraneza Hope", email: "nyiraneza.hope@uok.ac.rw", role: "viewer", phone: "+250788100111" },
  { names: "Twagirimana Sam", email: "twagirimana.sam@uok.ac.rw", role: "viewer", phone: "+250788100112" },
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function minutesAgo(n) {
  return new Date(Date.now() - n * 60 * 1000);
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function jitterMs(base, spread) {
  return base + rand(-spread, spread);
}

async function ensureExtraUsers() {
  const passwordHash = await bcrypt.hash("Demo@12345", 10);
  let created = 0;
  for (const u of EXTRA_USERS) {
    const [row, wasCreated] = await db.User.findOrCreate({
      where: { email: u.email },
      defaults: {
        names: u.names,
        email: u.email,
        password: passwordHash,
        role: u.role,
        phone: u.phone,
        active: true,
        deleted: "no",
      },
    });
    if (wasCreated) created += 1;
    else {
      await row.update({
        names: u.names,
        role: u.role,
        phone: u.phone,
        active: true,
        deleted: "no",
      });
    }
  }
  return created;
}

async function clearOperationalHistory() {
  // Order matters for FKs
  await db.RecoveryAction.destroy({ where: {}, truncate: false });
  await db.FailureEvent.destroy({ where: {}, truncate: false });
  await db.HealthCheck.destroy({ where: {}, truncate: false });
}

async function seedHealthChecks(nodes) {
  const monitored = nodes.filter((n) => n.isMonitored);
  const rows = [];
  const now = Date.now();

  // Dense recent window (looks great on 15m / 1h charts)
  const recentPoints = Math.min(400, Math.floor(TARGET_CHECKS * 0.35));
  for (let i = 0; i < recentPoints; i += 1) {
    const node = pick(monitored);
    const ageMin = Math.random() * 90; // last 90 minutes
    const ok = Math.random() > 0.12;
    const checkedAt = new Date(now - ageMin * 60 * 1000);
    rows.push({
      nodeId: node.id,
      success: ok,
      statusCode: ok ? 200 : pick([500, 502, 503, 0]),
      latencyMs: ok ? rand(18, 140) : rand(3000, 5200),
      errorMessage: ok ? null : pick(["HTTP 500", "ECONNREFUSED", "timeout", "socket hang up"]),
      checkedAt,
      createdAt: checkedAt,
    });
  }

  // Mid window (6h–24h)
  const midPoints = Math.min(400, Math.floor(TARGET_CHECKS * 0.35));
  for (let i = 0; i < midPoints; i += 1) {
    const node = pick(monitored);
    const ageMin = 90 + Math.random() * (24 * 60 - 90);
    const ok = Math.random() > 0.08;
    const checkedAt = new Date(now - ageMin * 60 * 1000);
    rows.push({
      nodeId: node.id,
      success: ok,
      statusCode: ok ? 200 : pick([500, 503, 0]),
      latencyMs: ok ? rand(20, 180) : rand(2800, 6000),
      errorMessage: ok ? null : pick(["HTTP 500", "timeout", "connection reset"]),
      checkedAt,
      createdAt: checkedAt,
    });
  }

  // Long window (2–DEMO_DAYS days) for 7d / 30d charts
  const longPoints = TARGET_CHECKS - rows.length;
  for (let i = 0; i < longPoints; i += 1) {
    const node = pick(monitored);
    const ageHours = 24 + Math.random() * (DEMO_DAYS * 24 - 24);
    const ok = Math.random() > 0.06;
    const checkedAt = new Date(now - ageHours * 60 * 60 * 1000);
    rows.push({
      nodeId: node.id,
      success: ok,
      statusCode: ok ? 200 : pick([500, 502, 0]),
      latencyMs: ok ? rand(15, 200) : rand(2500, 7000),
      errorMessage: ok ? null : pick(["HTTP 500", "ECONNREFUSED", "timeout"]),
      checkedAt,
      createdAt: checkedAt,
    });
  }

  // Bulk insert in chunks
  const chunk = 200;
  for (let i = 0; i < rows.length; i += chunk) {
    await db.HealthCheck.bulkCreate(rows.slice(i, i + chunk));
  }
  return rows.length;
}

async function seedFailuresAndRecoveries(nodes) {
  const byKey = Object.fromEntries(nodes.map((n) => [n.key, n]));
  const primaries = nodes.filter((n) => n.role === "primary" && n.isMonitored);
  const rows = [];

  // Guaranteed recent showcase events (looks good on Home / Logs / 15m charts)
  const showcase = [
    { nodeKey: "portal-service", scenario: "S2", minutesAgo: 8, detectionMs: 15200, recoveryMs: 1840, success: true },
    { nodeKey: "web-primary", scenario: "S1", minutesAgo: 22, detectionMs: 16100, recoveryMs: 2100, success: true },
    { nodeKey: "api-service", scenario: "S3", minutesAgo: 45, detectionMs: 17800, recoveryMs: 3200, success: true },
    { nodeKey: "app-primary", scenario: "S4", minutesAgo: 75, detectionMs: 15500, recoveryMs: 4100, success: true },
    { nodeKey: "portal-service", scenario: "S5", minutesAgo: 140, detectionMs: 14900, recoveryMs: 2500, success: true },
    { nodeKey: "web-primary", scenario: "S6", minutesAgo: 220, detectionMs: 16200, recoveryMs: 2800, success: true },
    { nodeKey: "api-service", scenario: "S7", minutesAgo: 12, detectionMs: 5100, recoveryMs: null, success: null }, // glitch, no recovery
    { nodeKey: "portal-service", scenario: "S8", minutesAgo: 360, detectionMs: 17000, recoveryMs: 5200, success: true },
    { nodeKey: "web-primary", scenario: "S2", minutesAgo: 18, detectionMs: 14800, recoveryMs: 1900, success: false }, // rare failed recovery for red row
  ];

  for (const item of showcase) {
    const node = byKey[item.nodeKey];
    if (!node) continue;
    const sc = SCENARIOS.find((s) => s.code === item.scenario);
    const detectedAt = minutesAgo(item.minutesAgo);
    const injectedAt = new Date(detectedAt.getTime() - item.detectionMs);
    rows.push({
      node,
      scenario: sc,
      injectedAt,
      detectedAt,
      detectionTimeMs: item.detectionMs,
      consecutiveFails: item.scenario === "S7" ? 1 : 3,
      isFalsePositive: item.scenario === "S7",
      recoveryMs: item.recoveryMs,
      recoverySuccess: item.success,
      resolve: item.success === true,
    });
  }

  // Fill remaining failures across the demo window
  while (rows.length < TARGET_FAILURES) {
    const node = pick(primaries);
    const sc = pick(SCENARIOS);
    const ageHours = Math.random() * DEMO_DAYS * 24;
    const detectedAt = new Date(Date.now() - ageHours * 60 * 60 * 1000);
    const detectionTimeMs = jitterMs(15000, 4000);
    const injectedAt = new Date(detectedAt.getTime() - detectionTimeMs);
    const isGlitch = sc.code === "S7";
    const recoverySuccess = isGlitch ? null : Math.random() > 0.08;
    rows.push({
      node,
      scenario: sc,
      injectedAt,
      detectedAt,
      detectionTimeMs,
      consecutiveFails: isGlitch ? rand(1, 2) : 3,
      isFalsePositive: isGlitch,
      recoveryMs: isGlitch ? null : jitterMs(2500, 1500),
      recoverySuccess,
      resolve: recoverySuccess === true,
    });
  }

  let failureCount = 0;
  let recoveryCount = 0;

  for (const r of rows) {
    const useFailover =
      r.scenario.code === "S4" || (r.node.recoveryPolicy === "failover" && r.scenario.code !== "S7");
    const actionType = useFailover ? "failover" : "restart";
    const standby = r.node.standbyKey ? byKey[r.node.standbyKey] : null;

    const failure = await db.FailureEvent.create({
      nodeId: r.node.id,
      failureType: r.scenario.failureType,
      scenarioCode: r.scenario.code,
      consecutiveFails: r.consecutiveFails,
      injectedAt: r.injectedAt,
      detectedAt: r.detectedAt,
      detectionTimeMs: r.detectionTimeMs,
      isFalsePositive: r.isFalsePositive,
      resolvedAt: r.resolve ? new Date(r.detectedAt.getTime() + (r.recoveryMs || 2000)) : null,
      details: r.isFalsePositive
        ? `Short glitch on ${r.node.name}; threshold not treated as full outage recovery.`
        : `Confirmed ${r.scenario.code} on ${r.node.name} (${r.scenario.failureType}).`,
      createdAt: r.detectedAt,
      updatedAt: r.detectedAt,
    });
    failureCount += 1;

    if (r.recoveryMs != null && r.recoverySuccess != null) {
      const startedAt = new Date(r.detectedAt.getTime() + rand(200, 900));
      const completedAt = new Date(startedAt.getTime() + Math.max(500, r.recoveryMs));
      await db.RecoveryAction.create({
        nodeId: r.node.id,
        failureEventId: failure.id,
        actionType,
        success: Boolean(r.recoverySuccess),
        startedAt,
        completedAt,
        durationMs: Math.max(500, r.recoveryMs),
        targetNodeKey: actionType === "failover" ? r.node.standbyKey : null,
        details: r.recoverySuccess
          ? actionType === "failover"
            ? `Failover completed: traffic moved toward ${standby?.name || r.node.standbyKey}.`
            : `Automatic restart restored ${r.node.name}.`
          : `Automatic ${actionType} did not fully restore ${r.node.name}.`,
        createdAt: startedAt,
        updatedAt: completedAt,
      });
      recoveryCount += 1;
    }
  }

  return { failureCount, recoveryCount };
}

async function polishNodeStatuses(nodes) {
  // Screenshot-friendly mix: mostly healthy, one interesting state
  for (const node of nodes) {
    if (node.role === "standby") {
      await node.update({
        status: node.key === "app-standby" ? "healthy" : "standby",
        consecutiveFailures: 0,
        lastCheckedAt: new Date(),
        lastLatencyMs: rand(25, 90),
        isActive: true,
      });
      continue;
    }

    if (node.key === "portal-service") {
      // Looks recently recovered
      await node.update({
        status: "healthy",
        consecutiveFailures: 0,
        lastCheckedAt: new Date(),
        lastLatencyMs: rand(30, 80),
        failedOverToKey: null,
      });
    } else if (node.key === "app-primary") {
      // Failover demo appearance
      await node.update({
        status: "failed_over",
        consecutiveFailures: 0,
        lastCheckedAt: minutesAgo(70),
        lastLatencyMs: null,
        failedOverToKey: "app-standby",
      });
    } else {
      await node.update({
        status: "healthy",
        consecutiveFailures: 0,
        lastCheckedAt: new Date(),
        lastLatencyMs: rand(20, 120),
        failedOverToKey: null,
      });
    }
  }
}

async function main() {
  await db.sequelize.authenticate();

  const nodes = await db.NetworkNode.findAll();
  if (!nodes.length) {
    console.error("No network nodes found. Run `npm run seed` first, then `npm run seed:demo`.");
    process.exit(1);
  }

  console.log(`Mode: ${APPEND ? "APPEND" : "REPLACE operational history"}`);
  console.log(`Targets: ~${TARGET_CHECKS} health checks, ~${TARGET_FAILURES} failures, last ${DEMO_DAYS} days`);

  const extraUsers = await ensureExtraUsers();
  console.log(`Extra demo users ensured: ${EXTRA_USERS.length} (newly created: ${extraUsers})`);

  if (!APPEND) {
    console.log("Clearing health_checks, failure_events, recovery_actions...");
    await clearOperationalHistory();
  }

  const checks = await seedHealthChecks(nodes);
  console.log(`Health checks inserted: ${checks}`);

  const { failureCount, recoveryCount } = await seedFailuresAndRecoveries(nodes);
  console.log(`Failure events inserted: ${failureCount}`);
  console.log(`Recovery actions inserted: ${recoveryCount}`);

  await polishNodeStatuses(nodes);
  console.log("Node statuses polished for screenshots.");

  const [userCount, failTotal, recoveryTotal, checkTotal] = await Promise.all([
    db.User.count(),
    db.FailureEvent.count(),
    db.RecoveryAction.count(),
    db.HealthCheck.count(),
  ]);

  console.log("\nDemo data ready for screenshots.");
  console.log("----------------------------------");
  console.log(`Users:              ${userCount}`);
  console.log(`Health checks:      ${checkTotal}`);
  console.log(`Failure events:     ${failTotal}`);
  console.log(`Recovery actions:   ${recoveryTotal}`);
  console.log("Login (original):   admin@uok.ac.rw / Admin@123");
  console.log("Extra demo password for new users: Demo@12345");
  console.log("\nTip: open Charts (15m / 24h / 7d), Activity logs, Problems, Fixes, People & roles.");
  console.log("Tip: for a live recovery demo later, use Settings → Reset & start fresh, then inject S2.");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
