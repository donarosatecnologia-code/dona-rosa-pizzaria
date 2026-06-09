import { useState } from "react";
import { ChevronDown, FileSpreadsheet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWhatsappImportBatches } from "@/hooks/whatsapp/useWhatsappImportBatches";
import type { WhatsappImportBatch } from "@/integrations/supabase/types/whatsapp-broadcast";

const PREVIEW_LIMIT = 3;
const DIALOG_LIMIT = 20;

function statusLabel(status: string): string {
  if (status === "completed") {
    return "Concluída";
  }
  if (status === "failed") {
    return "Falhou";
  }
  return "Processando";
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") {
    return "outline";
  }
  if (status === "failed") {
    return "destructive";
  }
  return "secondary";
}

function formatBatchSummary(batch: WhatsappImportBatch): string {
  const parts = [`${batch.imported} novos`];
  if (batch.duplicates > 0) {
    parts.push(`${batch.duplicates} dup.`);
  }
  if (batch.errors > 0) {
    parts.push(`${batch.errors} erros`);
  }
  return parts.join(" · ");
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "hoje";
  }
  if (diffDays === 1) {
    return "ontem";
  }
  if (diffDays < 7) {
    return `há ${diffDays} dias`;
  }
  return date.toLocaleDateString("pt-BR");
}

function ImportBatchRow({ batch, showErrors = false }: { batch: WhatsappImportBatch; showErrors?: boolean }) {
  return (
    <>
      <TableRow>
        <TableCell className="font-medium max-w-[140px] truncate" title={batch.filename ?? undefined}>
          {batch.filename ?? "Importação"}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(batch.created_at).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant(batch.status)} className="text-[10px]">
            {statusLabel(batch.status)}
          </Badge>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {batch.imported}/{batch.total_rows}
          {batch.duplicates > 0 ? ` · ${batch.duplicates} dup.` : ""}
          {batch.errors > 0 ? ` · ${batch.errors} erros` : ""}
        </TableCell>
      </TableRow>
      {showErrors && batch.errors > 0 && batch.error_details?.length > 0 && (
        <TableRow>
          <TableCell colSpan={4} className="text-xs text-muted-foreground bg-muted/30 py-2">
            <p className="font-medium text-foreground mb-1">Primeiros erros:</p>
            <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
              {batch.error_details.slice(0, 5).map((err, i) => (
                <li key={i}>
                  Linha {err.line}: {err.reason}
                </li>
              ))}
              {batch.error_details.length > 5 && (
                <li>… e mais {batch.error_details.length - 5} erro(s)</li>
              )}
            </ul>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function ImportHistoryCard() {
  const { data: previewBatches, isLoading: loadingPreview } = useWhatsappImportBatches(PREVIEW_LIMIT);
  const { data: allBatches, isLoading: loadingAll } = useWhatsappImportBatches(DIALOG_LIMIT);

  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loadingPreview) {
    return <Skeleton className="h-12 w-full rounded-xl" />;
  }

  if (!previewBatches?.length) {
    return null;
  }

  const latest = previewBatches[0];

  return (
    <>
      <Collapsible open={expanded} onOpenChange={setExpanded} className="mb-4 w-full min-w-0">
        <Card className="w-full min-w-0 max-md:rounded-xl">
          <CardContent className="py-3 px-4 min-w-0">
            <div className="flex flex-col gap-3 min-w-0 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-2">
              <div className="flex items-start gap-2 min-w-0 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">Última importação</p>
                  <p className="text-muted-foreground text-xs mt-0.5 break-words">
                    {latest.filename ?? "arquivo"} · {formatBatchSummary(latest)} ·{" "}
                    {formatRelativeDate(latest.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full min-w-0 md:w-auto md:shrink-0">
                {previewBatches.length > 1 && (
                  <CollapsibleTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-9 text-xs max-md:flex-1 min-h-[44px]">
                      {expanded ? "Recolher" : `+${previewBatches.length - 1} recente(s)`}
                      <ChevronDown
                        className={`h-3 w-3 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 text-xs max-md:flex-1 min-h-[44px]"
                  onClick={() => setDialogOpen(true)}
                >
                  Ver histórico
                </Button>
              </div>
            </div>

            <CollapsibleContent className="mt-3">
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewBatches.map((batch) => (
                      <ImportBatchRow key={batch.id} batch={batch} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Histórico de importações</DialogTitle>
            <DialogDescription>
              Últimas {DIALOG_LIMIT} importações. Detalhes de erro só aparecem quando necessário.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 -mx-2 px-2">
            {loadingAll && <Skeleton className="h-32 w-full" />}
            {!loadingAll && allBatches && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBatches.map((batch) => (
                    <ImportBatchRow key={batch.id} batch={batch} showErrors />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
