# EVIDENCE.md

Ledger de evidencias para cada afirmación pública de TickITFlow (rubrica ai-slop §5).
Toda afirmación verificable mapea a un artefacto del repo. Lo no listado aquí no se afirma en superficies públicas.

| Claim (dónde aparece) | Fuente en el repo | Confianza | Redacción permitida |
|---|---|---|---|
| "La mesa de servicio ITIL con la cola siempre a la vista" (Landing h1) | Colas SLA-first: `frontend/src/views/QueueView.tsx` (master-detail), `Dashboard.tsx` (SLA crítico) | Alta | Tal cual — es posicionamiento, no métrica |
| "prácticas ITIL completas" (Landing) | Incidentes+requerimientos (`services/incidents`), problemas (`services/problems`), cambios CAB (`services/changes`), CMDB (`services/cmdb`), KB (`services/kb`) — 6 prácticas, 5 dominios de servicio | Alta | "Las seis prácticas" — **no** "cada práctica en su propio servicio" (incidentes y requerimientos comparten servicio) |
| "Cada dominio corre en su propio servicio NestJS con su base PostgreSQL dedicada" (Landing, corregida) | `docker-compose.yml`: 7 servicios NestJS + 7 BDs PostgreSQL dedicadas | Alta | Tal cual, con la aclaración de tickets compartida |
| "detrás de un gateway" (Landing) | Producción: Caddy del host sobre `caddy_net` (`docker-compose.override.yml` generado en deploy); alternativa Traefik en `docker-compose.traefik.yml` | Alta | "un gateway" — **no** nombrar Traefik como gateway de producción |
| "bus RabbitMQ que publica cada evento" (Landing) | `services/*/src/bus.ts` (publishEvent), `services/notifications/src/app.module.ts` (BusConsumer), `docker-compose.yml` rabbitmq | Alta | Tal cual |
| Credenciales demo: `agente@tickitflow.dev` / `demo1234` (Landing, e2e) | `services/auth/src/app.module.ts` seed (gate `SEED_DEMO`/`NODE_ENV≠production`) + credenciales visibles en `scripts/e2e-smoke.mjs` | Alta | Son datos sembrados, no usuarios reales |
| "Modo dual, sin engaños" (Landing) | `frontend/src/lib/mode.ts` + chips "Datos en vivo"/"Datos demo" en `Shell.tsx`/`PortalShell.tsx`; KPIs demo etiquetados `demo` en `Dashboard.tsx` | Alta | Tal cual |
| "prioridad calculada por matriz de impacto × urgencia" (Landing) | Chips P1–P4 (`frontend/src/lib/types.ts` Priority, `Chips.tsx` semáforo), SLA por prioridad en `frontend/src/lib/sla.ts` | Alta | Tal cual |
| "consola de agentes y portal de autoservicio" (Landing) | Rutas `/` (Shell consola) y `/portal/*` (`App.tsx`, PortalShell) con separación de roles (`usuario` → portal) | Alta | Tal cual |
| Versión `v0.1` (rail de la consola) | `package.json` version 0.1.x de cada servicio; los footers del portal y la landing se retiraron por decisión del usuario — el único indicador es el del rail | Alta | Actualizar al subir versión |
| "Demostración con datos sintéticos" (footers) | Sin datos de clientes reales: seeds demo + e2e — nada presentado como real | Alta | Tal cual — obligatorio mantener el etiquetado |

## Fuera de alcance afirmativo (prohibido hasta tener evidencia)

- Números de clientes, testimonios, métricas de uso, logos de terceros.
- Benchmarks de rendimiento.
- "SLA cumplido al X%" como claim de marketing (el cumplimiento es dato en vivo del usuario, no del producto).

## Mantenimiento

Al añadir una afirmación pública en Landing/Portal/consola: fila nueva aquí con su fuente. Si la fuente no existe, la afirmación no se publica.
