import { describe, expect, it } from "vitest";
import { isLandlineBrazilPhone, isLandlineStoredPhone, normalizeBrazilPhone } from "./normalizePhone";

describe("normalizeBrazilPhone", () => {
  it("aceita celular com ddd sem +55", () => {
    expect(normalizeBrazilPhone("11999998888")).toEqual({
      normalized: "5511999998888",
      valid: true,
    });
  });

  it("aceita formato internacional com +55", () => {
    expect(normalizeBrazilPhone("+5511999998888")).toEqual({
      normalized: "5511999998888",
      valid: true,
    });
  });

  it("aceita formatação com parênteses e hífen", () => {
    expect(normalizeBrazilPhone("(11) 99999-8888")).toEqual({
      normalized: "5511999998888",
      valid: true,
    });
  });

  it("mantém fixo com 10 dígitos nacionais (sem inserir 9)", () => {
    expect(normalizeBrazilPhone("1188887777")).toEqual({
      normalized: "551188887777",
      valid: true,
    });
  });

  it("rejeita número vazio", () => {
    expect(normalizeBrazilPhone("   ").valid).toBe(false);
  });

  it("rejeita formato inválido", () => {
    expect(normalizeBrazilPhone("123").valid).toBe(false);
  });

  it("aceita notação científica do excel", () => {
    expect(normalizeBrazilPhone("1.19999998888E+10").valid).toBe(true);
    expect(normalizeBrazilPhone("1.19999998888E+10").normalized).toMatch(/^5511/);
  });

  it("aceita vírgula decimal brasileira em notação científica", () => {
    expect(normalizeBrazilPhone("9,1999999888E+09").valid).toBe(true);
  });

  it("aceita sufixo .0 de célula numérica formatada como texto", () => {
    expect(normalizeBrazilPhone("5511999998888.0")).toEqual({
      normalized: "5511999998888",
      valid: true,
    });
  });

  it("aceita zero à esquerda no ddd", () => {
    expect(normalizeBrazilPhone("011999998888")).toEqual({
      normalized: "5511999998888",
      valid: true,
    });
  });
});

describe("isLandlineBrazilPhone", () => {
  it("detecta telefone fixo antes da normalização", () => {
    expect(isLandlineBrazilPhone("1133334444")).toBe(true);
    expect(isLandlineBrazilPhone("(11) 3333-4444")).toBe(true);
  });

  it("não classifica celular como fixo", () => {
    expect(isLandlineBrazilPhone("11999998888")).toBe(false);
    expect(isLandlineBrazilPhone("+5511999998888")).toBe(false);
  });
});

describe("isLandlineStoredPhone", () => {
  it("detecta fixo armazenado (12 dígitos)", () => {
    expect(isLandlineStoredPhone("551133334444")).toBe(true);
  });

  it("não classifica celular armazenado (13 dígitos, 9 após DDD)", () => {
    expect(isLandlineStoredPhone("5511999998888")).toBe(false);
  });
});
