#!/usr/bin/env node
/**
 * Construye, etiqueta y publica las imágenes del stack al registry.
 * Uso local / CI con DOCKERHUB_USERNAME + DOCKERHUB_TOKEN en el ambiente.
 * Uso: node scripts/publish.mjs
 */
import { execSync, spawnSync } from "node:child_process";
import process from "node:process";

const user = process.env.DOCKERHUB_USERNAME;
const token = process.env.DOCKERHUB_TOKEN;
if (!user || !token) {
  console.error(
    "[publish] faltan DOCKERHUB_USERNAME / DOCKERHUB_TOKEN — omitiendo publicación.",
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

// docker login por stdin sin shell-isms (portable a Windows)
const login = spawnSync(
  "docker",
  ["login", "--username", user, "--password-stdin"],
  { input: `${token}\n`, stdio: ["pipe", "inherit", "inherit"] },
);
if (login.status !== 0) {
  console.error("[publish] docker login falló");
  process.exit(1);
}

for (const { service, context } of IMAGES) {
  const tag = `${user}/tickitflow-${service}:${VERSION}`;
  console.log(`[publish] ${tag}`);
  execSync(`docker build -t ${tag} ${context}`, { stdio: "inherit" });
  execSync(`docker push ${tag}`, { stdio: "inherit" });
}

console.log(`[publish] listo: ${IMAGES.length} imágenes etiquetadas ${VERSION}`);
