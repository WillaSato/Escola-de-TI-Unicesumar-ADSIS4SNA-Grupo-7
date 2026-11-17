import pg from "pg";

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("Configure DATABASE_URL no arquivo backend/.env.");
  }
  return new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 3000,
  });
}
