import { KbController } from "./kb.controller";
import { ArticleEntity } from "./article.entity";

function makeArticle(overrides: Partial<ArticleEntity> = {}): ArticleEntity {
  return {
    id: 1,
    code: "KB-101",
    title: "Desbloquear tu cuenta",
    practice: "incidente",
    summary: "resumen",
    sections: [{ heading: "Paso a paso", body: "…" }],
    views: 100,
    helpful: 80,
    updatedAt: new Date(),
    ...overrides,
  } as ArticleEntity;
}

describe("KbController", () => {
  it("la lectura incrementa el contador de vistas", async () => {
    const article = makeArticle();
    const repo = { findOne: async () => article, save: async (a: ArticleEntity) => a };
    const controller = new KbController(repo as never);
    const result = await controller.byCode("KB-101");
    expect(result.views).toBe(101);
    expect(article.views).toBe(101);
  });

  it("el voto útil incrementa helpful solo con la bandera", async () => {
    const article = makeArticle();
    const repo = { findOne: async () => article, save: async (a: ArticleEntity) => a };
    const controller = new KbController(repo as never);
    const voted = await controller.markHelpful("KB-101", { helpful: true });
    expect(voted.helpful).toBe(81);
    const untouched = await controller.markHelpful("KB-101", {});
    expect(untouched.helpful).toBe(81);
  });
});
