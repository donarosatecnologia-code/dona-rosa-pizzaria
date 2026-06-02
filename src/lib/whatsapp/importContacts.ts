import { supabase } from "@/integrations/supabase/client";
import { normalizeBrazilPhone } from "./normalizePhone";

const PHONE_COLUMNS = ["telefone", "phone", "cel", "celular", "numero", "número", "whatsapp"];
const NAME_COLUMNS = ["nome", "name"];

export interface ImportRowError {
  line: number;
  value: string;
  reason: string;
}

export interface ImportContactsResult {
  totalRows: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails: ImportRowError[];
}

interface ParsedRow {
  line: number;
  name: string;
  phoneRaw: string;
}

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

function detectColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

function parseCsvContent(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const phoneIdx = detectColumnIndex(headers, PHONE_COLUMNS);
  const nameIdx = detectColumnIndex(headers, NAME_COLUMNS);

  if (phoneIdx < 0) {
    throw new Error("missing_phone_column");
  }

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const phoneRaw = cols[phoneIdx] ?? "";
    if (!phoneRaw.trim()) {
      continue;
    }
    rows.push({
      line: i + 1,
      name: nameIdx >= 0 ? (cols[nameIdx] ?? "").trim() : "",
      phoneRaw,
    });
  }
  return rows;
}

const BATCH_SIZE = 100;

export async function importContactsFromCsv(file: File): Promise<ImportContactsResult> {
  const text = await file.text();
  let parsed: ParsedRow[];

  try {
    parsed = parseCsvContent(text);
  } catch (error) {
    if (error instanceof Error && error.message === "missing_phone_column") {
      throw error;
    }
    throw new Error("invalid_csv");
  }

  if (parsed.length === 0) {
    throw new Error("empty_csv");
  }

  if (parsed.length > 5000) {
    throw new Error("too_many_rows");
  }

  const validRows: Array<{ line: number; name: string; phone: string }> = [];
  const errorDetails: ImportRowError[] = [];

  for (const row of parsed) {
    const result = normalizeBrazilPhone(row.phoneRaw);
    if (!result.valid || !result.normalized) {
      errorDetails.push({
        line: row.line,
        value: row.phoneRaw,
        reason: result.reason ?? "formato inválido",
      });
      continue;
    }
    validRows.push({
      line: row.line,
      name: row.name || result.normalized,
      phone: result.normalized,
    });
  }

  const phones = validRows.map((r) => r.phone);
  const existingPhones = new Set<string>();

  for (let i = 0; i < phones.length; i += 500) {
    const chunk = phones.slice(i, i + 500);
    const { data } = await supabase
      .from("whatsapp_contacts")
      .select("phone_number")
      .in("phone_number", chunk);
    for (const row of data ?? []) {
      existingPhones.add(row.phone_number);
    }
  }

  const toInsert = validRows.filter((r) => !existingPhones.has(r.phone));
  const duplicates = validRows.length - toInsert.length;

  let imported = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE).map((r) => ({
      name: r.name,
      phone_number: r.phone,
      status: "active" as const,
    }));

    const { error } = await supabase
      .from("whatsapp_contacts")
      .upsert(batch, { onConflict: "phone_number", ignoreDuplicates: true });

    if (error) {
      throw error;
    }
    imported += batch.length;
  }

  return {
    totalRows: parsed.length,
    imported,
    duplicates,
    errors: errorDetails.length,
    errorDetails,
  };
}
