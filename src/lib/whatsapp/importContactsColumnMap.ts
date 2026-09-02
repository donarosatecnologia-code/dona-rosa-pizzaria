/** Cabeçalhos da planilha de clientes (csv/xlsx) e aliases legados. */

import {
  parseSpreadsheetDateString,
  parseSpreadsheetInteger,
  parseSpreadsheetMoney,
} from "./parseSpreadsheetDate";

/** @deprecated Mantido para compatibilidade; preferir ContactCrmFields. */
export interface ContactImportProfile {
  logr?: string;
  street?: string;
  address_number?: string;
  complement?: string;
  neighborhood?: string;
  purchase_count?: string;
  purchase_total?: string;
  registered_at?: string;
  last_purchase_at?: string;
  days_without_purchase?: string;
  full_address?: string;
}

export interface ContactCrmFields {
  addressStreet: string | null;
  addressNumber: string | null;
  addressComplement: string | null;
  addressNeighborhood: string | null;
  purchaseCount: number | null;
  purchaseTotal: number | null;
  registeredAt: string | null;
  lastPurchaseAt: string | null;
}

export interface ParsedImportRow {
  line: number;
  name: string;
  phoneRaw: string;
  crm: ContactCrmFields;
  /** Legado — espelho parcial para import_profile jsonb. */
  profile: ContactImportProfile;
}

const PHONE_HEADERS = ["telefone1", "telefone", "phone", "cel", "celular", "whatsapp"];
const NAME_HEADERS = ["nome", "name"];
const LOGR_HEADERS = ["logr", "logradouro"];
const STREET_HEADERS = ["endereco", "endereço", "rua"];
const ADDRESS_NUMBER_HEADERS = ["numero", "número", "nro", "nr"];
const COMPLEMENT_HEADERS = ["complemento", "compl"];
const NEIGHBORHOOD_HEADERS = ["bairro"];
const PURCHASE_COUNT_HEADERS = [
  "total compras",
  "qtd total compras",
  "qtd total de compras",
  "quantidade compras",
];
const PURCHASE_TOTAL_HEADERS = [
  "r$ compras",
  "total r$ compras",
  "total r compras",
  "total rs compras",
  "total compras",
  "valor total compras",
];
const REGISTERED_AT_HEADERS = ["data cadastro", "data de cadastro", "cadastro"];
const LAST_PURCHASE_HEADERS = ["ultima compra", "última compra", "data ultima compra"];

export function normalizeSpreadsheetHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectColumnIndex(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeSpreadsheetHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx >= 0) {
      return idx;
    }
  }
  return -1;
}

function detectColumnByPrefix(headers: string[], prefix: string): number {
  const normalized = headers.map(normalizeSpreadsheetHeader);
  const idx = normalized.findIndex((h) => h.startsWith(prefix));
  return idx;
}

function cellValue(cols: string[], index: number): string {
  if (index < 0) {
    return "";
  }
  return (cols[index] ?? "").trim();
}

function buildAddressStreet(logr: string, street: string): string | null {
  const value = [logr, street].filter(Boolean).join(" ").trim();
  return value || null;
}

function buildImportProfile(crm: ContactCrmFields, logr: string): ContactImportProfile {
  const profile: ContactImportProfile = {};

  if (logr) {
    profile.logr = logr;
  }
  if (crm.addressStreet) {
    profile.street = crm.addressStreet;
    profile.full_address = [
      crm.addressStreet,
      crm.addressNumber,
      crm.addressComplement,
      crm.addressNeighborhood,
    ]
      .filter(Boolean)
      .join(", ");
  }
  if (crm.addressNumber) {
    profile.address_number = crm.addressNumber;
  }
  if (crm.addressComplement) {
    profile.complement = crm.addressComplement;
  }
  if (crm.addressNeighborhood) {
    profile.neighborhood = crm.addressNeighborhood;
  }
  if (crm.purchaseCount != null) {
    profile.purchase_count = String(crm.purchaseCount);
  }
  if (crm.purchaseTotal != null) {
    profile.purchase_total = String(crm.purchaseTotal);
  }
  if (crm.registeredAt) {
    profile.registered_at = crm.registeredAt;
  }
  if (crm.lastPurchaseAt) {
    profile.last_purchase_at = crm.lastPurchaseAt;
  }

  return profile;
}

export function mapSpreadsheetRows(rows: string[][]): ParsedImportRow[] {
  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((h) => String(h ?? ""));
  const phoneIdx = detectColumnIndex(headers, PHONE_HEADERS);
  const nameIdx = detectColumnIndex(headers, NAME_HEADERS);

  if (phoneIdx < 0) {
    throw new Error("missing_phone_column");
  }

  const logrIdx = detectColumnIndex(headers, LOGR_HEADERS);
  const streetIdx = detectColumnIndex(headers, STREET_HEADERS);
  const numberIdx = detectColumnIndex(headers, ADDRESS_NUMBER_HEADERS);
  const complementIdx = detectColumnIndex(headers, COMPLEMENT_HEADERS);
  const neighborhoodIdx = detectColumnIndex(headers, NEIGHBORHOOD_HEADERS);
  const purchaseCountIdx = detectColumnIndex(headers, PURCHASE_COUNT_HEADERS);
  const purchaseTotalIdx = detectColumnIndex(headers, PURCHASE_TOTAL_HEADERS);
  const registeredAtIdx = detectColumnIndex(headers, REGISTERED_AT_HEADERS);
  const lastPurchaseIdx = detectColumnIndex(headers, LAST_PURCHASE_HEADERS);

  const parsed: ParsedImportRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].map((c) => String(c ?? ""));
    const phoneRaw = cellValue(cols, phoneIdx);
    if (!phoneRaw) {
      continue;
    }

    const logr = cellValue(cols, logrIdx);
    const street = cellValue(cols, streetIdx);
    const addressNumber = cellValue(cols, numberIdx);
    const complement = cellValue(cols, complementIdx);
    const neighborhood = cellValue(cols, neighborhoodIdx);
    const purchaseCountRaw = cellValue(cols, purchaseCountIdx);
    const purchaseTotalRaw = cellValue(cols, purchaseTotalIdx);
    const registeredAtRaw = cellValue(cols, registeredAtIdx);
    const lastPurchaseAtRaw = cellValue(cols, lastPurchaseIdx);

    const crm: ContactCrmFields = {
      addressStreet: buildAddressStreet(logr, street),
      addressNumber: addressNumber || null,
      addressComplement: complement || null,
      addressNeighborhood: neighborhood || null,
      purchaseCount: purchaseCountRaw
        ? parseSpreadsheetInteger(purchaseCountRaw)
        : null,
      purchaseTotal: purchaseTotalRaw
        ? parseSpreadsheetMoney(purchaseTotalRaw)
        : null,
      registeredAt: parseSpreadsheetDateString(registeredAtRaw),
      lastPurchaseAt: parseSpreadsheetDateString(lastPurchaseAtRaw),
    };

    parsed.push({
      line: i + 1,
      name: nameIdx >= 0 ? cellValue(cols, nameIdx) : "",
      phoneRaw,
      crm,
      profile: buildImportProfile(crm, logr),
    });
  }

  return parsed;
}

export function isXlsxFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel"
  );
}

export function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || file.type === "text/csv" || file.type === "application/csv";
}
