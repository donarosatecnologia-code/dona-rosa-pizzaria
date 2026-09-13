/** Converte datas comuns de planilhas brasileiras / Excel para ISO (YYYY-MM-DD). */

/** Serial Excel (dias desde 1899-12-30) → YYYY-MM-DD. */
export function excelSerialToIsoDate(serial: number): string | null {
  if (!Number.isFinite(serial) || serial < 1 || serial > 100_000) {
    return null;
  }

  const wholeDays = Math.floor(serial);
  // Excel: dia 1 = 1899-12-31; SheetJS/UTC: epoch Unix 1970-01-01 = serial 25569
  const utcMs = (wholeDays - 25569) * 86_400_000;
  const date = new Date(utcMs);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return toIsoDate(String(year), String(month), String(day));
}

function looksLikeDateDisplay(text: string): boolean {
  return (
    /^\d{1,2}[./]\d{1,2}[./]\d{2,4}/.test(text) ||
    /^\d{4}-\d{2}-\d{2}/.test(text)
  );
}

/** Detecta se um número de célula Excel é data serial (não telefone). */
export function isLikelyExcelDateSerial(value: number, display?: string): boolean {
  if (!Number.isFinite(value) || value < 200 || value > 80_000) {
    return false;
  }
  if (display && looksLikeDateDisplay(display.trim())) {
    return true;
  }
  // Serial típico de datas modernas (~1982–2064); telefones BR têm ≥10 dígitos
  return value >= 30_000 && value <= 60_000;
}

export function parseSpreadsheetDateString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed);
    const fromSerial = excelSerialToIsoDate(serial);
    if (fromSerial) {
      return fromSerial;
    }
  }

  const dotDateTime = /^(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(trimmed);
  if (dotDateTime) {
    const [, day, month, year] = dotDateTime;
    return toIsoDate(year, month, day);
  }

  const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(trimmed);
  if (slashDate) {
    const [, day, month, year] = slashDate;
    return toIsoDate(year, month, day);
  }

  // Excel US curto: 9/8/26 ou 09/08/2026
  const slashShort = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(trimmed);
  if (slashShort) {
    const [, a, b, yy] = slashShort;
    const year = Number(yy) >= 70 ? `19${yy}` : `20${yy}`;
    // Planilha Dona Rosa é BR: dia/mês; se a>12, com certeza dia/mês
    const dayFirst = Number(a) > 12 || Number(b) <= 12;
    if (dayFirst && Number(a) <= 31 && Number(b) <= 12) {
      return toIsoDate(year, b, a);
    }
    return toIsoDate(year, a, b);
  }

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  }

  const asDate = new Date(trimmed);
  if (!Number.isNaN(asDate.getTime()) && /\d{4}/.test(trimmed)) {
    return `${asDate.getUTCFullYear()}-${String(asDate.getUTCMonth() + 1).padStart(2, "0")}-${String(asDate.getUTCDate()).padStart(2, "0")}`;
  }

  return null;
}

function toIsoDate(year: string, month: string, day: string): string | null {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseSpreadsheetInteger(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // "2.108" (milhar BR) ou "2,108" → 2108
  if (/^\d{1,3}([.]\d{3})+$/.test(trimmed)) {
    const value = Number.parseInt(trimmed.replace(/\./g, ""), 10);
    return Number.isFinite(value) ? value : null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return null;
  }
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}

export function parseSpreadsheetMoney(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const value = Number.parseFloat(trimmed);
    return Number.isFinite(value) ? value : null;
  }

  let normalized = trimmed.replace(/[^\d,.-]/g, "");
  if (!normalized) {
    return null;
  }

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/,/g, "");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}
