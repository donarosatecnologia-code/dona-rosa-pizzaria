import { describe, expect, it } from "vitest";
import {
  isBrazilPhoneInputComplete,
  isEmailInputValid,
  maskBrazilPhoneInput,
  maskEmailInput,
  unmaskBrazilPhoneInput,
} from "./input-masks";

describe("maskBrazilPhoneInput", () => {
  it("formata celular com ddd", () => {
    expect(maskBrazilPhoneInput("11999998888")).toBe("+55 (11) 99999-8888");
  });

  it("formata com +55 colado", () => {
    expect(maskBrazilPhoneInput("+5511999998888")).toBe("+55 (11) 99999-8888");
  });

  it("formata fixo com 8 dígitos", () => {
    expect(maskBrazilPhoneInput("1133334444")).toBe("+55 (11) 3333-4444");
  });

  it("limita a 11 dígitos nacionais", () => {
    expect(maskBrazilPhoneInput("119999988881234")).toBe("+55 (11) 99999-8888");
  });
});

describe("unmaskBrazilPhoneInput", () => {
  it("extrai e164 sem +", () => {
    expect(unmaskBrazilPhoneInput("+55 (11) 99999-8888")).toBe("5511999998888");
  });

  it("retorna null se incompleto", () => {
    expect(unmaskBrazilPhoneInput("+55 (11) 9999")).toBeNull();
  });
});

describe("isBrazilPhoneInputComplete", () => {
  it("valida telefone completo", () => {
    expect(isBrazilPhoneInputComplete("+55 (11) 99999-8888")).toBe(true);
  });
});

describe("maskEmailInput", () => {
  it("remove espaços e converte para minúsculas", () => {
    expect(maskEmailInput("  Maria@Email.COM  ")).toBe("maria@email.com");
  });

  it("remove caracteres inválidos", () => {
    expect(maskEmailInput("teste#@dominio.com")).toBe("teste@dominio.com");
  });
});

describe("isEmailInputValid", () => {
  it("aceita e-mail válido", () => {
    expect(isEmailInputValid("maria@email.com")).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    expect(isEmailInputValid("maria@")).toBe(false);
  });
});
