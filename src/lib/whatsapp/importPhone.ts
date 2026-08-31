import { spreadsheetCellToString } from "./spreadsheetCell";
import { isLandlineStoredPhone } from "./normalizePhone";

/** Extrai só os dígitos do valor da célula — sem DDD, 9 ou 55 artificiais. */
export function phoneDigitsFromImportRaw(phoneRaw: string): string {
  return phoneRaw.replace(/\D/g, "");
}

export function validateImportPhoneDigits(digits: string): { valid: boolean; reason?: string } {
  if (!digits) {
    return { valid: false, reason: "número vazio" };
  }

  return { valid: true };
}

export function isLandlineFromImportDigits(digits: string): boolean {
  return isLandlineStoredPhone(digits);
}

export { spreadsheetCellToString };
