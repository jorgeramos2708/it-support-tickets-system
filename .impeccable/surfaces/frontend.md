---
version: 2
slug: "frontend"
primary_target: "frontend"
related_targets: []
---

# Surface brief - Consola de agentes TickITFlow

## Alcance y modo de visitante
App completa de la consola de agentes: shell (topbar + rail de prácticas), dashboard, colas por práctica con master-detail, detalle de ticket, nuevo incidente/requerimiento, problemas, cambios, CMDB, KB, reportes, configuración, command palette. Modo: **Operate**.

## Audiencia, trabajo, acción, prueba, restricciones
Agentes de TI en turnos completos; tarea = triage y resolución dentro de SLA sin fricción; acción primaria = atender la cola SLA crítico o crear ticket en ≤3 teclas; prueba = KPIs y colas alimentadas por datos reales en modo live (etiquetados) o sintéticos en demo (etiquetados DEMO); restricciones = WCAG AA, teclado primero, es-MX, React+Vite+Tailwind, dual tema día/noche, prefers-reduced-motion respetado.

## Direction contract

THESIS: La consola ITIL como sala de guardia nocturna — superficie oscura, un solo ámbar de acción, prioridades semáforo. Rechaza tanto el papel suizo anterior como el admin SaaS genérico: aquí la firma es el master-detail pegajoso con swap, el conteo de KPIs y el ámbar que solo toca lo importante.

OWN-WORLD: bg #17181c → panel #202228 → panel-2 #1c1d22 (elevación = superficies que se aclaran + borde 1px #2e3038), texto #ececf1, muted #a8abba, ámbar #f5a524 único acento (glow solo en hover de primario y en "En riesgo de SLA"), danger #ff8f85, ok #7ddfa5, chips #32343e. Nunito 800 display / Nunito Sans cuerpo / tabular-nums en IDs, SLA y KPIs. Radios 8–16px. Prioridades: P1 rojo, P2 naranja, P3 amarillo, P4 verde. Tema claro hermano: bronce #b45309 como ámbar de texto, superficies papel, misma estructura. Motion: rise escalonado, swap de panel, pulso de dot vencido, flash ámbar de fila, count-up de KPIs — todo bajo prefers-reduced-motion.

STORY: El agente ve qué vence primero en un vistazo, cambia de ticket sin navegar (panel derecho pegajoso), confía en los KPIs porque los números no bailan (tabulares) y son reales o declarados demo.

FIRST VIEWPORT: Topbar con marca, búsqueda ⌘K y acción primaria ámbar; rail de prácticas con conteos; banda de KPIs como tarjetas (hover levanta, riesgo con glow inset); en colas, grid 1fr/440px: lista a la izquierda con filas escalonadas, panel de detalle sticky a la derecha que hace swap al cambiar selección (?ticket= deep-link).

FORM: Dirección fijada por el usuario (spec completo: tokens, tipografía, componentes, animaciones); code-led; el spec del usuario es la autoridad sobre cualquier default del craft-floor (glow, inset-bar de selección, hover-translateY son requisitos explícitos).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Decisiones abiertas
Ninguna pendiente del usuario. Registro menor: matiz del naranja P2 vs ámbar acento se desambigua por contexto (chips rellenos vs acción).
