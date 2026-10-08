import type { Ticket } from "./types";

export interface DaySeries {
  day: string;
  created: number;
  resolved: number;
}

/**
 * Serie diaria (creados vs resueltos) derivada de los tickets.
 * Espeja el cálculo persistido en daily_metrics del incidents-service:
 * buckets por día UTC de createdAt y resolvedAt.
 */
export function dailySeries(tickets: Ticket[], days: number): DaySeries[] {
  const today = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate(),
  );
  const buckets: DaySeries[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = today - i * 86_400_000;
    buckets.push({
      day: new Date(start).toISOString().slice(0, 10),
      created: 0,
      resolved: 0,
    });
  }
  const keyOf = (ms: number) =>
    buckets.find((b) => {
      const start = Date.parse(`${b.day}T00:00:00Z`);
      return ms >= start && ms < start + 86_400_000;
    });
  for (const t of tickets) {
    const c = keyOf(t.createdAt);
    if (c) c.created += 1;
    if (t.resolvedAt !== null) {
      const r = keyOf(t.resolvedAt);
      if (r) r.resolved += 1;
    }
  }
  return buckets;
}
