/** Formata wa_id E.164 para exibição (+55 11 97427-4416). */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    const part1 = rest.length > 4 ? rest.slice(0, rest.length - 4) : rest;
    const part2 = rest.length > 4 ? rest.slice(-4) : "";
    return part2 ? `+55 ${ddd} ${part1}-${part2}` : `+55 ${ddd} ${part1}`;
  }
  if (digits.startsWith("1") && digits.length === 11) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return digits.startsWith("+") ? phone : `+${digits}`;
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) {
    return "agora";
  }
  if (diffMin < 60) {
    return `${diffMin} min`;
  }
  if (diffMin < 1440) {
    return `${Math.floor(diffMin / 60)} h`;
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
