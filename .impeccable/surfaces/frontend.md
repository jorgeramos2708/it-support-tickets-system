---
version: 1
slug: "frontend"
primary_target: "frontend"
related_targets: []
---

# Surface brief — Consola de agentes TickITFlow

## Alcance y modo de visitante
App completa de la consola de agentes v1: shell (topbar + rail de prácticas + retícula 12 col), dashboard, colas por práctica, detalle de ticket, nuevo incidente y command palette. Modo: **Operate**.

## Audiencia, trabajo, acción, prueba, restricciones
Agentes de TI en turnos completos; tarea = triage y resolución dentro de SLA sin fricción; acción primaria = atender la cola SLA crítico o crear incidente en ≤3 teclas; prueba = KPIs y colas alimentadas por datos sintéticos etiquetados DEMO; restricciones = WCAG AA, teclado primero, es-MX, React+Vite+Tailwind+shadcn/ui, sin dark mode en v1, sin gradientes/glass/glow.

## Dirección elegida y momento memorable
El Informe Anual (corporativo suizo, era IBM). Momento memorable: el medidor SLA por fila en la tabla héroe — la cuenta regresiva en mono tabular es lo más ruidoso de la pantalla.

## Direction contract

THESIS: La consola ITIL como el último informe anual de IBM — papel, tinta, filete y un rojo. Rechaza el admin oscuro con acento neón y las tarjetas flotantes del SaaS por defecto.

OWN-WORLD: Papel #FBFBF9, tinta #15181E, filetes hairline 1px, retícula estricta, numerales tabulares, voz mono para datos, jerarquía por peso y caja (nunca tamaño). El color es solo estado — verde #0E8345, ámbar #B45309, rojo #DA291C — y un matiz por práctica en badges: incidente rojo, requerimiento azul, problema ámbar, cambio violeta.

STORY: El agente ve qué vence primero en un vistazo, confía en que el SLA está bajo control porque el medidor por fila es lo más ruidoso, y abre o crea un ticket en ≤3 teclas.

FIRST VIEWPORT: Topbar h-14 con marca, búsqueda ⌘K y usuario; rail izquierdo de prácticas (3 col); banda KPI con 4 métricas tabulares bajo filetes; tabla héroe "SLA crítico" con ID mono, asunto, badge de práctica, chip de prioridad y medidor SLA con cuenta regresiva; módulos secundarios recientes y mis asignados; acción primaria "Nuevo incidente" rellena roja junto a la búsqueda.

FORM: El Informe Anual — candidato 3 de 7 de la lista fundamentada; semilla 431a9fb1; veredictos: split-flap competitivo (pulso de fila adoptado), manual de pestañas competitivo (matiz por práctica adoptado), mosaico denso competitivo (hairline + pestaña de módulo adoptados), horario y feed declinados con disciplinas donadas (rango por peso; navegación precargada).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Decisiones abiertas
Matiz final del rojo (#DA291C vs #E30613); traducción futura a modo oscuro; voz mono alternativa (JetBrains Mono); orientación de la muesca del logo; Tremor entra en el módulo reportes (v1 usa SVG dibujado en la gramática del mundo para el gráfico de volumen).
