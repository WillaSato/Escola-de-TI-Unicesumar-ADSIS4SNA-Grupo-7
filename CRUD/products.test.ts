import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { test } from "node:test";
import { createApp } from "../src/app.js";
import { hashPassword } from "../src/auth/password.js";
import { createPool } from "../src/db/pool.js";
import { today } from "../src/products/validation.js";

test("CRUD PostgreSQL, autenticação e isolamento entre contas", async context => {
  const url = process.env.TEST_DATABASE_URL;
  assert.ok(url, "Configure TEST_DATABASE_URL para um banco dedicado.");
  assert.notEqual(url, process.env.DATABASE_URL, "Use um banco de teste separado.");
  const database = createPool(url);
  const suffix = randomUUID();
  const emails = ["ana-" + suffix + "@example.test", "lucas-" + suffix + "@example.test"];
  const password = randomUUID();
  let cleanupUsers = false;
  context.after(async () => {
    try {
      if (cleanupUsers) await database.query("DELETE FROM users WHERE email = ANY($1::text[])", [emails]);
    } finally {
      await database.end();
    }
  });

  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  await database.query(schema);
  cleanupUsers = true;
  for (const email of emails) {
    await database.query("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)",
      ["Pessoa de Teste", email, await hashPassword(password)]);
  }

  const server = createApp(database, false).listen(0, "127.0.0.1");
  try {
    await once(server, "listening");
    const port = (server.address() as AddressInfo).port;

    function call(path: string, method = "GET", cookie?: string, json?: object) {
      const headers = new Headers();
      if (cookie) headers.set("Cookie", cookie);
      if (json) headers.set("Content-Type", "application/json");
      return fetch("http://127.0.0.1:" + port + "/api" + path, {
        method, headers, body: json ? JSON.stringify(json) : undefined,
      });
    }

    async function login(email: string) {
      const response = await call("/auth/login", "POST", undefined, { email, password });
      assert.equal(response.status, 200);
      const cookie = response.headers.get("set-cookie");
      assert.ok(cookie);
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /SameSite=Strict/i);
      assert.equal((await response.json()).email, email);
      return cookie.split(";")[0];
    }

    assert.equal((await call("/products")).status, 401);
    assert.equal((await call("/auth/login", "POST", undefined, { email: emails[0], password: "errada" })).status, 401);
    const ana = await login(emails[0]);
    const lucas = await login(emails[1]);

    const payload = { name: "Ábaco", category: "Casa", purchaseDate: "2025-04-03", warrantyUntil: today() };
    const invalid = await call("/products", "POST", ana, { ...payload, warrantyUntil: "2025-02-29" });
    assert.equal(invalid.status, 400);
    assert.ok((await invalid.json()).fields.warrantyUntil);
    const simultaneous = await Promise.all([
      call("/products", "POST", ana, payload),
      call("/products", "POST", ana, { ...payload, name: "ábaco" }),
    ]);
    assert.deepEqual(simultaneous.map(response => response.status).sort(), [201, 409]);
    const record = await simultaneous.find(response => response.status === 201)!.json();
    const path = "/products/" + record.id;
    assert.equal(record.warrantyStatus, "active");
    assert.equal(record.daysToExpiry, 0);
    assert.equal((await call(path, "GET", ana)).status, 200);
    assert.equal((await (await call("/products?category=Outros", "GET", ana)).json()).length, 0);
    assert.equal((await (await call("/products?category=Casa", "GET", ana)).json()).length, 1);
    assert.equal((await (await call("/products", "GET", lucas)).json()).length, 0);
    assert.equal((await call(path, "GET", lucas)).status, 404);
    assert.equal((await call(path, "PUT", lucas, payload)).status, 404);
    assert.equal((await call(path, "DELETE", lucas)).status, 404);
    assert.equal((await call(path + "/restore", "POST", lucas)).status, 404);

    const update = await call(path, "PUT", ana, { ...payload, name: "Ábaco revisado", warrantyUntil: null });
    assert.equal(update.status, 200);
    assert.equal((await update.json()).warrantyStatus, "none");
    assert.equal((await (await call(path, "GET", ana)).json()).name, "Ábaco revisado");
    assert.equal((await call(path, "DELETE", ana)).status, 204);
    assert.equal((await call(path, "DELETE", ana)).status, 204);
    assert.equal((await call(path, "PUT", ana, payload)).status, 409);
    assert.equal((await (await call("/products", "GET", ana)).json()).length, 0);
    assert.equal((await (await call("/products?archived=true", "GET", ana)).json())[0].id, record.id);

    const duplicate = await call("/products", "POST", ana, { ...payload, name: "Ábaco revisado", warrantyUntil: null });
    assert.equal(duplicate.status, 201);
    assert.equal((await call(path + "/restore", "POST", ana)).status, 409);
    assert.equal((await call("/products/" + (await duplicate.json()).id, "DELETE", ana)).status, 204);
    assert.equal((await call(path + "/restore", "POST", ana)).status, 200);
    assert.equal((await (await call(path, "GET", ana)).json()).archivedAt, null);
    assert.equal((await call("/auth/logout", "POST", ana)).status, 204);
    assert.equal((await call("/auth/me", "GET", ana)).status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
