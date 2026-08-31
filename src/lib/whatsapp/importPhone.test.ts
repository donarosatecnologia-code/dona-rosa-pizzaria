import { describe, expect, it } from "vitest";
import {
  isLandlineFromImportDigits,
  phoneDigitsFromImportRaw,
  validateImportPhoneDigits,
} from "./importPhone";

describe("phoneDigitsFromImportRaw", () => {
  it("mantém dígitos da planilha sem normalizar", () => {
    expect(phoneDigitsFromImportRaw("551138621077")).toBe("551138621077");
    expect(phoneDigitsFromImportRaw("5511999998888")).toBe("5511999998888");
    expect(phoneDigitsFromImportRaw("5511763131424")).toBe("5511763131424");
  });

  it("remove apenas formatação visual", () => {
    expect(phoneDigitsFromImportRaw("(11) 3862-1077")).toBe("1138621077");
  });
});

describe("isLandlineFromImportDigits", () => {
  it("identifica fixo de 12 dígitos da planilha", () => {
    expect(isLandlineFromImportDigits("551138621077")).toBe(true);
    expect(isLandlineFromImportDigits("551121484000")).toBe(true);
  });

  it("não classifica celular de 13 dígitos", () => {
    expect(isLandlineFromImportDigits("5511999998888")).toBe(false);
  });

  it("não classifica número inválido de 13 dígitos", () => {
    expect(isLandlineFromImportDigits("5511763131424")).toBe(false);
  });
});

describe("validateImportPhoneDigits", () => {
  it("aceita qualquer número com dígitos (inválidos entram como estão)", () => {
    expect(validateImportPhoneDigits("5511763131424").valid).toBe(true);
    expect(validateImportPhoneDigits("219919376").valid).toBe(true);
  });

  it("rejeita vazio", () => {
    expect(validateImportPhoneDigits("").valid).toBe(false);
  });
});
