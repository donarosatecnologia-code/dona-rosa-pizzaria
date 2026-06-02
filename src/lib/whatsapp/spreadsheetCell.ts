/** Converte célula de planilha (Excel/CSV) em texto estável para telefone e outros campos. */

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
