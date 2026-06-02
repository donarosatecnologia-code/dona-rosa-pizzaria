/** Configuração fixa do site — WhatsApp e dados institucionais. */

export const SITE_WHATSAPP = {
  /** Dígitos E.164 sem + (Brasil) */
  e164: "5511930617116",
  display: "(11) 93061-7116",
  defaultMessage: "Olá! Gostaria de saber mais sobre a Dona Rosa Pizzaria.",
} as const;

export function buildWhatsAppUrl(text?: string): string {
  const message = text?.trim() || SITE_WHATSAPP.defaultMessage;
  return `https://wa.me/${SITE_WHATSAPP.e164}?text=${encodeURIComponent(message)}`;
}

export const SITE_BUSINESS = {
  name: "Dona Rosa Pizzaria",
  legalName: "Dona Rosa Pizzaria",
  url: "https://www.donarosa.com.br",
  locale: "pt_BR",
  language: "pt-BR",
  email: "contato@donarosa.com.br",
  phone: SITE_WHATSAPP.display,
  phoneE164: SITE_WHATSAPP.e164,
  address: {
    street: "Rua Caminha de Amorim, 242",
    neighborhood: "Vila Madalena",
    city: "São Paulo",
    state: "SP",
    postalCode: "05451-020",
    country: "BR",
  },
  geo: {
    latitude: -23.5505,
    longitude: -46.6934,
  },
  cuisine: ["Pizza artesanal", "Cozinha italiana", "Massa integral"],
  priceRange: "$$",
  openingHours: [
    { days: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "18:00", closes: "23:30" },
    { days: ["Sunday"], opens: "18:00", closes: "23:00" },
  ],
} as const;
