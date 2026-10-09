import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getJwtSecret } from "./jwt-secret";

/**
 * Cifra valores sensibles de la tabla settings en reposo (AES-256-GCM).
 * La clave se deriva del JWT_SECRET ya existente — sin nueva variable de
 * entorno. Formato del sobre: enc:v1:<iv>:<tag>:<ciphertext> (base64).
 */

const PREFIX = "enc:v1:";

function deriveKey(): Buffer {
  // sha256(jwtSecret + contexto) — determinista entre reinicios
  return createHash("sha256")
    .update(`${getJwtSecret()}:settings-crypto-v1`)
    .digest();
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSetting(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptSetting(value: string): string {
  if (!isEncrypted(value)) return value; // legacy: plaintext pre-cifrado
  try {
    const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(":");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      deriveKey(),
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    console.error(
      "[settings-crypto] fallo al descifrar valor cifrado — clave cambiada o dato corrupto",
    );
    return "";
  }
}
