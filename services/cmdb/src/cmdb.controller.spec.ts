import { CmdbController } from "./cmdb.controller";
import { CiEntity } from "./ci.entity";

function makeCi(overrides: Partial<CiEntity> = {}): CiEntity {
  return {
    id: 1,
    code: "CI-1001",
    name: "SRV-DC01 — Directorio activo",
    type: "servidor",
    environment: "produccion",
    criticality: "alta",
    owner: "Infraestructura",
    relations: [{ ciId: "CI-1008", kind: "conecta_a" }],
    ...overrides,
  } as CiEntity;
}

describe("CmdbController", () => {
  it("lista los CIs ordenados por id", async () => {
    const repo = { find: async () => [makeCi(), makeCi({ id: 2, code: "CI-1002" })] };
    const controller = new CmdbController(repo as never);
    const result = await controller.list();
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe("CI-1001");
    expect(result[0].relations).toEqual([{ ciId: "CI-1008", kind: "conecta_a" }]);
  });

  it("falla limpio si el CI no existe", async () => {
    const repo = { find: async () => [], findOne: async () => null };
    const controller = new CmdbController(repo as never);
    await expect(controller.byCode("CI-9999")).rejects.toThrow();
  });
});
