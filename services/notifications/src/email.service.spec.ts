import { EmailService } from "./email.service";
import { encryptSetting } from "./settings-crypto";

/**
 * M9 — verificación de que el escaping HTML de emails neutraliza
 * payloads inyectados desde subjects/códigos de tickets, y que las
 * entidades producidas decodifican al texto literal original.
 *
 * Nota: las entidades se construyen con charCodes para que el archivo
 * fuente contenga caracteres reales y no haya ambigüedad posible.
 */
const ENT = {
  lt: String.fromCharCode(38, 108, 116, 59), // &-l-t-;
  gt: String.fromCharCode(38, 103, 116, 59), // &-g-t-;
  amp: String.fromCharCode(38, 97, 109, 112, 59), // &-a-m-p-;
  quot: String.fromCharCode(38, 113, 117, 111, 116, 59), // &-q-u-o-t-;
  apos: String.fromCharCode(38, 35, 48, 51, 57, 59), // &-#-0-3-9-;
};

describe("EmailService — escaping HTML (M9)", () => {
  const svc = new EmailService({} as never);
  const esc = (t: string) =>
    (svc as unknown as { esc(t: string): string }).esc(t);
  const renderHtml = (e: {
    routingKey: string;
    code: string | null;
    summary: string;
    audience: string;
  }) =>
    (svc as unknown as {
      renderHtml(e: unknown): string;
    }).renderHtml(e);

  it("esc() neutraliza los 5 caracteres peligrosos", () => {
    const payload = '<img src=x onerror="alert(1)">&\'';
    const out = esc(payload);
    expect(out).toBe(
      ENT.lt +
        "img src=x onerror=" +
        ENT.quot +
        "alert(1)" +
        ENT.quot +
        ENT.gt +
        ENT.amp +
        ENT.apos,
    );
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("las entidades decodifican al carácter literal (longitud y contenido)", () => {
    // "&-l-t-;" tiene 4 chars; un "<" literal tiene 1 — prueba de que
    // la entidad es la secuencia de texto, no el carácter peligroso
    expect(ENT.lt.length).toBe(4);
    expect(ENT.lt.charCodeAt(0)).toBe(38);
    expect(esc("<")).toBe(ENT.lt);
    expect(esc(">")).toBe(ENT.gt);
    expect(esc("&")).toBe(ENT.amp);
    expect(esc('"')).toBe(ENT.quot);
    expect(esc("'")).toBe(ENT.apos);
  });

  it("el orden del escape evita doble-escapado (& primero)", () => {
    const out = esc("<b>&</b>");
    expect(out).toBe(ENT.lt + "b" + ENT.gt + ENT.amp + ENT.lt + "/b" + ENT.gt);
    // el "&" original NO se convierte en "&amp;"
    expect(out).not.toContain(ENT.amp + "amp" + ";");
  });

  it("renderHtml no contiene tags inyectados desde el ticket", () => {
    const html = renderHtml({
      routingKey: "ticket.created",
      code: "<script>steal()</script>",
      summary: '<b onmouseover="alert(1)">INC-2401 phish</b><script>alert(1)</script>',
      audience: "agentes & 'admin' <i>",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b onmouseover");
    expect(html).not.toContain("<i>");
    expect(html).toContain(ENT.lt + "script" + ENT.gt);
    expect(html).toContain(ENT.lt + "b onmouseover");
    expect(html).toContain(ENT.apos);
  });

  it("renderText es texto plano y sin riesgo de markup", () => {
    const text = (
      svc as unknown as {
        renderText(e: unknown): string;
      }
    ).renderText({
      routingKey: "ticket.created",
      code: "INC-2401",
      summary: "<script>alert(1)</script>",
      audience: "agentes",
    });
    expect(text).toContain("<script>alert(1)</script>");
    expect(text).not.toMatch(/<html|<!DOCTYPE/);
  });
});

describe("EmailService — migrateLegacyPass (hallazgo C9)", () => {
  function makeRepo(rows: Array<{ key: string; value: string }>) {
    const queries: unknown[][] = [];
    const settingsRepo = {
      find: async () => rows.map((r) => ({ ...r, updatedAt: new Date() })),
      manager: {
        transaction: async (cb: (em: { query: unknown }) => Promise<void>) =>
          cb({
            query: async (...args: unknown[]) => {
              queries.push(args);
            },
          }),
      },
    };
    return { settingsRepo, queries };
  }

  it("plaintext legado: UPDATE condicional con el valor del snapshot y settings usables", async () => {
    const rows = [
      { key: "smtp.host", value: "smtp.test.local" },
      { key: "smtp.port", value: "2525" },
      { key: "smtp.enabled", value: "true" },
      { key: "smtp.pass", value: "legacy-plain" },
    ];
    const { settingsRepo, queries } = makeRepo(rows);
    const svc = new EmailService(settingsRepo as never);
    await svc.reload();

    // UPDATE condicional (WHERE value = $2): un PUT concurrente no puede ser clobbered
    expect(queries).toHaveLength(1);
    expect(String(queries[0][0])).toContain(
      "WHERE key = 'smtp.pass' AND value = $2",
    );
    // em.query(sql, [encValue, plaintextSnapshot]) — params es un solo argumento
    const params = queries[0][1] as unknown[];
    expect(String(params[0])).toMatch(/^enc:v1:/);
    expect(params[1]).toBe("legacy-plain");

    // El snapshot legible sigue alimentando la config en esta pasada
    const current = (svc as unknown as { current: { pass: string; host: string } }).current;
    expect(current.pass).toBe("legacy-plain");
    expect(current.host).toBe("smtp.test.local");
  });

  it("valor ya cifrado: no hay migración (idempotente)", async () => {
    const rows = [
      { key: "smtp.pass", value: encryptSetting("ya-cifrado") },
    ];
    const { settingsRepo, queries } = makeRepo(rows);
    const svc = new EmailService(settingsRepo as never);
    await svc.reload();
    expect(queries).toHaveLength(0);
    const current = (svc as unknown as { current: { pass: string } }).current;
    expect(current.pass).toBe("ya-cifrado");
  });

  it("fallo del write de migración NO deshabilita la config legible (C6)", async () => {
    const rows = [
      { key: "smtp.host", value: "smtp.test.local" },
      { key: "smtp.enabled", value: "true" },
      { key: "smtp.pass", value: "legacy-plain" },
    ];
    const settingsRepo = {
      find: async () => rows.map((r) => ({ ...r, updatedAt: new Date() })),
      manager: {
        transaction: async (cb: (em: { query: unknown }) => Promise<void>) =>
          cb({
            query: async () => {
              throw new Error("lock timeout");
            },
          }),
      },
    };
    const svc = new EmailService(settingsRepo as never);
    await svc.reload();
    const current = (svc as unknown as { current: { host: string; pass: string } | null }).current;
    // El write falló pero la lectura sigue viva
    expect(current?.host).toBe("smtp.test.local");
    expect(current?.pass).toBe("legacy-plain");
  });
});
