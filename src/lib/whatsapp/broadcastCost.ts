/** Custo estimado por mensagem de template (conversa iniciada pela empresa). */
export const BROADCAST_COST_PER_MESSAGE_BRL = 0.35;

export function formatBroadcastCostBrl(contactCount: number): string {
  const total = contactCount * BROADCAST_COST_PER_MESSAGE_BRL;
  return total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function estimateBroadcastCost(contactCount: number): number {
  return contactCount * BROADCAST_COST_PER_MESSAGE_BRL;
}
