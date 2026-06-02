import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import type { ImportContactsResult } from "@/lib/whatsapp/importContacts";

interface ImportSummaryProps {
  result: ImportContactsResult;
}

export function ImportSummary({ result }: ImportSummaryProps) {
  const hasErrors = result.errors > 0;

  return (
    <div className="space-y-3">
      <Alert className={hasErrors ? "border-amber-200 bg-amber-50 text-amber-950" : "border-green-200 bg-green-50 text-green-950"}>
        <AlertTitle>Importação concluída!</AlertTitle>
        <AlertDescription className="space-y-1 text-sm">
          <p>{result.imported} contato(s) adicionado(s).</p>
          <p className="text-muted-foreground">
            {result.totalRows} linha(s) lidas no arquivo.
          </p>
          {result.duplicates > 0 && (
            <p>{result.duplicates} número(s) já existentes foram ignorados.</p>
          )}
          {hasErrors && (
            <p>{result.errors} número(s) inválidos foram pulados. Veja a lista abaixo.</p>
          )}
        </AlertDescription>
      </Alert>

      {hasErrors && result.errorDetails.length > 0 && (
        <AppScrollArea className="max-h-40 rounded-md border">
          <ul className="text-xs space-y-1 p-3">
            {result.errorDetails.slice(0, 20).map((err) => (
              <li key={`${err.line}-${err.value}`}>
                Linha {err.line}: {err.value} — {err.reason}
              </li>
            ))}
            {result.errorDetails.length > 20 && (
              <li className="text-muted-foreground">
                … e mais {result.errorDetails.length - 20} erros
              </li>
            )}
          </ul>
        </AppScrollArea>
      )}
    </div>
  );
}
