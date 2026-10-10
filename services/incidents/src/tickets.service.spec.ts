import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
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

/**
 * Repositorio con soporte de la transacción de create():
 * manager.transaction(cb) + getRepository con create/save/update/findOne.
 * Los fallos del save propagan (rollback simulado: nada se persiste).
 */
function makeTransactionalService(opts: { id?: number; failOnSave?: boolean } = {}) {
  let nextId = opts.id ?? 7;
  const persisted: TicketEntity[] = [];
  const row = (partial: Partial<TicketEntity>) =>
    ({ ...makeTicket(), attachments: [], ...partial }) as TicketEntity;

  const emRepo = {
    create: (data: Partial<TicketEntity>) => row(data),
    save: async (entity: TicketEntity) => {
      if (opts.failOnSave) throw new Error("simulated db failure");
      entity.id = nextId++;
      persisted.push(entity);
      return entity;
    },
    update: async (id: number, patch: Partial<TicketEntity>) => {
      const found = persisted.find((t) => t.id === id);
      if (found) Object.assign(found, patch);
    },
    findOne: async ({ where }: { where: { id: number } }) =>
      persisted.find((t) => t.id === where.id) ?? null,
  };
  const ticketsRepo = {
    target: TicketEntity,
    manager: {
      transaction: async (cb: (em: unknown) => Promise<unknown>) =>
        cb({ getRepository: () => emRepo }),
    },
  };
  const savedEvents: Array<Record<string, unknown>> = [];
  const eventsRepo = {
    save: async (e: Record<string, unknown>) => {
      savedEvents.push(e);
      return e;
    },
    find: async () => savedEvents,
  };
  const service = new TicketsService(
    ticketsRepo as never,
    eventsRepo as never,
  );
  return { service, persisted, savedEvents };
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

describe("TicketsService — create() transaccional (hallazgo C9)", () => {
  const baseInput = {
    practice: "incidente" as const,
    subject: "VPN caída",
    description: "sin acceso",
    requester: "M. Aguilar",
    dept: "Finanzas",
    priority: "P2" as const,
  };

  it("genera código INC-(2400+id) y nunca expone el TMP", async () => {
    const { service } = makeTransactionalService({ id: 7 });
    const dto = await service.create(baseInput, "Jorge Ramos", "agente");
    expect(dto.code).toBe("INC-2407");
    expect(dto.code).not.toMatch(/TMP/);
  });

  it("requerimiento usa prefijo REQ", async () => {
    const { service } = makeTransactionalService({ id: 3 });
    const dto = await service.create(
      { ...baseInput, practice: "requerimiento" },
      "Jorge Ramos",
      "agente",
    );
    expect(dto.code).toBe("REQ-2403");
  });

  it("description opcional (CreateTicketDto)", async () => {
    const { service } = makeTransactionalService();
    const dto = await service.create(
      { ...baseInput, description: undefined },
      "Jorge Ramos",
      "agente",
    );
    expect(dto.description).toBe("");
  });

  it("subject vacío → BadRequest", async () => {
    const { service } = makeTransactionalService();
    await expect(
      service.create({ ...baseInput, subject: "  " }, "Jorge", "agente"),
    ).rejects.toThrow(BadRequestException);
  });

  it("fallo del save → error propagado, sin fila persistida (rollback)", async () => {
    const { service, persisted, savedEvents } = makeTransactionalService({
      failOnSave: true,
    });
    await expect(
      service.create(baseInput, "Jorge", "agente"),
    ).rejects.toThrow("simulated db failure");
    expect(persisted).toHaveLength(0);
    expect(savedEvents).toHaveLength(0);
  });

  it("evento creado firmado por el requester (no por el actor admin)", async () => {
    const { service, savedEvents } = makeTransactionalService();
    await service.create(baseInput, "Jorge Ramos", "admin");
    const creado = savedEvents.find((e) => e.kind === "creado");
    expect(creado?.actor).toBe("M. Aguilar");
  });
});
