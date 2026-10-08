/**
 * Deriva la audiencia de una notificación del payload del evento:
 * los eventos de tickets van al solicitante; el resto, al equipo.
 */
export function deriveAudience(body: Record<string, unknown>): string {
  const requester = body.requester;
  return typeof requester === "string" && requester.trim() ? requester : "agente";
}

/** Resumen legible con respaldo cuando el evento no trae uno. */
export function deriveSummary(
  body: Record<string, unknown>,
  routingKey: string,
): string {
  const summary = body.summary;
  if (typeof summary === "string" && summary.trim()) return summary;
  const code = body.code;
  return `${routingKey} · ${typeof code === "string" ? code : "sin código"}`;
}
