import { ForbiddenException } from "@nestjs/common";
import { ChangesController } from "./changes.controller";
import { ChangeEntity, type ChangeApproval } from "./change.entity";

jest.mock("./bus", () => ({ publishEvent: jest.fn() }));

function makeChange(overrides: Partial<ChangeEntity> = {}): ChangeEntity {
  const now = new Date();
  return {
    id: 1,
    code: "CHG-4001",
    title: "Cambio",
    type: "normal",
    status: "en_revision",
    risk: "medio",
    ventana: "Viernes 22:00",
    description: "d",
    solicita: "Jorge",
    implementador: null,
    ciIds: [],
    approvals: [
      { role: "Gestor de cambios", state: "pendiente" },
      { role: "CAB — Líder de infraestructura", state: "pendiente" },
      { role: "Implementación", state: "pendiente" },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as ChangeEntity;
}

function makeController(changes: ChangeEntity[]) {
  const repo = {
    findOne: async () => changes[0] ?? null,
    find: async () => changes,
    save: async (c: ChangeEntity) => c,
    create: (partial: Partial<ChangeEntity>) => ({ ...makeChange(), ...partial } as ChangeEntity),
  };
  return { controller: new ChangesController(repo as never) };
}

function reqWith(role: string) {
  return { user: { name: "Jorge Ramos", role } } as never;
}

describe("ChangesController — flujos CAB por tipo", () => {
  it("normal nace en revisión con tres aprobaciones pendientes", async () => {
    const { controller } = makeController([]);
    const result = await controller.create(
      {
        title: "Firmware del switch",
        type: "normal",
        risk: "alto",
        ventana: "V 22:00",
        description: "d",
        solicita: "Gonzalo",
      },
      reqWith("agente"),
    );
    expect(result.status).toBe("en_revision");
    expect(result.approvals).toHaveLength(3);
    expect(result.approvals.every((a: ChangeApproval) => a.state === "pendiente")).toBe(true);
  });

  it("estándar nace pre-aprobado", async () => {
    const { controller } = makeController([]);
    const result = await controller.create(
      {
        title: "Reemplazo estándar",
        type: "estandar",
        risk: "bajo",
        ventana: "Inmediata",
        description: "d",
        solicita: "Ana",
      },
      reqWith("agente"),
    );
    expect(result.status).toBe("aprobado");
    expect(result.approvals.every((a: ChangeApproval) => a.state === "aprobado")).toBe(true);
  });

  it("emergencia va directo al ECAB", async () => {
    const { controller } = makeController([]);
    const result = await controller.create(
      {
        title: "Parche crítico",
        type: "emergencia",
        risk: "alto",
        ventana: "Hoy 14:00",
        description: "d",
        solicita: "Elena",
      },
      reqWith("agente"),
    );
    expect(result.status).toBe("en_revision");
    expect(result.approvals.map((a: ChangeApproval) => a.role)).toContain(
      "ECAB — Dirección de TI",
    );
  });

  it("usuario NO crea cambios (403)", async () => {
    const { controller } = makeController([]);
    await expect(
      controller.create(
        { title: "x", type: "normal", risk: "bajo", ventana: "x", description: "d", solicita: "x" },
        reqWith("usuario"),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe("ChangesController — decisiones del CAB", () => {
  it("rechazo de un rol deriva el cambio a rechazado", async () => {
    const { controller } = makeController([
      makeChange({
        approvals: [
          { role: "Gestor de cambios", state: "aprobado" },
          { role: "CAB — Líder de infraestructura", state: "pendiente" },
          { role: "Implementación", state: "pendiente" },
        ],
      }),
    ]);
    const result = await controller.patch(
      "CHG-4001",
      { decision: { role: "CAB — Líder de infraestructura", approve: false } },
      reqWith("agente"),
    );
    expect(result.status).toBe("rechazado");
  });

  it("aprobación completa deriva a aprobado", async () => {
    const { controller } = makeController([
      makeChange({
        approvals: [
          { role: "Gestor de cambios", state: "aprobado" },
          { role: "CAB — Líder de infraestructura", state: "aprobado" },
          { role: "Implementación", state: "pendiente" },
        ],
      }),
    ]);
    const result = await controller.patch(
      "CHG-4001",
      { decision: { role: "Implementación", approve: true } },
      reqWith("agente"),
    );
    expect(result.status).toBe("aprobado");
  });

  it("usuario NO decide el CAB (403)", async () => {
    const { controller } = makeController([makeChange()]);
    await expect(
      controller.patch("CHG-4001", { decision: { role: "GC", approve: true } }, reqWith("usuario")),
    ).rejects.toThrow(ForbiddenException);
  });
});
