---
version: 2
slug: "frontend-portal"
primary_target: "frontend-portal"
related_targets: []
---

# Surface brief - Portal de autoservicio TickITFlow

## Alcance y modo de visitante
Portal de autoservicio para usuarios finales: catálogo de servicios, reporte de incidentes, seguimiento de mis tickets y ayuda (KB). Modo: **Operate** con registro cercano al de **Read** en artículos y detalle de ticket.

## Audiencia, trabajo, acción, prueba
Empleados no técnicos que necesitan algo de TI o algo se rompió. Tarea: pedir del catálogo o reportar un problema en ≤2 minutos sin vocabulario ITIL (la palabra "incidente" no aparece; el sistema lo registra como tal). Éxito: solicitud con número visible, prioridad transparente y objetivo de atención en lenguaje humano. Prueba: los tickets creados en el portal aparecen en la consola de agentes con el solicitante correcto.

## Direction contract

THESIS: El portal hereda la sala de guardia sin la maquinaria del agente — mismo mundo ámbar oscuro/claro, sin rail, sin terminología ITIL. Rechaza el catálogo de tarjetas con iconos: listas por categoría con filetes.

OWN-WORLD: Los tokens del mundo nuevo (bg/panel/borde/ámbar/Nunito/prioridades semáforo), dual tema día/noche; contenedor ≤980px, navegación horizontal en topbar, catálogo como lista por categorías, formularios con pregunta humana ("¿A quién afecta?"), timeline en segunda persona.

STORY: El empleado pide o reporta sin fricción y el banner de confirmación con el número de ticket y la promesa de aviso por correo le dice "tu solicitud existe" al instante.

FIRST VIEWPORT: Topbar horizontal con marca y tema; hero breve del catálogo por categorías; CTA "Reportar problema" en ámbar; estados vacíos y de carga con skeleton shimmer.

FORM: Dirección fijada por el usuario (rebrand global del mundo nuevo); code-led.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Decisiones abiertas
Registro real de usuarios del portal contra auth-service; notificaciones por correo; encuesta de satisfacción al cerrar.
