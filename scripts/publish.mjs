#!/usr/bin/env node
/**
 * Construye, etiqueta y publica las imágenes del stack al Zot registry.
 * Uso local / CI con ZOT_CI_USER + ZOT_CI_PASSWORD en el ambiente.
 * Uso: node scripts/publish.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import process from "node:process";

const registry = process.env.ZOT_REGISTRY ?? "registry.edrs.xyz";
const user = process.env.ZOT_CI_USER;
const password = process.env.ZOT_CI_PASSWORD;

if (!user || !password) {
  console.error(
    "[publish] faltan ZOT_CI_USER / ZOT_CI_PASSWORD — omitiendo publicación.",
  );
  process.exit(0);
}

const VERSION = process.env.VERSION ?? "latest";
const IMAGES = [
  { service: "auth", context: "services/auth" },
  { service: "incidents", context: "services/incidents" },
  { service: "problems", context: "services/problems" },
  { service: "changes", context: "services/changes" },
  { service: "cmdb", context: "services/cmdb" },
  { service: "kb", context: "services/kb" },
  { service: "notifications", context: "services/notifications" },
  { service: "frontend", context: "frontend" },
];

// Login al registry por stdin (portable, sin shell-isms)
const login = spawnSync(
  "docker",
  ["login", registry, "--username", user, "--password-stdin"],
  { input: `${password}\n`, stdio: ["pipe", "inherit", "inherit"] },
);
if (login.status !== 0) {
  console.error(`[publish] docker login a ${registry} falló`);
  process.exit(1);
}

for (const { service, context } of IMAGES) {
  const tag = `${registry}/tickitflow/${service}:${VERSION}`;
  console.log(`[publish] ${tag}`);
  // Legacy builder: Docker v2 manifest (sin OCI attestations) — máxima compatibilidad con Zot
  execSync(`DOCKER_BUILDKIT=0 docker build -t ${tag} ${context}`, { stdio: "inherit" });
  execSync(`docker push ${tag}`, { stdio: "inherit" });
}

console.log(`[publish] listo: ${IMAGES.length} imágenes en ${registry}/tickitflow/ (${VERSION})`);
