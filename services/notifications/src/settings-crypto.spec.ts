import {
  decryptSetting,
  decryptSettingEx,
  encryptSetting,
  isEncrypted,
} from "./settings-crypto";

describe("settings-crypto (M13 — password SMTP cifrado en reposo)", () => {
  it("roundtrip: decrypt(encrypt(x)) === x y el plaintext nunca aparece en el sobre", () => {
    const pass = "hunter2-super-secreto";
    const enc = encryptSetting(pass);
    expect(enc).not.toContain(pass);
    expect(isEncrypted(enc)).toBe(true);
    expect(decryptSetting(enc)).toBe(pass);
  });

  it("valor legacy en plaintext pasa sin cambios (retrocompatibilidad)", () => {
    expect(isEncrypted("legacy-plain-pass")).toBe(false);
    expect(decryptSetting("legacy-plain-pass")).toBe("legacy-plain-pass");
  });

  it("ciphertext distinto en cada cifrado (IV aleatorio)", () => {
    expect(encryptSetting("mismo")).not.toBe(encryptSetting("mismo"));
  });

  it("ciphertext corrupto/tampered devuelve vacío, no el ciphertext como password", () => {
    const enc = encryptSetting("secreto");
    const [iv, tag] = enc.slice("enc:v1:".length).split(":");
    const tamperedData = Buffer.from("corrupto").toString("base64");
    expect(decryptSetting(`enc:v1:${iv}:${tag}:${tamperedData}`)).toBe("");
  });

  it("tag manipulado (integridad GCM) devuelve vacío", () => {
    const enc = encryptSetting("secreto");
    const [iv, , data] = enc.slice("enc:v1:".length).split(":");
    const badTag = Buffer.from("tag-falso").toString("base64");
    expect(decryptSetting(`enc:v1:${iv}:${badTag}:${data}`)).toBe("");
  });

  it("v2: SETTINGS_SECRET dedicada — el sobre usa enc:v2 y es legible", () => {
    process.env.SETTINGS_SECRET = "settings-secret-dedicada-de-32-chars!!";
    try {
      const enc = encryptSetting("pass-v2");
      expect(enc.startsWith("enc:v2:")).toBe(true);
      expect(decryptSetting(enc)).toBe("pass-v2");
    } finally {
      delete process.env.SETTINGS_SECRET;
    }
  });

  it("v2 sin SETTINGS_SECRET al descifrar → señal unreadable explícita", () => {
    process.env.SETTINGS_SECRET = "settings-secret-dedicada-de-32-chars!!";
    const enc = encryptSetting("pass-v2");
    delete process.env.SETTINGS_SECRET;
    const r = decryptSettingEx(enc);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("unreadable");
    // El ciphertext JAMÁS se devuelve como valor
    expect(decryptSetting(enc)).toBe("");
  });

  it("rotación de clave (hallazgo S1): sobres v1 viejos → unreadable, no el ciphertext", () => {
    const enc = encryptSetting("secreto-original"); // v1 con la clave actual
    // Simular rotación del JWT_SECRET (fuente de la clave v1)
    const prev = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "jwt-secret-rotado-totalmente-distinto-32chars";
    try {
      const r = decryptSettingEx(enc);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe("unreadable");
    } finally {
      if (prev === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = prev;
    }
  });
});
