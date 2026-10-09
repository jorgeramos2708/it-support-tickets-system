import { decryptSetting, encryptSetting, isEncrypted } from "./settings-crypto";

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
});
