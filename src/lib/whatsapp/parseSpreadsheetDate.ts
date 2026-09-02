/** Converte datas comuns de planilhas brasileiras para ISO (YYYY-MM-DD). */

export function parseSpreadsheetDateString(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
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

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
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
  const digits = raw.replace(/\D/g, "");
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
