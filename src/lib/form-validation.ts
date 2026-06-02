import { isBrazilPhoneInputComplete, isEmailInputValid } from "@/lib/input-masks";

export function requiredField(value: string, message: string): string | undefined {
  if (!value.trim()) {
    return message;
  }
}

export function brazilPhoneField(value: string): string | undefined {
  if (!value.trim()) {
    return "Informe seu telefone.";
  }
  if (!isBrazilPhoneInputComplete(value)) {
    return "Informe um telefone válido com DDD.";
  }
}

export function emailField(value: string): string | undefined {
  if (!value.trim()) {
    return "Informe seu e-mail.";
  }
  if (!isEmailInputValid(value)) {
    return "Informe um e-mail válido.";
  }
}

export function passwordMinField(value: string, min = 8): string | undefined {
  if (value.length < min) {
    return `Use pelo menos ${min} caracteres.`;
  }
}

export function passwordMatchField(password: string, confirm: string): string | undefined {
  if (password !== confirm) {
    return "As senhas não coincidem.";
  }
}
