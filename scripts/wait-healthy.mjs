#!/usr/bin/env node
/**
 * Espera a que los siete endpoints /api/*/health respondan OK.
 * Uso: node scripts/wait-healthy.mjs [timeoutMs=120000]
 */
const BASE = process.env.E2E_BASE ?? "http://127.0.0.1";
const SERVICES = [
  "auth",
  "incidents",
  "problems",
  "changes",
  "cmdb",
  "kb",
  "notifications",
];
const TIMEOUT = Number(process.argv[2] ?? 120_000);

const start = Date.now();
const pending = new Set(SERVICES);

async function probe(service) {
  try {
    const res = await fetch(`${BASE}/api/${service}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const body = await res.json();
    return body.status === "ok";
  } catch {
    return false;
  }
}

process.on("SIGINT", () => {
  console.error("[wait-healthy] cancelado");
  process.exit(1);
});

while (pending.size > 0) {
  for (const service of [...pending]) {
    if (await probe(service)) {
      pending.delete(service);
      console.log(`[wait-healthy] ${service} OK`);
    }
  }
  if (pending.size === 0) break;
  if (Date.now() - start > TIMEOUT) {
    console.error(
      `[wait-healthy] timeout esperando: ${[...pending].join(", ")}`,
    );
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 2000));
}

console.log("[wait-healthy] todos los servicios saludables");
