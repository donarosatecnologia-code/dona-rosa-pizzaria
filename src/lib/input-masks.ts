import { normalizeBrazilPhone } from "@/lib/whatsapp/normalizePhone";

/** Máscara BR: +55 (DDD) 99999-9999 ou +55 (DDD) 9999-9999 */
export function maskBrazilPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);
  if (digits.length === 0) {
    return "";
  }

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (digits.length <= 2) {
    return `+55 (${ddd}`;
  }

  let formatted = `+55 (${ddd}) `;

  if (rest.length <= 4) {
    return formatted + rest;
  }

  const isMobile = rest.length >= 9 || digits.length === 11;
  if (isMobile) {
    const body = rest.slice(0, 9);
    if (body.length <= 5) {
      return formatted + body;
    }
    return `${formatted}${body.slice(0, 5)}-${body.slice(5)}`;
  }

  if (rest.length <= 4) {
    return formatted + rest;
  }

  return `${formatted}${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
}

/** Normaliza telefone mascarado para envio (E.164 sem +). */
export function unmaskBrazilPhoneInput(masked: string): string | null {
  const result = normalizeBrazilPhone(masked);
  return result.valid ? result.normalized : null;
}

export function isBrazilPhoneInputComplete(masked: string): boolean {
  return unmaskBrazilPhoneInput(masked) !== null;
}

/** Remove espaços e caracteres inválidos; mantém minúsculas. */
export function maskEmailInput(raw: string): string {
  return raw
    .replace(/\s/g, "")
    .replace(/[^a-zA-Z0-9@._%+-]/g, "")
    .toLowerCase();
}

export function isEmailInputValid(email: string): boolean {
  const trimmed = maskEmailInput(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export const BRAZIL_PHONE_INPUT_PLACEHOLDER = "+55 (11) 99999-9999";
