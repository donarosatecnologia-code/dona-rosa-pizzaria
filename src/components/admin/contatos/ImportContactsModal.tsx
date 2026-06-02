import { useRef, useState } from "react";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import { useImportContacts } from "@/hooks/whatsapp";
import type { ImportContactsResult } from "@/lib/whatsapp/importContacts";

interface ImportContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportContactsModal({ open, onOpenChange }: ImportContactsModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportContacts();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportContactsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetState() {
    setFile(null);
    setResult(null);
    setErrorMessage(null);
    importMutation.reset();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetState();
    }
    onOpenChange(next);
  }

  async function handleImport() {
    if (!file) {
      return;
    }
    setErrorMessage(null);
    try {
      const summary = await importMutation.mutateAsync(file);
      setResult(summary);
    } catch (error) {
      const code = error instanceof Error ? error.message : "unknown";
      if (code === "missing_phone_column") {
        setErrorMessage("Não encontramos coluna de telefone. Use telefone, phone ou celular.");
      } else if (code === "empty_csv") {
        setErrorMessage("O arquivo está vazio ou só tem cabeçalho.");
      } else if (code === "too_many_rows") {
        setErrorMessage("O arquivo tem mais de 5.000 linhas. Divida em partes menores.");
      } else {
        setErrorMessage("Não conseguimos ler este arquivo. Verifique se é um .csv válido.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo .csv com coluna de telefone (telefone, phone ou celular). Nome é opcional.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Arraste ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Até 5.000 linhas</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Erro na importação</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground">Como formatar o arquivo?</summary>
              <pre className="mt-2 whitespace-pre-wrap bg-muted p-3 rounded-md text-[11px]">
{`nome,telefone
Maria Silva,11999998888
João Santos,+5511988887777`}
              </pre>
            </details>
          </div>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50 text-green-950">
            <AlertTitle>Importação concluída!</AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
              <p>{result.imported} contato(s) adicionado(s).</p>
              {result.duplicates > 0 && (
                <p>{result.duplicates} número(s) já existentes foram ignorados.</p>
              )}
              {result.errors > 0 && (
                <p>{result.errors} número(s) inválidos foram pulados.</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {result && result.errorDetails.length > 0 && (
          <AppScrollArea className="max-h-32 rounded-md border">
            <ul className="text-xs space-y-1 p-2">
            {result.errorDetails.slice(0, 20).map((err) => (
              <li key={`${err.line}-${err.value}`}>
                Linha {err.line}: {err.value} — {err.reason}
              </li>
            ))}
            {result.errorDetails.length > 20 && (
              <li className="text-muted-foreground">… e mais {result.errorDetails.length - 20} erros</li>
            )}
            </ul>
          </AppScrollArea>
        )}

        <DialogFooter>
          {!result ? (
            <Button onClick={handleImport} disabled={!file || importMutation.isPending}>
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar agora
                </>
              )}
            </Button>
          ) : (
            <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
