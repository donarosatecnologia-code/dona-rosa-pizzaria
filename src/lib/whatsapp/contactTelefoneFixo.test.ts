import { describe, expect, it } from "vitest";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";
import {
  canInteractViaWhatsapp,
  isTelefoneFixoContact,
} from "@/lib/whatsapp/contactTelefoneFixo";
import { isLandlineStoredPhone } from "@/lib/whatsapp/normalizePhone";

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
    address_street: null,
    address_number: null,
    address_complement: null,
    address_neighborhood: null,
    purchase_count: null,
    purchase_total: null,
    registered_at: null,
    last_purchase_at: null,
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

describe("isLandlineStoredPhone", () => {
  it("marca fixo real da planilha (551138621077)", () => {
    expect(isLandlineStoredPhone("551138621077")).toBe(true);
  });

  it("não marca celular (5511999998888)", () => {
    expect(isLandlineStoredPhone("5511999998888")).toBe(false);
  });

  it("não marca número inválido com 13 dígitos sem 9 após DDD", () => {
    expect(isLandlineStoredPhone("5511763131424")).toBe(false);
  });
});

describe("isTelefoneFixoContact", () => {
  it("marca telefone fixo armazenado", () => {
    expect(isTelefoneFixoContact(baseContact({ phone_number: "551138621077" }))).toBe(true);
  });

  it("não marca celular", () => {
    expect(isTelefoneFixoContact(baseContact({ phone_number: "5511999998888" }))).toBe(false);
  });

  it("não marca importado celular só por ter vindo da planilha", () => {
    expect(
      isTelefoneFixoContact(
        baseContact({
          phone_number: "5511999998888",
          import_batch_id: "batch-1",
        }),
      ),
    ).toBe(false);
  });

  it("não marca número inválido", () => {
    expect(isTelefoneFixoContact(baseContact({ phone_number: "5511763131424" }))).toBe(false);
  });
});

describe("canInteractViaWhatsapp", () => {
  it("bloqueia telefone fixo", () => {
    expect(canInteractViaWhatsapp(baseContact({ phone_number: "551138621077" }))).toBe(false);
  });

  it("permite celular ativo", () => {
    expect(canInteractViaWhatsapp(baseContact({ phone_number: "5511999998888" }))).toBe(true);
  });
});
