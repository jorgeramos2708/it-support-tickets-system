import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { TicketEntity } from "./ticket.entity";

jest.mock("./bus", () => ({ publishEvent: jest.fn() }));

function makeTicket(overrides: Partial<TicketEntity> = {}): TicketEntity {
  const now = new Date();
  return {
    id: 1,
    code: "INC-2401",
    practice: "incidente",
    subject: "Prueba",
    description: "desc",
    requester: "M. Aguilar",
    dept: "Finanzas",
    priority: "P3",
    status: "nuevo",
    assignee: null,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    attachments: [],
    ...overrides,
  } as TicketEntity;
}

function makeService(ticket: TicketEntity | null) {
  const ticketsRepo = {
    findOne: async () => ticket,
    save: async (t: TicketEntity) => t,
  };
  const savedEvents: Array<Record<string, unknown>> = [];
  const eventsRepo = {
    save: async (e: Record<string, unknown>) => {
      savedEvents.push(e);
      return e;
    },
    find: async () => savedEvents,
  };
  return new TicketsService(ticketsRepo as never, eventsRepo as never);
}

describe("TicketsService — transiciones", () => {
  it("permite nuevo → en_progreso", async () => {
    const service = makeService(makeTicket());
    const result = await service.patch(
      "INC-2401",
      { status: "en_progreso" },
      "Jorge Ramos",
      "agente",
    );
    expect(result.status).toBe("en_progreso");
  });

  it("permite en_progreso → resuelto y fija resolvedAt", async () => {
    const service = makeService(makeTicket({ status: "en_progreso" }));
    const result = await service.patch(
      "INC-2401",
      { status: "resuelto" },
      "Jorge Ramos",
      "agente",
    );
    expect(result.status).toBe("resuelto");
    expect(result.resolvedAt).not.toBeNull();
  });

  it("rechaza saltos de estado (nuevo → resuelto)", async () => {
    const service = makeService(makeTicket());
    await expect(
      service.patch("INC-2401", { status: "resuelto" }, "Jorge", "agente"),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe("TicketsService — separación de roles", () => {
  it("usuario puede agregar nota en SU ticket", async () => {
    const service = makeService(makeTicket({ requester: "M. Aguilar" }));
    const result = await service.patch(
      "INC-2401",
      { note: "sigue fallando" },
      "M. Aguilar",
      "usuario",
    );
    expect(result.events.some((e) => e.kind === "nota")).toBe(true);
  });

  it("usuario NO puede cambiar estado de su ticket", async () => {
    const service = makeService(makeTicket({ requester: "M. Aguilar" }));
    await expect(
      service.patch("INC-2401", { status: "resuelto" }, "M. Aguilar", "usuario"),
    ).rejects.toThrow(ForbiddenException);
  });

  it("usuario NO puede escribir en ticket ajeno", async () => {
    const service = makeService(makeTicket({ requester: "Otra Persona" }));
    await expect(
      service.patch("INC-2401", { note: "hola" }, "M. Aguilar", "usuario"),
    ).rejects.toThrow(ForbiddenException);
  });

  it("ticket inexistente → NotFoundException", async () => {
    const service = makeService(null);
    await expect(
      service.patch("INC-9999", { note: "x" }, "M. Aguilar", "usuario"),
    ).rejects.toThrow(NotFoundException);
  });
});
