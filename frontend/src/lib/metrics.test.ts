import { describe, expect, it } from "vitest";
import { dailySeries } from "./metrics";
import type { Ticket } from "./types";

function ticketAt(
  code: string,
  createdMs: number,
  resolvedMs: number | null = null,
): Ticket {
  return {
    id: code,
    practice: "incidente",
    subject: "x",
    description: "x",
    requester: "x",
    dept: "x",
    priority: "P3",
    status: resolvedMs ? "resuelto" : "nuevo",
    assignee: null,
    createdAt: createdMs,
    updatedAt: createdMs,
    resolvedAt: resolvedMs,
    events: [],
    attachments: [],
  };
}

describe("dailySeries — buckets UTC de 14 días", () => {
  it("cuenta creados y resueltos por día, ignora tickets fuera de rango", () => {
    const hoy = new Date();
    const hoyUTC = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
    const ayer = hoyUTC - 86_400_000;
    const hace30 = hoyUTC - 30 * 86_400_000;

    const series = dailySeries(
      [
        ticketAt("INC-1", hoyUTC + 3_600_000),
        ticketAt("INC-2", hoyUTC + 5 * 3_600_000, hoyUTC + 6 * 3_600_000),
        ticketAt("INC-3", ayer + 2 * 3_600_000, ayer + 4 * 3_600_000),
        ticketAt("INC-4", hace30), // fuera del rango de 14 días
      ],
      14,
    );

    expect(series).toHaveLength(14);
    const hoyEntry = series[series.length - 1];
    const ayerEntry = series[series.length - 2];
    expect(hoyEntry.created).toBe(2);
    expect(hoyEntry.resolved).toBe(1);
    expect(ayerEntry.created).toBe(1);
    expect(ayerEntry.resolved).toBe(1);
    // El total de creados excluye el ticket de hace 30 días (fuera de rango)
    const totalCreados = series.reduce((acc, d) => acc + d.created, 0);
    expect(totalCreados).toBe(3);
  });
});

describe("dailySeries — serie vacía", () => {
  it("devuelve 14 buckets en cero sin tickets", () => {
    const series = dailySeries([], 14);
    expect(series).toHaveLength(14);
    expect(series.every((d) => d.created === 0 && d.resolved === 0)).toBe(true);
  });
});
