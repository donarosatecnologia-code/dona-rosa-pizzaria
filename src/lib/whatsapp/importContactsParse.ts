import * as XLSX from "xlsx";
import {
  isCsvFile,
  isXlsxFile,
  mapSpreadsheetRows,
  type ParsedImportRow,
} from "./importContactsColumnMap";
import { spreadsheetCellToString } from "./spreadsheetCell";

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
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });
  return raw.map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => spreadsheetCellToString(cell)),
  );
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
