import { spreadsheetCellToString } from "./spreadsheetCell";

export interface NormalizePhoneResult {
  normalized: string | null;
  valid: boolean;
  reason?: string;
}

/** True quando o número original é fixo (10 dígitos nacionais, sem o 9 do celular). */
export function isLandlineBrazilPhone(input: string): boolean {
  const prepared = spreadsheetCellToString(input);
  let digits = prepared.replace(/\D/g, "");

  if (digits.length === 0) {
    return false;
  }

  digits = digits.replace(/^0+/, "");

  if (digits.startsWith("5555")) {
    digits = digits.slice(2);
  }

  if (!digits.startsWith("55")) {
    if (digits.length >= 10 && digits.length <= 11) {
      digits = `55${digits}`;
    } else {
      return false;
    }
  }

  return digits.slice(2).length === 10;
}

/**
 * Fixo armazenado: 55 + DDD (2) + 8 dígitos = 12 dígitos totais, sem 9 após o DDD.
 * Celular/WhatsApp: 55 + DDD + 9 + 8 = 13 dígitos; o 3º dígito nacional (índice 2) é 9.
 */
export function isLandlineStoredPhone(phone: string): boolean {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("5555")) {
    digits = digits.slice(2);
  }

  if (!digits.startsWith("55")) {
    return false;
  }

  const national = digits.slice(2);

  if (national.length === 10) {
    return true;
  }

  return false;
}

/** Regex alinhado a isLandlineStoredPhone — exatamente 12 dígitos, sem 9 após DDD. */
export const LANDLINE_STORED_PHONE_REGEX = "^55[0-9]{2}[0-8][0-9]{7}$";

/** Normaliza telefone BR para E.164 sem + (ex.: 5511999998888). */
export function normalizeBrazilPhone(input: string): NormalizePhoneResult {
  const prepared = spreadsheetCellToString(input);
  let digits = prepared.replace(/\D/g, "");

  if (digits.length === 0) {
    return { normalized: null, valid: false, reason: "número vazio" };
  }

  digits = digits.replace(/^0+/, "");

  if (digits.length === 0) {
    return { normalized: null, valid: false, reason: "número vazio" };
  }

  if (digits.startsWith("5555")) {
    digits = digits.slice(2);
  }

  if (!digits.startsWith("55")) {
    if (digits.length >= 10 && digits.length <= 11) {
      digits = `55${digits}`;
    } else {
      return { normalized: null, valid: false, reason: "formato inválido" };
    }
  }

  const national = digits.slice(2);

  const finalNational = digits.slice(2);

  if (finalNational.length === 11 && finalNational.charAt(2) !== "9") {
    return { normalized: null, valid: false, reason: "número de celular inválido" };
  }

  if (finalNational.length !== 10 && finalNational.length !== 11) {
    return { normalized: null, valid: false, reason: "tamanho inválido após normalização" };
  }

  return { normalized: digits, valid: true };
}

/** Mascara telefone para exibição em relatórios (+55119****8888). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) {
    return phone;
  }
  const prefix = digits.slice(0, 5);
  const suffix = digits.slice(-4);
  return `+${prefix}****${suffix}`;
}
