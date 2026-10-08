# TickITFlow

Sistema de mesa de servicio de TI basado en ITIL con arquitectura de microservicios, React y Docker.

## Qué es

TickITFlow gestiona el ciclo completo de soporte de TI con las seis prácticas ITIL:

| Práctica | Descripción |
|---|---|
| Incidentes | Algo se rompió: se registra, prioriza por matriz ITIL y resuelve contra SLA visible |
| Requerimientos | El catálogo de autoservicio recibe solicitudes ya clasificadas |
| Problemas | Causa raíz de incidentes recurrentes, con investigación y workaround |
| Cambios | Flujo CAB con aprobación por rol: normal, estándar pre-aprobado, emergencia |
| CMDB | Elementos de configuración con relaciones tipadas y tickets ligados |
| Base de conocimiento | Soluciones documentadas disponibles para agentes y usuarios |

## Ejecución

```bash
# Clonar y levantar el stack completo (20 contenedores)
git clone https://github.com/jorgeramos2708/it-support-tickets-system.git
cd it-support-tickets-system
docker compose up -d --build

# Verificar que todos los servicios estén saludables
curl http://127.0.0.1/api/incidents/health
```

### URLs

| Servicio | URL |
|---|---|
| Consola de agentes | http://127.0.0.1 |
| Portal de autoservicio | http://127.0.0.1/portal |
| Landing | http://127.0.0.1/landing |
| Traefik dashboard | http://127.0.0.1:8080 |
| RabbitMQ management | http://127.0.0.1:15672 (tickit/tickit) |
| Prometheus | http://127.0.0.1:9090 |
| Grafana | http://127.0.0.1:3000 (tickit/tickit) |
| Swagger auth | http://127.0.0.1/api/auth/api/docs |
| Swagger incidents | http://127.0.0.1/api/incidents/api/docs |

### Cuentas de demostración

Todas usan la contraseña `demo1234`:

| Cuenta | Rol | Acceso |
|---|---|---|
| `agente@tickitflow.dev` | agente | Consola + portal |
| `usuario@tickitflow.dev` | usuario | Solo portal |
| `admin@tickitflow.dev` | admin | Consola + portal + gestión de usuarios |

## Arquitectura

```
                    ┌──────────────┐
   Usuarios ──────▶ │ Traefik      │ ──── Rate limiting
                    │   gateway    │ ──── TLS (prod)
                    └──────┬───────┘
                           │
         ┌─────────┬───────┼───────┬─────────┐
         ▼         ▼       ▼       ▼         ▼
    ┌───────┐ ┌────────┐ ┌─────┐ ┌──────┐ ┌──────────┐
    │ auth  │ │incidents│ │prob.│ │chang.│ │ cmdb  kb │
    │ :4001 │ │  :4003  │ │:4005│ │:4006 │ │:4007 :4008│
    └───┬───┘ └───┬────┘ └──┬──┘ └───┬──┘ └──┬────┬───┘
        │         │         │        │       │    │
    ┌───▼───┐ ┌───▼────┐ ┌─▼──┐ ┌───▼──┐ ┌──▼┐ ┌─▼──┐
    │  PG   │ │   PG   │ │ PG │ │  PG  │ │PG │ │ PG │
    └───────┘ └────────┘ └────┘ └──────┘ └───┘ └────┘

                    ┌──────────────┐
                    │   RabbitMQ   │ ◀── topic: itil.events
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐     ┌──────────┐
                    │notifications │────▶│Prometheus│
                    │    :4009     │     │  :9090   │
                    └──────────────┘     └────┬─────┘
                                              │
                                         ┌────▼─────┐
                                         │ Grafana  │
                                         │  :3000   │
                                         └──────────┘
```

### Microservicios

| Servicio | Puerto | Base de datos | Función |
|---|---|---|---|
| auth | 4001 | PostgreSQL | JWT, roles, gestión de usuarios |
| incidents | 4003 | PostgreSQL | CRUD de tickets, eventos, series históricas, métricas |
| problems | 4005 | PostgreSQL | RCA, estados, incidentes ligados |
| changes | 4006 | PostgreSQL | Flujo CAB, aprobaciones por rol |
| cmdb | 4007 | PostgreSQL | Elementos de configuración con relaciones |
| kb | 4008 | PostgreSQL | Artículos de conocimiento, voto útil |
| notifications | 4009 | PostgreSQL | Consumidor del bus, feed por rol, SSE |

### Frontend

React + Vite + Tailwind v4 + shadcn/ui, con tres superficies:
- **Consola de agentes** (`/`): dashboard, colas, detalle, reportes, CMDB, KB, problemas, cambios
- **Portal de autoservicio** (`/portal`): catálogo, reportar incidentes, mis tickets
- **Landing** (`/landing`): presentación pública

## Pruebas

```bash
# Backend (Jest en cada servicio)
cd services/auth && npm test
cd services/incidents && npm test
# ... etc para cada servicio

# Frontend (vitest)
cd frontend && npm run test

# E2E del stack (requiere docker compose up)
node scripts/e2e-smoke.mjs
```

Total: 30 tests backend + 21 frontend + 18 smoke E2E = **69 verificaciones**.

## Producción

```bash
# Generar certificado autofirmado de demo
node scripts/gen-cert.mjs

# Levantar con TLS y redirect HTTP→HTTPS
docker compose -f docker-compose.yml -f compose.prod.yml up -d
```

Para producción real: sustituye el certificado autofirmado por Let's Encrypt con un dominio propio.

## CI/CD

El workflow de GitHub Actions corre en cada push:
1. Build + test de cada microservicio (matrix)
2. Build + test del frontend
3. E2E del stack completo con Docker Compose
4. Publish opcional (requiere `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN` en secrets)
