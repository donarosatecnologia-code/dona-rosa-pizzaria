/** Converte célula de planilha (Excel/CSV) em texto estável para telefone e outros campos. */

import { excelSerialToIsoDate, isLikelyExcelDateSerial } from "./parseSpreadsheetDate";

function expandScientificNotation(input: string): string {
  const compact = input.trim().replace(/\s/g, "").replace(/,/g, ".").toUpperCase();
  const match = /^([+-]?)(\d+(?:\.\d+)?)[E]([+-]?\d+)$/.exec(compact);
  if (!match) {
    return input;
  }

  const sign = match[1] === "-" ? "-" : "";
  const mantissa = match[2];
  const exponent = parseInt(match[3], 10);
  const [intPart, fracPart = ""] = mantissa.split(".");
  const digitsOnly = intPart + fracPart;
  const decimalPosition = intPart.length + exponent;

  if (decimalPosition <= 0) {
    return sign + "0";
  }
  if (decimalPosition >= digitsOnly.length) {
    return sign + digitsOnly + "0".repeat(decimalPosition - digitsOnly.length);
  }

  return sign + digitsOnly.slice(0, decimalPosition);
}

function stripTrailingDecimalZeros(value: string): string {
  const normalized = value.replace(",", ".").trim();
  if (/^\d+\.0+$/.test(normalized)) {
    return normalized.replace(/\.0+$/, "");
  }
  return value;
}

function formatDateCell(value: Date): string {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Valor textual de célula XLSX: usa cell.v para números (cell.w pode ser notação científica). */
export function xlsxCellToString(
  cell: { t?: string; v?: unknown; w?: string; z?: string } | undefined,
): string {
  if (!cell) {
    return "";
  }

  if (cell.t === "d" || cell.v instanceof Date) {
    const date = cell.v instanceof Date ? cell.v : new Date(String(cell.v));
    if (!Number.isNaN(date.getTime())) {
      return formatDateCell(date);
    }
  }

  if (cell.t === "n" && typeof cell.v === "number" && Number.isFinite(cell.v)) {
    const formatHint = typeof cell.z === "string" ? cell.z : "";
    const isDateFormat = /[dymhs]/i.test(formatHint) && !/0\.00|#,##/.test(formatHint);
    if (isDateFormat || isLikelyExcelDateSerial(cell.v, cell.w)) {
      const fromSerial = excelSerialToIsoDate(cell.v);
      if (fromSerial) {
        return fromSerial;
      }
      if (typeof cell.w === "string" && cell.w.trim()) {
        return cell.w.trim();
      }
    }
    return String(Math.trunc(cell.v));
  }

  if (typeof cell.w === "string" && cell.w.trim()) {
    return cell.w.trim();
  }

  return spreadsheetCellToString(cell.v);
}

export function spreadsheetCellToString(cell: unknown): string {
  if (cell == null || cell === "") {
    return "";
  }

  if (typeof cell === "number" && Number.isFinite(cell)) {
    if (Number.isInteger(cell)) {
      return String(cell);
    }
    const rounded = Math.round(cell);
    if (Math.abs(cell - rounded) < 1e-9) {
      return String(rounded);
    }
    return String(cell);
  }

  if (typeof cell === "boolean") {
    return "";
  }

  let text = String(cell).trim();
  if (!text) {
    return "";
  }

  const exponentIndex = text.search(/[eE]/);
  if (exponentIndex > 0) {
    text = text.slice(0, exponentIndex).replace(/,/g, ".") + text.slice(exponentIndex);
    return expandScientificNotation(text);
  }

  return stripTrailingDecimalZeros(text);
}
