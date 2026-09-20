import { loadAppEnv } from "./config/loadEnv.js";
loadAppEnv();

import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { validateEnv } from "./config/validateEnv.js";
import db from "./database/models/index.js";
import { startMonitoring } from "./engines/monitoringEngine.js";

validateEnv();

const PORT = process.env.PORT || 9500;
const HOST = process.env.HOST || "127.0.0.1";

async function boot() {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ alter: true });
  console.log("PostgreSQL connected (Sequelize)");

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGINS || "http://localhost:5473").split(","),
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.emit("connected", { message: "AFDRS realtime channel ready" });
  });

  await startMonitoring(io);

  server.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
}

boot().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
