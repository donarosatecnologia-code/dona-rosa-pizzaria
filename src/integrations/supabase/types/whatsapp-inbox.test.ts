import { describe, expect, it } from "vitest";
import { isWaitingForReply } from "./whatsapp-inbox";

describe("isWaitingForReply", () => {
  it("mantém na fila se o cliente pediu e só o bot da pesquisa respondeu (automated)", () => {
    const inbound = "2026-11-12T20:00:00.000Z";
    expect(
      isWaitingForReply({
        status: "open",
        last_inbound_at: inbound,
        last_outbound_at: inbound,
      }),
    ).toBe(false);

    expect(
      isWaitingForReply({
        status: "open",
        last_inbound_at: inbound,
        last_outbound_at: "2026-11-12T19:00:00.000Z",
      }),
    ).toBe(true);
  });
});
