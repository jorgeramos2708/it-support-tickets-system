import { TicketsController } from "./tickets.controller";
import type { TicketDto } from "./tickets.service";

const baseDto: TicketDto = {
  id: 1,
  code: "INC-2401",
  practice: "incidente",
  subject: "x",
  description: "x",
  requester: "x",
  dept: "x",
  priority: "P3",
  status: "nuevo",
  assignee: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  resolvedAt: null,
  attachments: [],
  events: [],
};

function makeController() {
  const create = jest.fn(
    async (body: unknown, actor: string, role: string) =>
      ({ ...baseDto, requester: actor, status: "nuevo" }) as TicketDto,
  );
  const patch = jest.fn(
    async (code: string, body: unknown, actor: string, role: string) =>
      ({ ...baseDto, code }) as TicketDto,
  );
  const byCode = jest.fn(
    async (code: string) => ({ ...baseDto, code }) as TicketDto,
  );
  const controller = new TicketsController({ create, patch, byCode } as never);
  return { controller, create, patch, byCode };
}

function reqWith(name?: string, role?: string) {
  return { user: name ? { name, role } : undefined } as never;
}

describe("TicketsController — delegación con rol y actor del token", () => {
  it("create extrae actor y rol del JWT", async () => {
    const { controller, create } = makeController();
    await controller.create(
      {
        practice: "incidente",
        subject: "VPN caída",
        description: "d",
        requester: "Otro Nombre",
        dept: "Finanzas",
        priority: "P3",
      },
      reqWith("M. Aguilar", "usuario"),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "VPN caída" }),
      "M. Aguilar",
      "usuario",
    );
  });

  it("create sin JWT delega como Sistema/agente", async () => {
    const { controller, create } = makeController();
    await controller.create(
      {
        practice: "requerimiento",
        subject: "Licencia",
        description: "d",
        requester: "X",
        dept: "X",
        priority: "P4",
      },
      reqWith(),
    );
    expect(create).toHaveBeenCalledWith(
      expect.anything(),
      "Sistema",
      "agente",
    );
  });

  it("patch pasa código, cuerpo, actor y rol del token", async () => {
    const { controller, patch } = makeController();
    await controller.patch(
      "INC-2401",
      { note: "revisado" },
      reqWith("Jorge Ramos", "agente"),
    );
    expect(patch).toHaveBeenCalledWith(
      "INC-2401",
      { note: "revisado" },
      "Jorge Ramos",
      "agente",
    );
  });

  it("byCode: usuario NO puede leer ticket ajeno (403)", async () => {
    const { controller, byCode } = makeController();
    byCode.mockResolvedValue({ ...baseDto, requester: "Otra Persona" });
    await expect(
      controller.byCode("INC-2401", reqWith("M. Aguilar", "usuario")),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("byCode: usuario SÍ puede leer su propio ticket", async () => {
    const { controller, byCode } = makeController();
    byCode.mockResolvedValue({ ...baseDto, requester: "M. Aguilar" });
    const dto = await controller.byCode(
      "INC-2401",
      reqWith("M. Aguilar", "usuario"),
    );
    expect(dto.requester).toBe("M. Aguilar");
  });

  it("byCode: agente puede leer cualquier ticket", async () => {
    const { controller, byCode } = makeController();
    byCode.mockResolvedValue({ ...baseDto, requester: "Otra Persona" });
    const dto = await controller.byCode(
      "INC-2401",
      reqWith("Jorge Ramos", "agente"),
    );
    expect(dto.code).toBe("INC-2401");
  });
});
