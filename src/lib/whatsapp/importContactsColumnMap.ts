/** Cabeçalhos da planilha de clientes (csv/xlsx) e aliases legados. */

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

export interface ParsedImportRow {
  line: number;
  name: string;
  phoneRaw: string;
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
  "qtd total compras",
  "qtd total de compras",
  "quantidade compras",
];
const PURCHASE_TOTAL_HEADERS = [
  "total r$ compras",
  "total r compras",
  "total rs compras",
  "total compras",
  "valor total compras",
];
const REGISTERED_AT_HEADERS = ["data cadastro", "data de cadastro", "cadastro"];
const LAST_PURCHASE_HEADERS = ["ultima compra", "última compra", "data ultima compra"];
const DAYS_WITHOUT_PURCHASE_PREFIX = "dias sem comprar";

export function normalizeSpreadsheetHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/_/g, " ")
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

function buildFullAddress(parts: {
  logr: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
}): string | undefined {
  const line1 = [parts.logr, parts.street, parts.number].filter(Boolean).join(" ");
  const line2 = [parts.complement, parts.neighborhood].filter(Boolean).join(" — ");
  const full = [line1, line2].filter(Boolean).join(", ");
  return full || undefined;
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
  const daysWithoutIdx = detectColumnByPrefix(headers, DAYS_WITHOUT_PURCHASE_PREFIX);

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
    const purchaseCount = cellValue(cols, purchaseCountIdx);
    const purchaseTotal = cellValue(cols, purchaseTotalIdx);
    const registeredAt = cellValue(cols, registeredAtIdx);
    const lastPurchaseAt = cellValue(cols, lastPurchaseIdx);
    const daysWithoutPurchase = cellValue(cols, daysWithoutIdx);

    const profile: ContactImportProfile = {
      ...(logr ? { logr } : {}),
      ...(street ? { street } : {}),
      ...(addressNumber ? { address_number: addressNumber } : {}),
      ...(complement ? { complement } : {}),
      ...(neighborhood ? { neighborhood } : {}),
      ...(purchaseCount ? { purchase_count: purchaseCount } : {}),
      ...(purchaseTotal ? { purchase_total: purchaseTotal } : {}),
      ...(registeredAt ? { registered_at: registeredAt } : {}),
      ...(lastPurchaseAt ? { last_purchase_at: lastPurchaseAt } : {}),
      ...(daysWithoutPurchase ? { days_without_purchase: daysWithoutPurchase } : {}),
    };

    const fullAddress = buildFullAddress({
      logr,
      street,
      number: addressNumber,
      complement,
      neighborhood,
    });
    if (fullAddress) {
      profile.full_address = fullAddress;
    }

    parsed.push({
      line: i + 1,
      name: nameIdx >= 0 ? cellValue(cols, nameIdx) : "",
      phoneRaw,
      profile,
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
