#!/usr/bin/env node
/**
 * Smoke E2E del stack TickITFlow contra el gateway (compose o local).
 * Uso: node scripts/e2e-smoke.mjs
 * Sale con código 1 si cualquier verificación falla.
 */
const BASE = process.env.E2E_BASE ?? "http://127.0.0.1";
let failures = 0;

function check(name, cond, extra = "") {
  const mark = cond ? "PASS" : "FAIL";
  console.log(`${mark} · ${name}${cond ? "" : ` — ${extra}`}`);
  if (!cond) failures++;
}

async function req(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* respuestas sin cuerpo */
  }
  return { status: res.status, json };
}

async function main() {
  const stamp = Date.now().toString(36).toUpperCase();

  // 1. Logins de ambos roles
  const agente = await req("/api/auth/login", {
    method: "POST",
    body: { email: "agente@tickitflow.dev", password: "demo1234" },
  });
  check("login agente", (agente.status === 200 || agente.status === 201) && !!agente.json?.token);
  const ta = agente.json?.token;

  const usuario = await req("/api/auth/login", {
    method: "POST",
    body: { email: "usuario@tickitflow.dev", password: "demo1234" },
  });
  check("login usuario", (usuario.status === 200 || usuario.status === 201) && !!usuario.json?.token);
  const tu = usuario.json?.token;

  // 2. Agente: listar, crear y transicionar un incidente
  const list = await req("/api/incidents/tickets", { token: ta });
  check("lista de tickets ≥ 1", list.status === 200 && list.json.length >= 1);

  const created = await req("/api/incidents/tickets", {
    method: "POST",
    token: ta,
    body: {
      practice: "incidente",
      subject: `E2E ${stamp}: incidente de verificación`,
      description: "Creado por el smoke E2E.",
      requester: "Jorge Ramos",
      dept: "Soporte",
      priority: "P3",
    },
  });
  check(
    "agente crea incidente",
    (created.status === 200 || created.status === 201) && /^INC-/.test(created.json?.code ?? ""),
    JSON.stringify(created).slice(0, 120),
  );
  const code = created.json?.code;
  check("código de incidente", typeof code === "string" && /^INC-/.test(code), String(code));

  const patched = await req(`/api/incidents/tickets/${code}`, {
    method: "PATCH",
    token: ta,
    body: { status: "en_progreso", assignee: "Jorge Ramos" },
  });
  check("agente transiciona incidente", patched.status === 200 && patched.json?.status === "en_progreso");

  // 3. Usuario: crea su requerimiento — el solicitante se toma del token
  const userReq = await req("/api/incidents/tickets", {
    method: "POST",
    token: tu,
    body: {
      practice: "requerimiento",
      subject: `E2E ${stamp}: solicitud del usuario`,
      description: "Solicitud del smoke.",
      requester: "Alguien que no es el usuario", // spoof: el backend debe ignorarlo
      dept: "Finanzas",
      priority: "P4",
    },
  });
  check(
    "usuario crea requerimiento con solicitante propio",
    (userReq.status === 200 || userReq.status === 201) && userReq.json?.requester === "M. Aguilar",
    `requester=${userReq.json?.requester}`,
  );
  const userCode = userReq.json?.code;

  // 4. Usuario: nota en SU ticket permitida; cambiar estado prohibido
  const ownNote = await req(`/api/incidents/tickets/${userCode}`, {
    method: "PATCH",
    token: tu,
    body: { note: "Nota del usuario sobre su solicitud." },
  });
  check("usuario comenta su propio ticket", ownNote.status === 200);

  const ownStatus = await req(`/api/incidents/tickets/${userCode}`, {
    method: "PATCH",
    token: tu,
    body: { status: "resuelto" },
  });
  check("usuario NO cambia estado (403)", ownStatus.status === 403, String(ownStatus.status));

  const otherPatch = await req(`/api/incidents/tickets/${code}`, {
    method: "PATCH",
    token: tu,
    body: { note: "Intento de escribir en ticket ajeno." },
  });
  check("usuario NO escribe en ticket ajeno (403)", otherPatch.status === 403, String(otherPatch.status));

  // 5. Separación de prácticas: problemas y cambios solo desde la consola
  const userProblem = await req("/api/problems/problems", {
    method: "POST",
    token: tu,
    body: { title: `E2E ${stamp}: problema que no debe existir`, description: "x" },
  });
  check("usuario NO crea problemas (403)", userProblem.status === 403, String(userProblem.status));

  const userChange = await req("/api/changes/changes", {
    method: "POST",
    token: tu,
    body: { title: `E2E ${stamp}: cambio que no debe existir`, type: "normal", risk: "bajo", ventana: "x", description: "x", solicita: "x" },
  });
  check("usuario NO crea cambios (403)", userChange.status === 403, String(userChange.status));

  const agentProblem = await req("/api/problems/problems", {
    method: "POST",
    token: ta,
    body: {
      title: `E2E ${stamp}: disco agotándose en SRV-BI01`,
      description: "Detectado por el monitoreo.",
      linkedIncidentCodes: [code],
    },
  });
  check(
    "agente crea problema",
    (agentProblem.status === 200 || agentProblem.status === 201) && /^PRB-/.test(agentProblem.json?.code ?? ""),
  );

  const agentChange = await req("/api/changes/changes", {
    method: "POST",
    token: ta,
    body: {
      title: `E2E ${stamp}: ampliación de almacenamiento`,
      type: "estandar",
      risk: "bajo",
      ventana: "Inmediata",
      description: "Cambio estándar del smoke.",
      solicita: "Jorge Ramos",
      ciIds: ["CI-1004"],
    },
  });
  check(
    "agente crea cambio estándar pre-aprobado",
    (agentChange.status === 200 || agentChange.status === 201) && agentChange.json?.status === "aprobado",
    `status=${agentChange.json?.status}`,
  );

  // 6. Series históricas
  const metrics = await req("/api/incidents/metrics/daily?days=14", { token: ta });
  check(
    "métricas diarias disponibles",
    metrics.status === 200 && Array.isArray(metrics.json) && metrics.json.length >= 1,
  );

  // 7. Notificaciones por rol
  await new Promise((r) => setTimeout(r, 1500));
  const feedAgente = await req("/api/notifications/notifications?limit=50", { token: ta });
  check(
    "feed del agente con eventos",
    feedAgente.status === 200 && feedAgente.json.length >= 3,
  );
  const feedUsuario = await req("/api/notifications/notifications?limit=50", { token: tu });
  const allOwn =
    feedUsuario.status === 200 &&
    feedUsuario.json.every((n) => n.audience === "M. Aguilar");
  check("feed del usuario aislado a sus tickets", allOwn);
  check(
    "el usuario ve su propio registro",
    feedUsuario.json.some((n) => n.code === userCode),
  );

  console.log(
    failures === 0
      ? `\nE2E SMOKE: OK`
      : `\nE2E SMOKE: ${failures} verificaciones fallaron`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("[e2e-smoke] error fatal:", err.message);
  process.exit(1);
});
