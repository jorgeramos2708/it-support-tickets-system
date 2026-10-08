#!/usr/bin/env node
/**
 * Genera un certificado autofirmado de demostración para el gateway TLS.
 * Producción real: usa Let's Encrypt con un dominio propio (ver compose.prod.yml).
 * Uso: node scripts/gen-cert.mjs
 */
import { execSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const certsDir = resolve("certs");
if (!existsSync(certsDir)) mkdirSync(certsDir, { recursive: true });

const crt = resolve(certsDir, "tickitflow.crt");
const key = resolve(certsDir, "tickitflow.key");

console.log("[gen-cert] generando certificado autofirmado (CN=localhost, 365 días)…");
execSync(
  `docker run --rm -v "${certsDir}:/certs" alpine:3.21 sh -c ` +
    `"apk add --no-cache openssl >/dev/null && ` +
    `openssl req -x509 -nodes -newkey rsa:2048 -days 365 ` +
    `-keyout /certs/tickitflow.key -out /certs/tickitflow.crt ` +
    `-subj '/CN=localhost' -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1'"`,
  { stdio: "inherit" },
);
console.log(`[gen-cert] listo: ${crt}`);
console.log("[gen-cert] nota: producción usa Let's Encrypt con dominio real.");
