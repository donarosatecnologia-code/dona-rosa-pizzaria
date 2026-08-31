import * as XLSX from "xlsx";
import {
  isCsvFile,
  isXlsxFile,
  mapSpreadsheetRows,
  type ParsedImportRow,
} from "./importContactsColumnMap";
import { xlsxCellToString } from "./spreadsheetCell";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  fields.push(current.trim());
  return fields;
}

function parseCsvToRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map(parseCsvLine);
}

async function parseXlsxToRows(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }

  const sheet = workbook.Sheets[sheetName];
  const ref = sheet["!ref"];
  if (!ref) {
    return [];
  }

  const range = XLSX.utils.decode_range(ref);
  const rows: string[][] = [];

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const row: string[] = [];
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
      row.push(xlsxCellToString(sheet[address]));
    }
    rows.push(row);
  }

  return rows;
}

export async function parseContactsSpreadsheet(file: File): Promise<ParsedImportRow[]> {
  let rows: string[][];

  if (isXlsxFile(file)) {
    rows = await parseXlsxToRows(file);
  } else if (isCsvFile(file)) {
    const text = await file.text();
    rows = parseCsvToRows(text);
  } else {
    throw new Error("unsupported_format");
  }

  try {
    return mapSpreadsheetRows(rows);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_phone_column") {
      throw error;
    }
    throw new Error("invalid_file");
  }
}

export function hasImportProfileData(
  profile: ParsedImportRow["profile"],
): boolean {
  return Object.keys(profile).length > 0;
}
