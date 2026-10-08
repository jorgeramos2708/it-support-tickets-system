import { describe, expect, it } from "vitest";
import {
  PRIORITY_MATRIX,
  SLA_TARGET_MIN,
  fmtDuration,
  fmtRemaining,
  priorityOf,
  slaOf,
} from "./sla";
import type { Impact, Priority, Ticket, Urgency } from "./types";

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  const now = Date.now();
  return {
    id: "INC-2401",
    practice: "incidente",
    subject: "x",
    description: "x",
    requester: "x",
    dept: "x",
    priority: "P3",
    status: "nuevo",
    assignee: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    events: [],
    attachments: [],
    ...overrides,
  };
}

describe("prioridadOf — matriz ITIL impacto × urgencia", () => {
  const casos: Array<[Impact, Urgency, Priority]> = [
    ["alto", "alta", "P1"],
    ["alto", "media", "P2"],
    ["alto", "baja", "P3"],
    ["medio", "alta", "P2"],
    ["medio", "media", "P3"],
    ["medio", "baja", "P4"],
    ["bajo", "alta", "P3"],
    ["bajo", "media", "P4"],
    ["bajo", "baja", "P4"],
  ];
  it.each(casos)("impacto %s × urgencia %s → %s", (impact: Impact, urgency: Urgency, expected: Priority) => {
    expect(priorityOf(impact, urgency)).toBe(expected);
  });

  it("la matriz declarada coincide con priorityOf en las 9 celdas", () => {
    for (const [impact, row] of Object.entries(PRIORITY_MATRIX)) {
      for (const [urgency, priority] of Object.entries(row)) {
        expect(priorityOf(impact as never, urgency as never)).toBe(priority);
      }
    }
  });
});

describe("slaOf — niveles de riesgo", () => {
  it("en tiempo → ok", () => {
    const t = ticket({ createdAt: Date.now() - 60 * 60_000 }); // 1 h de 24
    expect(slaOf(t, Date.now()).level).toBe("ok");
  });

  it("al 80% del objetivo → warn", () => {
    const target = SLA_TARGET_MIN.P3 * 60_000;
    const t = ticket({ createdAt: Date.now() - target * 0.85 });
    expect(slaOf(t, Date.now()).level).toBe("warn");
  });

  it("objetivo vencido → breach", () => {
    const target = SLA_TARGET_MIN.P3 * 60_000;
    const t = ticket({ createdAt: Date.now() - target * 1.2 });
    expect(slaOf(t, Date.now()).level).toBe("breach");
  });

  it("resuelto dentro del objetivo queda ok aunque el reloj siga corriendo", () => {
    const t = ticket({
      status: "resuelto",
      createdAt: Date.now() - 2 * 60 * 60_000,
      resolvedAt: Date.now() - 3 * 60 * 60_000,
    });
    expect(slaOf(t, Date.now()).level).toBe("ok");
  });
});

describe("formatos de tiempo", () => {
  it("fmtDuration", () => {
    expect(fmtDuration(45)).toBe("45m");
    expect(fmtDuration(195)).toBe("3h 15m");
    expect(fmtDuration(120)).toBe("2h");
    expect(fmtDuration(1500)).toBe("25h");
    expect(fmtDuration(2900)).toBe("2d");
  });

  it("fmtRemaining marca vencidos", () => {
    expect(fmtRemaining(120)).toBe("2h");
    expect(fmtRemaining(-18)).toBe("Vencido 18m");
  });
});
