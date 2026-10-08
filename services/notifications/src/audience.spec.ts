import { deriveAudience, deriveSummary } from "./audience";

describe("deriveAudience — enrutamiento del feed", () => {
  it("un evento de ticket va al solicitante", () => {
    expect(deriveAudience({ requester: "M. Aguilar" })).toBe("M. Aguilar");
  });

  it("un evento operativo va al equipo", () => {
    expect(deriveAudience({ code: "PRB-3006", title: "x" })).toBe("agente");
  });

  it("requester vacío o en blanco cae al equipo", () => {
    expect(deriveAudience({ requester: "" })).toBe("agente");
    expect(deriveAudience({ requester: "   " })).toBe("agente");
    expect(deriveAudience({})).toBe("agente");
  });
});

describe("deriveSummary — resumen legible", () => {
  it("usa el summary humano cuando existe", () => {
    expect(deriveSummary({ summary: "INC-2401 registrado — VPN" }, "ticket.created")).toBe(
      "INC-2401 registrado — VPN",
    );
  });

  it("construye respaldo con routingKey y código", () => {
    expect(deriveSummary({ code: "CHG-4006" }, "change.approved")).toBe(
      "change.approved · CHG-4006",
    );
    expect(deriveSummary({}, "problem.created")).toBe(
      "problem.created · sin código",
    );
  });

  it("ignora un summary en blanco (solo espacios)", () => {
    expect(deriveSummary({ summary: "   ", code: "PRB-3006" }, "problem.updated")).toBe(
      "problem.updated · PRB-3006",
    );
  });
});

describe("deriveAudience — tipos raros", () => {
  it("un requester no-string cae al equipo", () => {
    expect(deriveAudience({ requester: 123 })).toBe("agente");
    expect(deriveAudience({ requester: null })).toBe("agente");
  });
});
