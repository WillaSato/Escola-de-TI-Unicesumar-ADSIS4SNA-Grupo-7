import { readFile } from "node:fs/promises";
import { createPool } from "./pool.js";

const database = createPool();

try {
  const schema = await readFile(new URL("../../db/schema.sql", import.meta.url), "utf8");
  await database.query(schema);
  console.log("Schema do LifeHub aplicado.");
} finally {
  await database.end();
}
