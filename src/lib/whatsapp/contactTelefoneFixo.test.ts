import { describe, expect, it } from "vitest";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";
import {
  canInteractViaWhatsapp,
  isTelefoneFixoContact,
} from "@/lib/whatsapp/contactTelefoneFixo";

function baseContact(overrides: Partial<WhatsappContact> = {}): WhatsappContact {
  return {
    id: "1",
    name: "Cliente",
    phone_number: "5511999998888",
    email: null,
    status: "active",
    opted_out_at: null,
    terms_accepted_at: null,
    terms_accepted_source: null,
    terms_prompt_sent_at: null,
    import_batch_id: null,
    import_profile: null,
    is_landline: false,
    engagement_level: "unknown",
    last_inbound_at: null,
    last_outbound_at: null,
    inbound_count: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("isTelefoneFixoContact", () => {
  it("marca telefone fixo (10 dígitos nacionais, sem 9 após DDD)", () => {
    expect(isTelefoneFixoContact(baseContact({ phone_number: "551133334444" }))).toBe(true);
  });

  it("não marca celular/WhatsApp (9 após DDD)", () => {
    expect(isTelefoneFixoContact(baseContact({ phone_number: "5511999998888" }))).toBe(false);
  });

  it("não marca importado só por ter vindo da planilha", () => {
    expect(
      isTelefoneFixoContact(
        baseContact({
          phone_number: "5511999998888",
          import_batch_id: "batch-1",
          terms_accepted_source: "csv_import",
        }),
      ),
    ).toBe(false);
  });

  it("não marca contato que já interagiu via WhatsApp", () => {
    expect(
      isTelefoneFixoContact(
        baseContact({ phone_number: "551133334444", inbound_count: 1, last_inbound_at: "2026-02-01" }),
      ),
    ).toBe(false);
  });
});

describe("canInteractViaWhatsapp", () => {
  it("bloqueia interação para telefone fixo ativo", () => {
    expect(canInteractViaWhatsapp(baseContact({ phone_number: "551133334444" }))).toBe(false);
  });

  it("permite interação para celular ativo", () => {
    expect(canInteractViaWhatsapp(baseContact({ phone_number: "5511999998888" }))).toBe(true);
  });
});
