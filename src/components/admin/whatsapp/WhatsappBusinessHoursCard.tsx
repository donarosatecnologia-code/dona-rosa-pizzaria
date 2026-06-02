import { useState } from "react";
import { toast } from "sonner";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useUpdateWhatsappBusinessHours,
  useWhatsappBusinessHours,
} from "@/hooks/whatsapp/useWhatsappBusinessHours";
import { getDayLabel } from "@/integrations/supabase/types/whatsapp-inbox";

export function WhatsappBusinessHoursCard() {
  const { data: hours, isLoading } = useWhatsappBusinessHours();
  const update = useUpdateWhatsappBusinessHours();

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Horário de atendimento WhatsApp
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Apenas informativo na fila de conversas — não bloqueia envio de mensagens.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {hours?.map((day) => (
          <BusinessHoursRow
            key={day.day_of_week}
            day={day}
            onSave={(input) => {
              update.mutate(input, {
                onSuccess: () => toast.success("Horário salvo."),
                onError: () => toast.error("Não foi possível salvar."),
              });
            }}
            isSaving={update.isPending}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function BusinessHoursRow({
  day,
  onSave,
  isSaving,
}: {
  day: {
    day_of_week: number;
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  };
  onSave: (input: {
    day_of_week: number;
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
  }) => void;
  isSaving: boolean;
}) {
  const [isOpen, setIsOpen] = useState(day.is_open);
  const [openTime, setOpenTime] = useState(day.open_time?.slice(0, 5) ?? "18:00");
  const [closeTime, setCloseTime] = useState(day.close_time?.slice(0, 5) ?? "23:30");

  return (
    <div className="flex flex-wrap items-center gap-3 py-2 border-b last:border-0">
      <span className="w-24 text-sm font-medium">{getDayLabel(day.day_of_week)}</span>
      <Switch checked={isOpen} onCheckedChange={setIsOpen} aria-label={`Aberto ${getDayLabel(day.day_of_week)}`} />
      {isOpen ? (
        <>
          <Input
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            className="w-28 h-8 text-sm"
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            type="time"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
            className="w-28 h-8 text-sm"
          />
        </>
      ) : (
        <span className="text-sm text-muted-foreground">Fechado</span>
      )}
      <Button
        size="sm"
        variant="outline"
        className="ml-auto"
        disabled={isSaving}
        onClick={() =>
          onSave({
            day_of_week: day.day_of_week,
            is_open: isOpen,
            open_time: isOpen ? `${openTime}:00` : null,
            close_time: isOpen ? `${closeTime}:00` : null,
          })
        }
      >
        Salvar
      </Button>
    </div>
  );
}
