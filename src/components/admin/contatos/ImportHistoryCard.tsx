import { FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWhatsappImportBatches } from "@/hooks/whatsapp/useWhatsappImportBatches";

function statusLabel(status: string): string {
  if (status === "completed") {
    return "Concluída";
  }
  if (status === "failed") {
    return "Falhou";
  }
  return "Processando";
}

export function ImportHistoryCard() {
  const { data: batches, isLoading, error } = useWhatsappImportBatches(5);

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  if (error || !batches?.length) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          Últimas importações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {batches.map((batch) => (
          <div
            key={batch.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm border-b last:border-0 pb-2 last:pb-0"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{batch.filename ?? "Importação"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(batch.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              {statusLabel(batch.status)} · {batch.imported} novos
              {batch.duplicates > 0 ? ` · ${batch.duplicates} dup.` : ""}
              {batch.errors > 0 ? ` · ${batch.errors} erros` : ""}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
