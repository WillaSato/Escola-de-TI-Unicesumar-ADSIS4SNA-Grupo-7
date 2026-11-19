import { randomBytes, scrypt as derive, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(derive);
const keyLength = 64;

export const dummyPasswordHash = Buffer.alloc(16).toString("hex") + ":" + Buffer.alloc(keyLength).toString("hex");

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, keyLength) as Buffer;
  return salt + ":" + hash.toString("hex");
}

export async function checkPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!/^[0-9a-f]{32}$/.test(salt ?? "") || !/^[0-9a-f]{128}$/.test(hex ?? "")) return false;
  const hash = await scrypt(password, salt, keyLength) as Buffer;
  return timingSafeEqual(hash, Buffer.from(hex, "hex"));
}
