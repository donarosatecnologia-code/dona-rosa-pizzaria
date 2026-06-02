export interface NormalizePhoneResult {
  normalized: string | null;
  valid: boolean;
  reason?: string;
}

/** Normaliza telefone BR para E.164 sem + (ex.: 5511999998888). */
export function normalizeBrazilPhone(input: string): NormalizePhoneResult {
  let digits = input.replace(/\D/g, "");

  if (digits.length === 0) {
    return { normalized: null, valid: false, reason: "número vazio" };
  }

  if (!digits.startsWith("55")) {
    if (digits.length >= 10 && digits.length <= 11) {
      digits = `55${digits}`;
    } else {
      return { normalized: null, valid: false, reason: "formato inválido" };
    }
  }

  const national = digits.slice(2);

  if (national.length === 10) {
    digits = `55${national.slice(0, 2)}9${national.slice(2)}`;
  }

  const finalNational = digits.slice(2);
  if (finalNational.length < 10 || finalNational.length > 11) {
    return { normalized: null, valid: false, reason: "tamanho inválido após normalização" };
  }

  return { normalized: digits, valid: true };
}

/** Mascara telefone para exibição em relatórios (+55119****8888). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) {
    return phone;
  }
  const prefix = digits.slice(0, 5);
  const suffix = digits.slice(-4);
  return `+${prefix}****${suffix}`;
}
