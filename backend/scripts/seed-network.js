require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../src/database/models");
const {
  DEFAULT_NODES,
  DEFAULT_USERS,
  DEFAULT_SETTINGS,
} = require("../src/config/labDefaults");

async function seed() {
  await db.sequelize.sync({ alter: true });

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
      },
    });
    await row.update({
      names: u.names,
      role: u.role,
      phone: u.phone,
      active: true,
      password: await bcrypt.hash(u.password, 10),
    });
  }

  for (const node of DEFAULT_NODES) {
    const [row] = await db.NetworkNode.findOrCreate({
      where: { key: node.key },
      defaults: {
        ...node,
        status: "unknown",
        consecutiveFailures: 0,
        isActive: true,
        isMonitored: node.isMonitored !== false,
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
    });
  }

  for (const setting of DEFAULT_SETTINGS) {
    const [row] = await db.SystemSetting.findOrCreate({
      where: { key: setting.key },
      defaults: setting,
    });
    if (!row.value) await row.update({ value: setting.value });
  }

  console.log("Seed complete.");
  console.log("Users:");
  DEFAULT_USERS.forEach((u) => console.log(`  ${u.role.padEnd(12)} ${u.email} / ${u.password}`));
  console.log(`Nodes seeded: ${DEFAULT_NODES.length}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
