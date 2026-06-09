import { describe, expect, it } from "vitest";
import {
  BROADCAST_COST_PER_MESSAGE_BRL,
  estimateBroadcastCost,
  formatBroadcastCostBrl,
} from "./broadcastCost";

describe("broadcastCost", () => {
  it("calcula custo por contato", () => {
    expect(estimateBroadcastCost(10)).toBe(10 * BROADCAST_COST_PER_MESSAGE_BRL);
    expect(estimateBroadcastCost(0)).toBe(0);
  });

  it("formata em BRL", () => {
    expect(formatBroadcastCostBrl(1)).toContain("0,35");
    expect(formatBroadcastCostBrl(100)).toContain("35");
  });
});
