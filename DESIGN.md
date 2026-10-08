---
name: TickITFlow
description: Consola de agentes de tickets TI basada en ITIL — el rigor del informe anual corporativo suizo.
colors:
  papel: "#fbfbf9"
  papel-elevado: "#ffffff"
  tinta: "#15181e"
  tinta-secundaria: "#3d434d"
  tinta-tenue: "#666d78"
  filete: "#dcded9"
  filete-fuerte: "#c3c6bf"
  rojo-carta: "#da291c"
  rojo-carta-profundo: "#b22116"
  cobalto-requerimiento: "#1d4ed8"
  verde-cumplimiento: "#0e8345"
  ambar-riesgo: "#b45309"
  violeta-cambio: "#7c3aed"
typography:
  display:
    fontFamily: "Inter Tight Variable, Inter Variable, ui-sans-serif, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter Variable, ui-sans-serif, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter Variable, ui-sans-serif, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter Variable, ui-sans-serif, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.08em"
  dato:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    fontFeature: "tnum"
rounded:
  xs: "1px"
  sm: "3px"
  md: "4px"
  marca: "10px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.rojo-carta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.papel-elevado}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "36px"
  input:
    backgroundColor: "{colors.papel-elevado}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "36px"
  chip-prioridad-p1:
    backgroundColor: "{colors.rojo-carta}"
    textColor: "{colors.papel}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  modulo:
    backgroundColor: "{colors.papel}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
---

# Design System: TickITFlow

## Overview

**Creative North Star: "El Informe Anual"**

La consola de TickITFlow es el último informe anual de IBM convertido en herramienta de trabajo: papel, tinta, filetes de 1px y un solo rojo de cartel. Un agente de TI vive aquí ocho horas al día, así que la elegancia no viene de la decoración sino de la densidad resuelta — retícula estricta, numerales tabulares, jerarquía por peso tipográfico y color usado exclusivamente como estado. Rechazos confirmados: el admin oscuro con acento neón del SaaS por defecto, las tarjetas flotantes con sombras suaves, los gradientes, el glass y cualquier animación que retrase al operador.

La profundidad la llevan los filetes hairline; la selección es inversión (tinta sobre papel, no color); el único relleno cromático permanente de una pantalla es la acción primaria. El motion tiene un solo momento autoral — el pulso de fila cuando un ticket cambia de estado o cruza un umbral SLA — y el resto son transiciones de color de 150ms.

**Key Characteristics:**
- Fondo claro papel (#fbfbf9) con filetes 1px como única estructura de profundidad
- Color = estado (verde/ámbar/rojo) + un matiz por práctica ITIL, solo en badges
- Jerarquía por peso y caja, nunca por inflar tamaños
- Voz mono (IBM Plex Mono) exclusiva para dato medible: IDs, cuentas regresivas, marcas
- Teclado primero: ⌘K, j/k, ⏎, acordes g d / g i / g r / g p / g c / g m / g k / g e, tecla /
- Superficies del navegador tematizadas: selección invertida, caret rojo, scrollbar fino
- Series de tiempo: barras tinta plena vs tinta al 35% sobre base hairline, escala y procedencia en mono

## Colors

Un solo color de acción y una tríada de estado, todo lo demás es tinta sobre papel.

### Primary
- **Rojo Cartel** (#da291c): la única acción primaria ("Nuevo incidente"), el estado P1 y el incumplimiento SLA. Su rareza es el punto: si algo es rojo, exige acción.
- **Rojo Cartel Profundo** (#b22116): hover del botón primario.

### Secondary
- **Cobalto de Requerimiento** (#1d4ed8): exclusivamente el matiz de la práctica "Requerimiento" en badges de práctica (punto cuadrado). Nunca como color de enlace o decoración.

### Tertiary
- **Verde de Cumplimiento** (#0e8345): estado resuelto, SLA en tiempo, deltas positivos.
- **Ámbar de Riesgo** (#b45309): SLA con ≤20% restante, pendiente de usuario, matiz de la práctica "Problema".
- **Violeta de Cambio** (#7c3aed): matiz de la práctica "Cambio", badges y gráficas.

### Neutral
- **Papel Editorial** (#fbfbf9): el fondo de toda la superficie.
- **Papel Elevado** (#ffffff): inputs, cabeceras de tabla, chips con borde.
- **Tinta de Informe** (#15181e): texto principal, relleno de selección invertida, botón secundario.
- **Tinta Secundaria** (#3d434d): texto de apoyo.
- **Tinta Tenue** (#666d78): etiquetas y metadatos (≥4.5:1 sobre papel).
- **Filete** (#dcded9) / **Filete Fuerte** (#c3c6bf): reglas hairline de 1px que estructuran toda la profundidad.

### Named Rules
**La Regla del Color de Estado.** El color cromático solo existe para significar: estado del ticket, nivel SLA, matiz de práctica o acción primaria. Si un elemento es rojo, ámbar o verde sin significado de estado, es un defecto.
**La Regla de la Tinta Primero.** Los enlaces son tinta con subrayado (offset 3px, grosor 1px), no color. La selección es inversión tinta-sobre-papel, nunca un tinte.

## Typography

**Display Font:** Inter Tight Variable (self-hosted, con Inter Variable como fallback)
**Body Font:** Inter Variable (self-hosted)
**Label/Mono Font:** IBM Plex Mono (self-hosted) — exclusiva de dato

**Carácter:** una grotesca neutra de origen suizo para toda la interfaz, con su variante Tight como voz display; el carácter del sistema está en el peso, la caja y el tracking, no en la excentricidad tipográfica. IBM Plex Mono aporta la herencia del IT corporativo y solo habla cuando hay dato medible.

### Hierarchy
- **Display** (600, 22–28px, 1.15, tracking −0.02em): títulos de vista (`Estado del servicio`, `Incidentes`, asunto del ticket).
- **Headline** (600, 15px, 1.4): encabezados de sección dentro de la página (`SLA crítico`).
- **Title** (600, 13px): etiquetas legibles en componentes densos.
- **Body** (400/500, 13–14px, 1.6): descripciones y contenido; medida de lectura ≤68ch.
- **Label** (500, 11px, +0.08em, versalitas): etiquetas de dato — columnas, KPIs, propiedades. Es etiqueta de dato dentro de componentes, jamás eyebrow decorativo sobre un título.
- **Dato** (mono 500, 11–12.5px, `tnum`): IDs, cuentas regresivas, conteos, deltas, atajos ⌘K.

### Named Rules
**La Regla del Peso sobre el Tamaño.** En tablas densas, el rango se expresa con peso (P1 > P2 en relleno; P3/P4 en contorno) y caja, nunca inflando el tamaño del texto.
**La Regla de la Voz Mono.** IBM Plex Mono solo para lo medible: IDs, temporizadores, conteos, deltas, kbd. Una palabra o frase en mono que no sea dato es un desvío de voz.

## Layout

Barra superior fija (h-14, filete inferior) con marca, búsqueda ⌘K y la acción primaria junto a ella. Rail izquierdo de prácticas (w-56) con selección por inversión y conteos abiertos en mono. Contenido en contenedor ≤1200px con banda KPI de 4 columnas bajo filetes (`border-y` + `divide-x`) y retícula de 12 columnas para módulos (5/4/3). Tabla densa de filas de 44px con filetes 1px y cabecera sticky en invertido tenue.

Responsive: el rail y el buscador extendido requieren ≥md (en móvil la paleta se abre con un botón de lupa); el wordmark colapsa a la marca bajo sm; la tabla oculta Práctica y Actualizado bajo lg y Asignado bajo xl. Breakpoints: sm 640 / md 768 / lg 1024 / xl 1280. Ritmo de espaciado: 8/12/16/20/28px; más aire sobre un encabezado que debajo.

## Elevation & Depth

Plano por defecto. La profundidad la construyen los filetes hairline de 1px — tablas, módulos, propiedades, divisores — y la inversión como jerarquía máxima. La sombra del sistema vive solo en las superficies que genuinamente flotan: el diálogo de la paleta de comandos y el panel de notificaciones.

### Shadow Vocabulary
- **Flotante** (`box-shadow: 0 24px 48px -12px rgba(21,24,30,0.22), 0 2px 8px rgba(21,24,30,0.08)`): superficies que genuinamente flotan — hoy el diálogo de la paleta ⌘K y el panel de notificaciones; offset real + desenfoque suave.

### Named Rules
**La Regla del Filete.** Ningún otro componente lleva sombra. Si una superficie nueva parece necesitar profundidad, primero se prueba con un filete; la sombra está reservada a lo que genuinamente flota (paleta ⌘K, panel de notificaciones).

## Shapes

Radios mínimos y precisos: controles a 3px, diálogo de paleta y tile del logo a 4px, extremos del medidor SLA a 1px. La marca del logo es un tile cuadrado con radio del 15.6% (10/64) y muesca de troquel semicircular en el borde derecho. Los puntos de estado y práctica son cuadrados de 6px (radio 1px) o círculos de 6px según el componente. Nada de píldoras; nada de círculos completos en botones o chips.

## Components

Carácter general: **preciso y contenido** — controles quietos, filetes que estructuran, el color llega con significado.

### Buttons
- **Shape:** radio 3px; alto 36px (sm: 32px); padding 0 16px; texto 14px/500.
- **Primary:** Rojo Cartel con texto papel; hover a Rojo Cartel Profundo. Es el único relleno cromático permanente de la pantalla.
- **Secondary:** tinta rellena, texto papel (p. ej. "Tomar").
- **Outline:** papel elevado, borde 1px filete-fuerte, tinta; hover a borde tinta.
- **Ghost:** sin borde, tinta secundaria; hover a tinta con fondo tinta al 5%.
- **Focus:** anillo 2px de tinta con offset 2px en todo foco visible; transición de color 150ms.

### Chips
- **Prioridad:** P1 relleno Rojo Cartel (texto papel); P2 relleno tinta; P3/P4 contorno filete-fuerte. Mono 12px, tabular.
- **Práctica:** punto cuadrado 6px en el matiz de la práctica + nombre en 12px; nunca fondo de color.
- **Estado:** punto 6px (nuevo tinta, en progreso tinta 50%, pendiente ámbar, resuelto verde, cerrado filete) + nombre.
- **Filtro:** botón 28px con borde 1px; seleccionado por inversión (fondo tinta, texto papel).

### Cards / Containers
- **Módulo:** borde 1px filete, radio 3px, fondo papel; cabecera con etiqueta versalitas + filete inferior; cuerpo con padding 16px. Las filas internas se separan con filetes, no con sombras.

### Inputs / Fields
- **Style:** fondo papel elevado, borde 1px filete, radio 3px, alto 36px; caret Rojo Cartel.
- **Focus:** borde tinta; el error devalida con borde Rojo Cartel y mensaje en línea.
- **Disabled:** opacidad 40%.

### Navigation
- **Rail:** ítems 13px con iconos de un solo trazo (1.75); activo por inversión (fondo tinta, texto papel); conteos abiertos en mono a la derecha. Los módulos ITIL completos (problemas, cambios, CMDB, base de conocimiento) y los reportes viven en el rail con conteos en mono; lo aún no aplicado se muestra atenuado y etiquetado.
- **Portal:** la superficie de autoservicio (/portal) hereda el mundo sin rail: navegación horizontal en topbar, contenedor ≤980px, catálogo como listas fileteadas por categoría, formularios en lenguaje humano (sin vocabulario ITIL visible) y consola de agentes con su terminología completa.
- **Estados de acceso:** la puerta de login y la negación de consola para cuentas de portal comparten la gramática de Acceso — marca centrada, tarjeta hairline sobre papel, un título display 20px, una acción rellena y ninguna excusa decorativa.
- **Breadcrumbs:** enlaces en tinta con subrayado, separados por "/".

### El Medidor SLA (firma)
El componente más ruidoso de la fila: pista de 3px (56–64px) en filete con relleno proporcional al tiempo transcurrido — verde en tiempo, ámbar al 80%, Rojo Cartel al vencer — y cuenta regresiva en IBM Plex Mono tabular al lado. En detalle, variante grande de 6px con objetivo explícito. Es el corazón del contrato: el estado del SLA nunca está a más de un vistazo.

### Las Series de Tiempo (firma)
El lenguaje de las gráficas temporales (tendencias, volumen): barras planas pareadas o simples sobre una línea base hairline, sin ejes ni cuadrícula. Dos valores por día se distinguen por **tinta plena vs tinta al 35%** — la misma tinta, dos pesos; cero colores nuevos. La escala numérica se declara en mono tabular junto a la procedencia del dato («pico N · daily_metrics del servidor» o «derivado de la cola local»). Los días de descanso en series semanales se marcan con tinta al 35%, convención heredada de «Volumen 7 días».

### Command Palette
Diálogo centrado (580px) con la sombra flotante del sistema; entrada de 52px con filete inferior; ítems 13.5px con seleccionado marcado por barra interior de 2px tinta + fondo papel; encabezados de grupo en label versalitas; pie con atajos en mono.

## Do's and Don'ts

### Do:
- **Do** usar el color cromático solo con significado de estado, práctica o acción primaria.
- **Do** jerarquizar tablas densas con peso tipográfico y relleno, nunca con tamaños inflados.
- **Do** mantener la voz mono para dato medible (IDs, timers, conteos, deltas, kbd).
- **Do** tematizar las superficies del navegador (selección invertida, caret rojo, scrollbar fino, focus 2px tinta).
- **Do** conservar un único momento de motion autoral por interacción (pulso de fila 220ms, cubic-bezier(0.16, 1, 0.3, 1)) y transiciones de color de 150ms en todo lo demás.
- **Do** etiquetar todo dato de demostración como sintético.
- **Do** mantener honesta la bifurcación live/demo: cuando el gateway responde, TODO el contenido viene de los microservicios en vivo y el chip declara «Datos en vivo» (datos sembrados de demostración, declarados); en modo demo el chip dice «Datos demo».

### Don't:
- **Don't** uses gradientes, glass, blur decorativo, glow o halos de color.
- **Don't** pongas etiquetas eyebrow/kicker sobre los títulos; el encabezado se sostiene solo.
- **Don't** apliques sombras sin offset real + desenfoque suave fuera de lo que genuinamente flota (paleta ⌘K, panel de notificaciones).
- **Don't** uses bordes de color laterales mayores a 1px en tarjetas, listas o avisos.
- **Don't** iconos Unicode ni emoji: los iconos se dibujan (lucide, trazo 1.75) o son SVG autorado.
- **Don't** spinners de carga: la siguiente vista llega precargada; nada bloquea al operador.
- **Don't** inventes modo oscuro en v1: el mundo ES papel; su traducción futura es una decisión explícita, no un valor por defecto.
