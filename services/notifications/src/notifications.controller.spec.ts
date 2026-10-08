import { NotificationsController } from "./notifications.controller";
import { NotificationEntity } from "./notification.entity";

function makeRow(overrides: Partial<NotificationEntity> = {}): NotificationEntity {
  return {
    id: 1,
    routingKey: "ticket.created",
    code: "REQ-2407",
    summary: "REQ-2407 registrado",
    audience: "M. Aguilar",
    occurredAt: new Date(),
    ...overrides,
  } as NotificationEntity;
}

function makeController(rows: NotificationEntity[]) {
  const find = jest.fn(async (opts?: { where?: Record<string, string> }) => rows);
  const controller = new NotificationsController({ find } as never);
  return { controller, find };
}

function reqWith(name: string, role: string) {
  return { user: { name, role } } as never;
}

describe("NotificationsController — feed por rol", () => {
  it("agente ve todos los eventos sin filtro de audiencia", async () => {
    const rows = [makeRow(), makeRow({ audience: "agente" })];
    const { controller, find } = makeController(rows);
    const result = await controller.list("20", reqWith("Jorge Ramos", "agente"));
    expect(result).toHaveLength(2);
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("usuario solo ve filas de SU audiencia", async () => {
    const rows = [makeRow()];
    const { controller, find } = makeController(rows);
    await controller.list("20", reqWith("M. Aguilar", "usuario"));
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { audience: "M. Aguilar" } }),
    );
  });

  it("admin también ve todo", async () => {
    const rows = [makeRow()];
    const { controller, find } = makeController(rows);
    await controller.list("20", reqWith("Administrador", "admin"));
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
