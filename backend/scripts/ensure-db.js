const { Client } = require("pg");

(async () => {
  const c = new Client({
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "password",
    database: "postgres",
  });
  try {
    await c.connect();
    const r = await c.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ["network_recovery"]
    );
    if (r.rowCount === 0) {
      await c.query("CREATE DATABASE network_recovery");
      console.log("created network_recovery");
    } else {
      console.log("network_recovery already exists");
    }
  } catch (e) {
    console.error("ERR", e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();
