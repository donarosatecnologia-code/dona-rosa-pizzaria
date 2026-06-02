/** Tipos inbox WhatsApp — notificações, horário, fila. */

export type WhatsappNotificationEventType =
  | "inbound_message"
  | "queue_new"
  | "template_approved"
  | "template_rejected"
  | "campaign_completed";

export interface WhatsappAdminNotification {
  id: string;
  event_type: WhatsappNotificationEventType;
  title: string;
  body: string | null;
  href: string | null;
  conversation_id: string | null;
  template_id: string | null;
  campaign_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  is_read?: boolean;
}

export interface WhatsappBusinessHoursDay {
  id: number;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsappContactDeletionAudit {
  id: string;
  phone_number: string;
  name: string | null;
  deleted_by: string | null;
  deleted_at: string;
  reason: string | null;
  contact_snapshot: Record<string, unknown>;
}

export interface SendMessageResult {
  ok: boolean;
  dry_run?: boolean;
  message_id?: string;
  conversation_id?: string;
  error?: string;
  message?: string;
}

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function getDayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? `Dia ${dayOfWeek}`;
}

/** Verifica se agora está fora do expediente configurado (America/Sao_Paulo). */
export function isOutsideBusinessHours(
  hours: WhatsappBusinessHoursDay[],
  now = new Date(),
): boolean {
  const tz = "America/Sao_Paulo";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "0";
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[weekday] ?? now.getDay();
  const nowMinutes = Number(hour) * 60 + Number(minute);

  const schedule = hours.find((h) => h.day_of_week === dayOfWeek);
  if (!schedule || !schedule.is_open || !schedule.open_time || !schedule.close_time) {
    return true;
  }

  const [openH, openM] = schedule.open_time.split(":").map(Number);
  const [closeH, closeM] = schedule.close_time.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60;
    if (nowMinutes >= openMinutes) {
      return false;
    }
    return nowMinutes > closeMinutes - 24 * 60;
  }

  return nowMinutes < openMinutes || nowMinutes > closeMinutes;
}

export function isServiceWindowOpen(lastInboundAt: string | null | undefined): boolean {
  if (!lastInboundAt) {
    return false;
  }
  const expires = new Date(lastInboundAt).getTime() + 24 * 60 * 60 * 1000;
  return Date.now() < expires;
}

export function getServiceWindowExpiresAt(lastInboundAt: string | null | undefined): Date | null {
  if (!lastInboundAt) {
    return null;
  }
  return new Date(new Date(lastInboundAt).getTime() + 24 * 60 * 60 * 1000);
}

export function isWaitingForReply(conversation: {
  status: string;
  last_message_direction?: string | null;
}): boolean {
  return (
    conversation.status !== "closed" &&
    conversation.last_message_direction === "inbound"
  );
}
