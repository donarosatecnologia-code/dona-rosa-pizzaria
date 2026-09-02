import { supabase } from "@/integrations/supabase/client";
import {
  hasImportProfileData,
  parseContactsSpreadsheet,
} from "@/lib/whatsapp/importContactsParse";
import type { ContactCrmFields, ParsedImportRow } from "@/lib/whatsapp/importContactsColumnMap";
import {
  isLandlineFromImportDigits,
  phoneDigitsFromImportRaw,
  validateImportPhoneDigits,
} from "@/lib/whatsapp/importPhone";
import { normalizeBrazilPhone } from "@/lib/whatsapp/normalizePhone";

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
  updated: number;
  duplicates: number;
  errors: number;
  errorDetails: ImportRowError[];
}

export interface ImportContactsOptions {
  onProgress?: (percent: number) => void;
  /** Marca consentimento LGPD para contatos novos (necessário para disparos). */
  confirmTermsConsent?: boolean;
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
    isLandline: boolean;
    crm: ContactCrmFields;
    profile: ParsedImportRow["profile"];
  }> = [];
  const errorDetails: ImportRowError[] = [];

  for (const row of parsed) {
    const phone = phoneDigitsFromImportRaw(row.phoneRaw);
    const validation = validateImportPhoneDigits(phone);
    if (!validation.valid) {
      errorDetails.push({
        line: row.line,
        value: row.phoneRaw,
        reason: validation.reason ?? "formato inválido",
      });
      continue;
    }

    validRows.push({
      line: row.line,
      name: row.name || phone,
      phone,
      isLandline: isLandlineFromImportDigits(phone),
      crm: row.crm,
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
  const existingByPhone = new Map<string, string>();

  for (let i = 0; i < phones.length; i += 500) {
    const chunk = phones.slice(i, i + 500);
    const { data } = await supabase
      .from("whatsapp_contacts")
      .select("phone_number, id")
      .in("phone_number", chunk);
    for (const row of data ?? []) {
      existingByPhone.set(row.phone_number, row.id);
    }
  }

  options?.onProgress?.(15);

  const toInsert = uniqueValidRows.filter((r) => !existingByPhone.has(r.phone));
  const toUpdate = uniqueValidRows.filter((r) => existingByPhone.has(r.phone));
  const duplicates = fileDuplicates;

  let imported = 0;
  let updated = 0;

  const nowIso = new Date().toISOString();
  const termsFields = options?.confirmTermsConsent
    ? {
        terms_accepted_at: nowIso,
        terms_accepted_source: "csv_import" as const,
      }
    : {};

  function buildImportFields(
    r: typeof uniqueValidRows[number],
  ): Record<string, unknown> {
    return {
      name: r.name,
      status: "active" as const,
      import_batch_id: batchId,
      is_landline: r.isLandline,
      address_street: r.crm.addressStreet,
      address_number: r.crm.addressNumber,
      address_complement: r.crm.addressComplement,
      address_neighborhood: r.crm.addressNeighborhood,
      purchase_count: r.crm.purchaseCount,
      purchase_total: r.crm.purchaseTotal,
      registered_at: r.crm.registeredAt,
      last_purchase_at: r.crm.lastPurchaseAt,
      ...termsFields,
      ...(hasImportProfileData(r.profile) ? { import_profile: r.profile } : {}),
    };
  }

  try {
    const allUpsertRows = uniqueValidRows.map((r) => {
      const normalized = normalizeBrazilPhone(r.phone);
      const phoneNumber =
        normalized.valid && normalized.normalized ? normalized.normalized : r.phone;

      return {
        phone_number: phoneNumber,
        ...buildImportFields(r),
      };
    });

    for (let i = 0; i < allUpsertRows.length; i += BATCH_SIZE) {
      const batch = allUpsertRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from("whatsapp_contacts")
        .upsert(batch, { onConflict: "phone_number" });

      if (error) {
        throw error;
      }

      const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
      const totalUpsertBatches = Math.max(1, Math.ceil(allUpsertRows.length / BATCH_SIZE));
      options?.onProgress?.(15 + Math.round((batchIndex / totalUpsertBatches) * 80));
    }

    imported = toInsert.length;
    updated = toUpdate.length;

    const { error: relinkError } = await supabase.rpc("relink_whatsapp_conversations_for_phones", {
      p_phones: phones,
    });

    if (relinkError) {
      throw relinkError;
    }

    const { error: mergeError } = await supabase.rpc("merge_whatsapp_contact_duplicates");
    if (mergeError) {
      throw mergeError;
    }

    await supabase
      .from("whatsapp_import_batches")
      .update({
        imported: imported + updated,
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
      updated,
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
