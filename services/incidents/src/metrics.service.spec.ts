import { MetricsService } from "./metrics.service";
import { TicketEntity } from "./ticket.entity";

function ticket(
  code: string,
  createdAtOffsetH: number,
  resolvedOffsetH: number | null,
  priority: "P1" | "P2" | "P3" | "P4" = "P3",
): TicketEntity {
  const base = Date.UTC(2026, 9, 7, 0, 0, 0);
  const created = new Date(base + createdAtOffsetH * 3_600_000);
  const resolved =
    resolvedOffsetH === null ? null : new Date(base + resolvedOffsetH * 3_600_000);
  return {
    id: 1,
    code,
    practice: "incidente",
    subject: "x",
    description: "x",
    requester: "x",
    dept: "x",
    priority,
    status: resolved ? "resuelto" : "nuevo",
    assignee: null,
    createdAt: created,
    updatedAt: created,
    resolvedAt: resolved,
    attachments: [],
  } as TicketEntity;
}

function makeService(rows: TicketEntity[]) {
  const upserts: Array<Record<string, unknown>> = [];
  const ticketsRepo = { find: async () => rows };
  const metricsRepo = {
    upsert: async (entity: Record<string, unknown>) => {
      upserts.push(entity);
      return entity;
    },
    find: async () => [],
  };
  return { service: new MetricsService(ticketsRepo as never, metricsRepo as never), upserts };
}

describe("MetricsService.recompute", () => {
  it("cuenta creados, resueltos, MTTR y cumplimiento por día (UTC)", async () => {
    const rows = [
      // creado día 7 (2 h), resuelto día 7 (5 h) → MTTR 3 h = 180 min, dentro de P3 (24 h)
      ticket("INC-1", 2, 5),
      // creado día 6 (24 h antes de la base), resuelto día 7 (6 h) → 30 h → fuera de SLA P3
      ticket("INC-2", -24, 6),
      // abierto, nunca resuelto
      ticket("INC-3", 3, null),
      // P1 resuelto en 2 h (dentro del objetivo de 4 h) el día 7
      ticket("INC-4", 1, 3, "P1"),
    ];
    const { service, upserts } = makeService(rows);
    // Fijamos "hoy" en el día 7 de octubre de 2026 a medianoche UTC reemplazando Date.now
    const realNow = Date.now;
    Date.now = () => Date.UTC(2026, 9, 7, 12, 0, 0);
    try {
      await service.recompute(1);
    } finally {
      Date.now = realNow;
    }
    const day7 = upserts.find((u) => u.day === "2026-10-07");
    expect(day7).toBeDefined();
    expect(day7!.created).toBe(3); // INC-1, INC-3, INC-4
    expect(day7!.resolved).toBe(3); // INC-1, INC-2, INC-4
    // MTTR: INC-1 3h + INC-2 30h + INC-4 2h = 35h / 3 ≈ 700 min
    expect(day7!.mttrMinutes).toBe(700);
    expect(day7!.withinSla).toBe(2); // INC-1 y INC-4 dentro; INC-2 fuera
  });

  it("día sin resueltos deja MTTR en 0", async () => {
    const { service, upserts } = makeService([ticket("INC-9", 1, null)]);
    const realNow = Date.now;
    Date.now = () => Date.UTC(2026, 9, 7, 12, 0, 0);
    try {
      await service.recompute(1);
    } finally {
      Date.now = realNow;
    }
    const day7 = upserts.find((u) => u.day === "2026-10-07");
    expect(day7!.resolved).toBe(0);
    expect(day7!.mttrMinutes).toBe(0);
  });
});
