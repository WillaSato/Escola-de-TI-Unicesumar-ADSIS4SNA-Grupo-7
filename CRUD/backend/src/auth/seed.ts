import { createPool } from "../db/pool.js";
import { productNameKey, type Category } from "../products/model.js";
import { today } from "../products/validation.js";
import { hashPassword } from "./password.js";

const password = process.env.DEMO_PASSWORD ?? "";
if (password.length < 12 || password.length > 128) {
  throw new Error("Configure DEMO_PASSWORD com 12 a 128 caracteres em backend/.env.");
}

const users = [
  { name: "Ana Silva", email: "ana@lifehub.test" },
  { name: "Lucas Costa", email: "lucas@lifehub.test" },
];

const samples: { name: string; category: Category; purchaseAgo: number; warrantyIn: number | null; archived?: boolean }[] = [
  { name: "Notebook IdeaPad 5", category: "Eletrônicos", purchaseAgo: 348, warrantyIn: 17 },
  { name: "Cafeteira Oster", category: "Eletrodomésticos", purchaseAgo: 392, warrantyIn: -28 },
  { name: "Fone Sony WH-CH520", category: "Eletrônicos", purchaseAgo: 254, warrantyIn: 111 },
  { name: "Luminária de mesa", category: "Casa", purchaseAgo: 90, warrantyIn: null },
  { name: "Monitor Philips 24″", category: "Eletrônicos", purchaseAgo: 450, warrantyIn: -85, archived: true },
];

const day = Date.parse(today());
function dateFromNow(delta: number) {
  return new Date(day + delta * 86_400_000).toISOString().slice(0, 10);
}

const database = createPool();
try {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    for (const user of users) {
      const result = await client.query<{ id: number }>(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING RETURNING id`,
        [user.name, user.email, await hashPassword(password)],
      );
      const created = result.rows[0];
      if (created && user.email === users[0].email) {
        for (const sample of samples) {
          await client.query(
            `INSERT INTO products (owner_id, name, category, purchase_date, warranty_until, archived_at, name_key)
             VALUES ($1, $2, $3, $4, $5, CASE WHEN $6::boolean THEN now() ELSE NULL END, $7)`,
            [created.id, sample.name, sample.category, dateFromNow(-sample.purchaseAgo),
              sample.warrantyIn === null ? null : dateFromNow(sample.warrantyIn), sample.archived ?? false, productNameKey(sample.name)],
          );
        }
      }
    }
    await client.query("COMMIT");
    console.log("Contas de demonstração disponíveis: ana@lifehub.test e lucas@lifehub.test.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
} finally {
  await database.end();
}
