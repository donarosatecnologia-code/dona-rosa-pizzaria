import { describe, expect, it } from "vitest";
import { normalizeBrazilPhone } from "./normalizePhone";

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

  it("insere 9 quando número fixo tem 10 dígitos nacionais", () => {
    expect(normalizeBrazilPhone("1188887777")).toEqual({
      normalized: "5511988887777",
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
