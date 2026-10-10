# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Frontend: React + Vite + Tailwind CSS v4 (tokens en @theme) + class-variance-authority + cmdk (paleta ⌘K) + lucide-react + vitest. Part of a shipped microservices system: 7 NestJS services (auth, incidents, problems, changes, cmdb, kb, notifications), PostgreSQL per service, RabbitMQ, Prometheus+Grafana, all in Docker behind a host Caddy gateway (Traefik standalone override available). The frontend is a SPA served behind the gateway and consumes only the gateway's REST API with JWT auth.

## Users

- Agentes de TI (primary): work in the agent console 8h/day triaging and resolving tickets. First surface is built for them.
- Administradores de TI: manage users, SLA policies, and view KPI reports.
- Usuarios finales (later, separate surface): self-service portal to create tickets and browse the service catalog.

## Product Purpose

TickITFlow is a web ticketing system built on ITIL practices: incident management, service requests, problem management, change management, CMDB, knowledge base, and SLA tracking. Success means an agent can triage, work, and resolve tickets within SLA without friction, and management sees KPIs (backlog, MTTR, SLA compliance) at a glance.

## Positioning

Enterprise ITIL process rigor delivered with an elegant, high-craft console UX instead of the heavy, cluttered enterprise tools (ServiceNow, Jira Service Management) the market tolerates.

## Operating Context

Agents live in the console all day: dense ticket queues, SLA timers counting down, priority matrix (impact x urgency), ticket detail with activity log, approvals, CMDB links, KPI dashboards. ITIL terminology (incidente, requerimiento, problema, cambio, CI, SLA) is the working vocabulary. UI language: Spanish (inferred from all project conversation; confirmable).

## Capabilities and Constraints

Planned microservices: auth, users, incidents, request catalog, problems, changes, CMDB, KB, workflow, SLA, notifications, reports — behind a Traefik gateway, event-driven via RabbitMQ. Greenfield: no real data exists yet; demonstration content is synthetic and must be labeled as such.

## Brand Commitments

Name: **TickITFlow** (binding). Logo: to be designed — enterprise-grade, contrasting colors, elegant (binding user requirements). Overall look: professional, enterprise, elegant (binding). Components are hand-built in-repo on Tailwind v4 tokens + cva; charts are hand-rolled SVG in the world's grammar (no chart library shipped).

## Evidence on Hand

Functional reference: thekavak/Laravel-Support-Ticket-System (roles: admin/team/user; screens: dashboard, ticket list, ticket detail, users, statuses) — functional inspiration only, not a visual benchmark. No real customers, data, or screenshots exist; nothing may be presented as real.

## Product Principles

1. Density with elegance: an 8-hour tool earns beauty through rhythm, hierarchy, and precision — not decoration.
2. State always visible: SLA timers, priorities, and ticket states are the hero information, never hidden behind clicks.
3. Motion serves the task: feedback that clarifies state changes, never animation that delays the operator.
4. ITIL clarity: correct terminology and process rigor without bureaucratic friction.
5. Accessible by default: contrast and keyboard-first interactions for all-day use.

## Accessibility & Inclusion

All-day operator tool: WCAG AA minimum contrast, keyboard-first flows, tabular numerals for metrics.
