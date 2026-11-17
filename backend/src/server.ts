import { createApp } from "./app.js";
import { createPool } from "./db/pool.js";

const port = Number(process.env.PORT ?? "3000");
if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error("PORT inválida.");
const database = createPool();
try {
  await database.query("SELECT 1");
} catch (error) {
  await database.end();
  throw error;
}

const server = createApp(database, process.env.COOKIE_SECURE === "1").listen(port, "127.0.0.1", () => {
  console.log("API LifeHub em http://127.0.0.1:" + port);
});

function stop() {
  server.close(() => {
    database.end().catch(console.error);
  });
}

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
