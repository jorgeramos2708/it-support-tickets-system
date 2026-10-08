---
version: 1
slug: "frontend-portal"
primary_target: "frontend-portal"
related_targets: []
---

# Surface brief — Portal de autoservicio TickITFlow

## Alcance y modo de visitante
Portal de autoservicio para usuarios finales (M. Aguilar · Finanzas en demo): catálogo de servicios, reporte de incidentes, seguimiento de mis tickets y ayuda (KB). Modo: **Operate** con registro cercano al de **Read** en artículos y detalle de ticket.

## Audiencia, trabajo, acción, prueba
Empleados no técnicos que necesitan algo de TI o algo se rompió. Tarea: pedir del catálogo o reportar un problema en ≤2 minutos sin vocabulario ITIL (la palabra "incidente" no aparece; el sistema lo registra como tal). Éxito: solicitud con número visible, prioridad transparente y objetivo de atención en lenguaje humano. Prueba: los tickets creados en el portal aparecen en la consola de agentes con el solicitante correcto.

## Mundo visual
Hereda el mundo establecido (DESIGN.md de la raíz, semilla 431a9fb1): papel, tinta, filetes, Rojo Cartel como única acción rellena ("Reportar problema"), selección por inversión, mono solo para dato. Diferencias de superficie: sin rail (navegación horizontal en topbar), contenedor ≤980px, catálogo como lista fileteada por categorías (no tarjetas icon+heading+text), formularios con pregunta humana "¿A quién afecta?" en lugar de matriz ITIL visible, timeline de avances con copia en segunda persona.

## Momento memorable
El banner de confirmación con el número de ticket en mono y la promesa de aviso por correo — el "tu solicitud existe" instantáneo.

## Estados y límites
Dentro: catálogo (8 ítems, 3 categorías), solicitud de catálogo, reporte de incidente, mis tickets (historial del usuario demo), detalle de ticket con comentario público, ayuda KB reutilizada con basePath propio. Fuera: login real (fase de integración), adjuntos, encuestas. Datos sintéticos etiquetados ("Datos demo" + footer).

## Decisiones abiertas
Registro real de usuarios del portal contra auth-service; notificaciones por correo (notification-service, fase posterior); encuesta de satisfacción al cerrar.
