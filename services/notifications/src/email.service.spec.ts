import { EmailService } from "./email.service";

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
