import { ForbiddenException } from "@nestjs/common";
import { ProblemsController } from "./problems.controller";
import { ProblemEntity } from "./problem.entity";

jest.mock("./bus", () => ({ publishEvent: jest.fn() }));

function makeProblem(overrides: Partial<ProblemEntity> = {}): ProblemEntity {
  const now = new Date();
  return {
    id: 1,
    code: "PRB-3001",
    title: "Problema",
    description: "desc",
    status: "nuevo",
    causeRaiz: null,
    workaround: false,
    linkedIncidentCodes: [],
    assignee: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as ProblemEntity;
}

function makeController(problems: ProblemEntity[]) {
  const repo = {
    findOne: async () => problems[0] ?? null,
    find: async () => problems,
    save: async (p: ProblemEntity) => p,
    create: (partial: Partial<ProblemEntity>) => ({ ...makeProblem(), ...partial } as ProblemEntity),
  };
  return {
    controller: new ProblemsController(repo as never),
    repo,
  };
}

function reqWith(role: string) {
  return { user: { name: "Jorge Ramos", role } } as never;
}

describe("ProblemsController — separación de roles", () => {
  it("usuario NO crea problemas (403)", async () => {
    const { controller } = makeController([]);
    await expect(
      controller.create({ title: "x", description: "y" }, reqWith("usuario")),
    ).rejects.toThrow(ForbiddenException);
  });

  it("agente SÍ crea problemas con código consecutivo", async () => {
    const { controller } = makeController([makeProblem({ code: "PRB-3005" })]);
    const result = await controller.create(
      { title: "Nuevo", description: "d", linkedIncidentCodes: ["INC-2401"] },
      reqWith("agente"),
    );
    expect(result.code).toBe("PRB-3006");
    expect(result.status).toBe("nuevo");
    expect(result.linkedIncidentCodes).toEqual(["INC-2401"]);
  });
});

describe("ProblemsController — actualización", () => {
  it("usuario NO actualiza problemas (403)", async () => {
    const { controller } = makeController([makeProblem()]);
    await expect(
      controller.patch("PRB-3001", { status: "investigacion" }, reqWith("usuario")),
    ).rejects.toThrow(ForbiddenException);
  });

  it("agente cambia estado y registra causa raíz", async () => {
    const { controller } = makeController([makeProblem({ status: "investigacion" })]);
    const result = await controller.patch(
      "PRB-3001",
      { status: "resuelto", causeRaiz: "Spooler saturado por PDF pesados" },
      reqWith("agente"),
    );
    expect(result.status).toBe("resuelto");
    expect(result.causeRaiz).toBe("Spooler saturado por PDF pesados");
  });
});
