---
name: TickITFlow
description: Mesa de servicio ITIL en modo dual día/noche — la sala de guardia: superficie oscura con un único ámbar de acción y prioridades semáforo.
colors:
  noche-bg: "#17181c"
  noche-panel: "#202228"
  noche-panel-2: "#1c1d22"
  noche-row-hover: "#262830"
  noche-row-selected: "#2a2b33"
  noche-border: "#2e3038"
  noche-texto: "#ececf1"
  noche-muted: "#a8abba"
  noche-chip: "#32343e"
  dia-bg: "#f6f6f2"
  dia-panel: "#ffffff"
  dia-panel-2: "#f0f0ea"
  dia-border: "#e6e6df"
  dia-texto: "#17181c"
  dia-muted: "#626977"
  ambar-fill: "#f5a524"
  ambar-fill-ink: "#17181c"
  ambar-texto-dia: "#a34a0a"
  ambar-hi-dia: "#92400e"
  ambar-hi-noche: "#ffd27a"
  danger-dia: "#c41e14"
  danger-noche: "#ff8f85"
  ok-dia: "#0b6634"
  ok-noche: "#7ddfa5"
  p1-dia: "#dc2626"
  p2-dia: "#c2410c"
  p3-dia: "#ca8a04"
  p4-dia: "#0e8345"
  p1-noche: "#ff8f85"
  p2-noche: "#ff9d5c"
  p3-noche: "#facc15"
  p4-noche: "#7ddfa5"
  cobalto-requerimiento: "#1d4ed8"
  violeta-cambio: "#7c3aed"
typography:
  display:
    fontFamily: "Nunito Variable, Nunito, ui-sans-serif, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  panel-title:
    fontFamily: "Nunito Variable, Nunito, sans-serif"
    fontSize: "30px"
    fontWeight: 800
    lineHeight: 1.2
  kpi:
    fontFamily: "Nunito Variable, Nunito, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    fontFeature: "tnum"
  body:
    fontFamily: "Nunito Sans Variable, Nunito Sans, ui-sans-serif, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Nunito Sans Variable, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    letterSpacing: "0.12em"
    textTransform: "uppercase"
  dato:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    fontFeature: "tnum"
rounded:
  chip: "8px"
  control: "12px"
  kpi: "14px"
  card: "16px"
motion:
  ease: "cubic-bezier(.2,.8,.2,1)"
  rise: "450ms + stagger 50ms (cap índice 12)"
  swap: "300ms"
  pulse-dot: "1.8s infinite (solo vencido)"
  flash: "1.2s ease-out (actualización de fila)"
  shimmer: "1.3s linear (skeletons)"
  countUp: "600ms ease-out cúbico"
  reducedMotion: "0.01ms global"
components:
  button-primary:
    backgroundColor: "{colors.ambar-fill}"
    textColor: "{colors.ambar-fill-ink}"
    rounded: "{rounded.control}"
    hover: "translateY(-2px) + glow ámbar"
  button-outline:
    backgroundColor: "transparent"
    border: "1px border/3b3d49"
    hover: "border ámbar + shadow-2"
  chip-prioridad:
    backgroundColor: "p1..p4 del semáforo"
    textColor: "contraste por matiz"
    rounded: "{rounded.chip}"
    fontWeight: 800
  kpi-card:
    backgroundColor: "{colors.noche-panel}"
    rounded: "{rounded.kpi}"
    shadow: "sh-1, hover: sh-2 + translateY(-3px)"
  detail-pane:
    width: "440px (480 en xl)"
    position: "sticky, h=calc(100vh-3.5rem)"
    backgroundColor: "{colors.noche-panel-2}"
---

# Design System: TickITFlow

## Overview

**Creative North Star: "Sala de Guardia"**

TickITFlow es una mesa de servicio ITIL que vive en dos luces: la **noche** (default) — superficie oscura #17181c donde la elevación la construyen superficies que se aclaran (#17181c → #202228 → #2a2b33) más un borde de 1px, y el **día** — papel cálido #f6f6f2 con la misma estructura. Un solo ámbar de acción (#f5a524) toca lo importante: el botón primario, la selección, el riesgo; el resto del color es estado. Las prioridades hablan en semáforo: P1 rojo, P2 naranja, P3 amarillo, P4 verde. Nunito 800 es la voz display; Nunito Sans el cuerpo; IBM Plex Mono solo el dato medible. El motion tiene vocabulario propio — rise escalonado, swap del panel, pulso del vencido, flash de la fila que cambia — y todo se apaga bajo prefers-reduced-motion.

**Key Characteristics:**
- Dual día/noche por tokens: mismos componentes, dos luces; toggle persiste, noche es default
- Ámbar #f5a524 como ÚNICO acento: acción primaria, selección (barra inset de 4px), foco, riesgo KPI (ring inset)
- Prioridades semáforo en chips rellenos: P1 #dc2626/#ff8f85 · P2 #c2410c/#ff9d5c · P3 #ca8a04/#facc15 · P4 #0e8345/#7ddfa5 (día/noche)
- Nunito 800 para jerarquía: página 34px, panel 30px, KPI 32px; labels 11px/700/.12em
- tabular-nums en todo dato: IDs, SLA, KPIs, contadores
- Master-detail en colas: lista 1fr + panel de detalle sticky 440px con swap; deep-link por ?ticket=
- Radios 8–16px; sombras sh-1/2/3 solo como elevación real; glow reservado al hover primario y al KPI en riesgo

## Colors

### Noche (default)
- **bg** #17181c · **panel** #202228 · **panel-2** #1c1d22 (detalle) · **row-hover** #262830 · **row-selected** #2a2b33 · **chip** #32343e
- **texto** #ececf1 (15.1:1) · **texto-2** #c9ccda · **muted** #a8abba (7.8:1 sobre papel, 7.0:1 sobre panel) · **border** #2e3038 · **border-fuerte** #3b3d49

### Día
- **bg** #f6f6f2 · **panel** #ffffff · **panel-2** #f0f0ea · **row-hover** #f0f0ea · **row-selected** #f5efdf · **chip** #ecece6
- **texto** #17181c (16.4:1) · **muted** #626977 · **border** #e6e6df · **border-fuerte** #c9cbc3

### Acento — Ámbar (el único)
- **Ámbar de relleno** #f5a524 (ambas luces): botón primario con texto #17181c (8.7:1), barra de selección, foco visible
- **Ámbar de texto**: día #a34a0a (AA sobre papel y panel-2) / noche #f5a524; hover #92400e / #ffd27a

### Estado
- **Vencido/danger**: #c41e14 / #ff8f85 · **En tiempo/ok**: #0b6634 / #7ddfa5 (día oscurecidos para AA sobre panel-2)

### Prácticas ITIL (matices en badges y gráficas)
- Incidente: danger · Requerimiento: cobalto #1d4ed8/#7fa6f0 · Problema: ámbar · Cambio: violeta #7c3aed/#a97df5

### Named Rules
**La Regla del Ámbar Único.** El ámbar es acción, selección, foco o riesgo. Si un elemento es ámbar sin significar una de esas cuatro cosas, es un defecto. El semáforo P1–P4 es la única familia cromática con permiso de saturación aparte.
**La Regla de las Dos Luces.** Cada color existe en pareja día/noche; jamás se hardcodea un valor: se usa el token semántico (paper, raised, ink, rule, signal, good, amber, p1–p4) y la pareja se resuelve por [data-theme].

## Typography

**Display:** Nunito Variable (self-hosted @fontsource, 800) — página 34px/1.1, panel 30px/1.2, asunto del pane 24px/1.2, KPI 32px.
**Body:** Nunito Sans Variable (400–700) — 13–14px/1.6.
**Label:** Nunito Sans 700, 11px, +0.12em, mayúsculas — columnas, KPIs, propiedades.
**Dato:** IBM Plex Mono 500, 11–12.5px, tabular — IDs, temporizadores, conteos, kbd.

**La Regla del Dato Tabular.** Todo número que se actualiza en vivo lleva tabular-nums: la cuenta regresiva SLA no baila.
**La Regla del Peso.** La jerarquía la lleva Nunito 800 sobre 700; nunca se infla el tamaño para distinguir.

## Layout

Consola: topbar h-14 + rail w-56 + main. En colas, grid master-detail `minmax(0,1fr) 440px` (480 en ≥xl): lista con filtros a la izquierda, panel de detalle sticky (top-0, h=calc(100vh-3.5rem), overflow propio, sangrado a borde derecho) a la derecha. Selección inline por ?ticket= (deep-link); ✕ limpia. En <lg el panel baja como tarjeta redondeada 16px, estático. Portal: hereda sin rail, ≤980px. Landing: póster del mundo, titular Nunito 800 gigante.

## Elevation & Depth

- **sh-1** (tarjetas en reposo) / **sh-2** (hover de tarjetas y botones) / **sh-3** (lo que flota: paleta ⌘K)
- Noche: las sombras negras casi no se ven — la profundidad real la dan el borde 1px y las superficies que se aclaran
- **Glow** (0 0 0 1px ámbar/50 + 24px ámbar/18): SOLO hover del botón primario y KPI "En riesgo" (como ring inset)

## Shapes

Chips 8px · botones/inputs/filtros 12px · KPI 14px · tarjetas/módulos/cmdk 16px · dots de estado 6px · dot de vencido 8px. Puntos de práctica: cuadrados 6px de radio 2px.

## Motion

- **rise** 450ms + stagger `--i·50ms` (cap índice 12): entrada de filas y vistas
- **swap** 300ms translateX(14px): el panel de detalle re-anima con `key={ticket.id}` al cambiar selección
- **pulse-dot** 1.8s: el punto de 8px junto al texto del SLA vencido — nunca la fila entera
- **flash** ámbar 1.2s: la fila que cambió por datos nuevos (pulses del store)
- **shimmer** 1.3s: skeletons de carga (nunca spinners)
- **countUp** 600ms ease-out cúbico: KPIs al cargar (instantáneo bajo reduced-motion)
- **hover** translateY(-2/-3px): tarjetas y botones se levantan, no se hunden

`@media (prefers-reduced-motion: reduce)`: todo a 0.01ms, countUp set directo.

## Components

- **Buttons:** primario ámbar relleno + glow hover; outline con borde que se vuelve ámbar; elevación -2px al hover, scale .98 al activar
- **PriorityChip:** relleno semáforo, Nunito 800 12px tabular, radio 8, tooltip con nombre completo
- **Fila de ticket:** tabla densa con sort; hover row-hover; seleccionada row-selected + barra ámbar inset 4px **en la primera celda** (box-shadow en `<tr>` no renderiza); foco j/k con ring ámbar
- **SLAMeter:** pista 3px redondeada, relleno ok/ámbar/danger, cuenta regresiva mono tabular; vencido suma el dot pulsante
- **KPI:** tarjeta 14px, hover -3px + sh-2; "En riesgo" lleva ring inset ámbar; número 32px/800 con countUp
- **Panel de detalle:** bg panel-2, sticky, swap por key; meta en módulos 16px con Propiedad label+valor
- **Links:** subrayado que crece 0→100% en 250ms; ámbar de texto por tema

## Do's and Don'ts

### Do
- **Do** usar el token semántico, nunca el hex: la pareja día/noche se resuelve sola
- **Do** tabular-nums en todo número vivo; mono solo para dato medible
- **Do** mantener el glow como lujo escaso: primario y riesgo
- **Do** declarar demo/live honestamente (chip "Datos demo"/"Datos en vivo")
- **Do** prefers-reduced-motion: sin excepciones

### Don't
- **Don't** uses gradientes, glass ni blur decorativo
- **Don't** inventes colores fuera del semáforo, el ámbar, el estado y los matices de práctica
- **Don't** pongas sombra en `<tr>` — la barra de selección vive en el primer `<td>`
- **Don't** animes la fila entera para el vencido — el pulso es del dot de 8px
- **Don't** uses ámbar decorativo: si no es acción/selección/foco/riesgo, es tinta
