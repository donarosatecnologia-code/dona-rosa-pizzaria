import { supabase } from "@/integrations/supabase/client";
import type { ContactImportProfile } from "@/lib/whatsapp/importContactsColumnMap";
import {
  hasImportProfileData,
  parseContactsSpreadsheet,
} from "@/lib/whatsapp/importContactsParse";
import { normalizeBrazilPhone } from "./normalizePhone";

const MAX_ERROR_DETAILS = 100;

export interface ImportRowError {
  line: number;
  value: string;
  reason: string;
}

export interface ImportContactsResult {
  batchId: string | null;
  totalRows: number;
  imported: number;
  duplicates: number;
  errors: number;
  errorDetails: ImportRowError[];
}

export interface ImportContactsOptions {
  onProgress?: (percent: number) => void;
}

const BATCH_SIZE = 100;

async function markBatchFailed(batchId: string, errorDetails: ImportRowError[]): Promise<void> {
  await supabase
    .from("whatsapp_import_batches")
    .update({
      status: "failed",
      error_details: errorDetails.slice(0, MAX_ERROR_DETAILS),
    })
    .eq("id", batchId);
}

export async function importContactsFromFile(
  file: File,
  options?: ImportContactsOptions,
): Promise<ImportContactsResult> {
  let parsed;

  try {
    parsed = await parseContactsSpreadsheet(file);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "missing_phone_column") {
        throw error;
      }
      if (error.message === "unsupported_format") {
        throw error;
      }
    }
    throw new Error("invalid_file");
  }

  if (parsed.length === 0) {
    throw new Error("empty_file");
  }

  if (parsed.length > 5000) {
    throw new Error("too_many_rows");
  }

  const validRows: Array<{
    line: number;
    name: string;
    phone: string;
    profile: ContactImportProfile;
  }> = [];
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
      profile: row.profile,
    });
  }

  const { data: batchRow, error: batchError } = await supabase
    .from("whatsapp_import_batches")
    .insert({
      filename: file.name,
      total_rows: parsed.length,
      imported: 0,
      duplicates: 0,
      errors: errorDetails.length,
      error_details: errorDetails.slice(0, MAX_ERROR_DETAILS),
      status: "processing",
    })
    .select("id")
    .single();

  if (batchError || !batchRow) {
    throw batchError ?? new Error("batch_create_failed");
  }

  const batchId = batchRow.id as string;
  options?.onProgress?.(5);

  const seenInFile = new Set<string>();
  const uniqueValidRows: typeof validRows = [];
  let fileDuplicates = 0;

  for (const row of validRows) {
    if (seenInFile.has(row.phone)) {
      fileDuplicates += 1;
      continue;
    }
    seenInFile.add(row.phone);
    uniqueValidRows.push(row);
  }

  const phones = uniqueValidRows.map((r) => r.phone);
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

  options?.onProgress?.(15);

  const toInsert = uniqueValidRows.filter((r) => !existingPhones.has(r.phone));
  const duplicates = fileDuplicates + (uniqueValidRows.length - toInsert.length);

  let imported = 0;
  const totalBatches = Math.max(1, Math.ceil(toInsert.length / BATCH_SIZE));

  try {
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE).map((r) => ({
        name: r.name,
        phone_number: r.phone,
        status: "active" as const,
        import_batch_id: batchId,
        ...(hasImportProfileData(r.profile) ? { import_profile: r.profile } : {}),
      }));

      const { data, error } = await supabase
        .from("whatsapp_contacts")
        .insert(batch)
        .select("id");

      if (error) {
        throw error;
      }

      imported += data?.length ?? batch.length;
      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      options?.onProgress?.(15 + Math.round((batchIndex / totalBatches) * 80));
    }

    await supabase
      .from("whatsapp_import_batches")
      .update({
        imported,
        duplicates,
        errors: errorDetails.length,
        error_details: errorDetails.slice(0, MAX_ERROR_DETAILS),
        status: "completed",
      })
      .eq("id", batchId);

    options?.onProgress?.(100);

    return {
      batchId,
      totalRows: parsed.length,
      imported,
      duplicates,
      errors: errorDetails.length,
      errorDetails,
    };
  } catch (error) {
    await markBatchFailed(batchId, errorDetails);
    throw error;
  }
}

/** @deprecated Use importContactsFromFile */
export async function importContactsFromCsv(
  file: File,
  options?: ImportContactsOptions,
): Promise<ImportContactsResult> {
  return importContactsFromFile(file, options);
}
