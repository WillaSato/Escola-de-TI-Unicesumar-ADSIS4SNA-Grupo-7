import { createHash, randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { HttpError } from "../http/errors.js";
import { checkPassword, dummyPasswordHash } from "./password.js";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
}

type UserRow = SessionUser & { passwordHash: string };
export const sessionDuration = 8 * 60 * 60 * 1000;

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  constructor(private readonly database: Pool) {}

  async login(body: unknown) {
    const data = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    const password = typeof data.password === "string" ? data.password : "";
    if (!email || !email.includes("@") || email.length > 254 || !password || password.length > 128) {
      throw new HttpError(400, "Informe um e-mail e uma senha válidos.");
    }
    const result = await this.database.query<UserRow>(
      'SELECT id, name, email, password_hash AS "passwordHash" FROM users WHERE email = $1',
      [email],
    );
    const row = result.rows[0];
    const match = await checkPassword(password, row?.passwordHash ?? dummyPasswordHash);
    if (!row || !match) throw new HttpError(401, "E-mail ou senha incorretos.");

    const token = randomBytes(32).toString("hex");
    await this.database.query("DELETE FROM sessions WHERE expires_at <= now()");
    await this.database.query(
      "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
      [digest(token), row.id, new Date(Date.now() + sessionDuration)],
    );
    return { token, user: { id: row.id, name: row.name, email: row.email } };
  }

  async getSession(token: string) {
    const result = await this.database.query<SessionUser>(
      `SELECT users.id, users.name, users.email FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE token_hash = $1 AND expires_at > now()`,
      [digest(token)],
    );
    return result.rows[0];
  }

  async logout(token: string | undefined) {
    if (token) await this.database.query("DELETE FROM sessions WHERE token_hash = $1", [digest(token)]);
  }
}
