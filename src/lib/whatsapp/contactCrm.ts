/** Formatação e cálculos de campos cadastrais do cliente. */

export function getDaysWithoutPurchase(lastPurchaseAt: string | null | undefined): number | null {
  if (!lastPurchaseAt) {
    return null;
  }

  const last = parseLocalDate(lastPurchaseAt);
  const today = startOfLocalDay(new Date());
  const diffMs = today.getTime() - last.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export function formatContactDate(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "—";
  }

  const parsed = parseLocalDate(isoDate);
  return parsed.toLocaleDateString("pt-BR");
}

export function formatContactDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) {
    return "—";
  }

  if (isoDate.includes("T")) {
    return new Date(isoDate).toLocaleString("pt-BR");
  }

  return formatContactDate(isoDate);
}

export function getRegisteredAtDisplay(
  registeredAt: string | null | undefined,
  createdAt: string,
): string {
  return formatContactDate(registeredAt ?? createdAt.slice(0, 10));
}

function parseLocalDate(isoDate: string): Date {
  const datePart = isoDate.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

export function isoDateTodayInSaoPaulo(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
