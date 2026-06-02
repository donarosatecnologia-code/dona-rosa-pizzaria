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
import { Progress } from "@/components/ui/progress";
import { ImportSummary } from "@/components/admin/contatos/ImportSummary";
import { useImportContacts } from "@/hooks/whatsapp";
import type { ImportContactsResult } from "@/lib/whatsapp/importContacts";

interface ImportContactsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACCEPTED_TYPES =
  ".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

export function ImportContactsModal({ open, onOpenChange }: ImportContactsModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportContacts();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportContactsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  function resetState() {
    setFile(null);
    setResult(null);
    setErrorMessage(null);
    setProgress(0);
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
    setProgress(0);
    try {
      const summary = await importMutation.mutateAsync({
        file,
        onProgress: setProgress,
      });
      setResult(summary);
    } catch (error) {
      const code = error instanceof Error ? error.message : "unknown";
      if (code === "missing_phone_column") {
        setErrorMessage(
          "Não encontramos a coluna de telefone. Use TELEFONE1, telefone ou phone no cabeçalho.",
        );
      } else if (code === "empty_file" || code === "empty_csv") {
        setErrorMessage("O arquivo está vazio ou só tem cabeçalho.");
      } else if (code === "too_many_rows") {
        setErrorMessage("O arquivo tem mais de 5.000 linhas. Divida em partes menores.");
      } else if (code === "unsupported_format") {
        setErrorMessage("Formato não suportado. Envie um arquivo .csv ou .xlsx.");
      } else {
        setErrorMessage(
          "Não conseguimos ler este arquivo. Verifique se é .csv ou .xlsx com coluna TELEFONE1 (ou telefone).",
        );
      }
    }
  }

  const isProcessing = importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar clientes</DialogTitle>
          <DialogDescription>
            Selecione um arquivo .csv ou .xlsx com a lista de clientes (coluna TELEFONE1 ou telefone).
          </DialogDescription>
        </DialogHeader>

        {!result && !isProcessing && (
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
                  <p className="text-xs text-muted-foreground mt-1">CSV ou Excel (.xlsx) — até 5.000 linhas</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_TYPES}
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
              <summary className="cursor-pointer font-medium text-foreground">
                Como formatar o arquivo?
              </summary>
              <pre className="mt-2 whitespace-pre-wrap bg-muted p-3 rounded-md text-[11px]">
{`• Formatos: .csv ou .xlsx (primeira aba)
• Coluna TELEFONE1: no Excel, formate como TEXTO antes de colar
  (evita 1,19E+10 e perda de dígitos)
• Aceito: 11999998888, 5511999998888, (11) 99999-8888, +55...
• Nome: coluna NOME (ou name)
• Endereço opcional: LOGR, ENDERECO, NUMERO, COMPLEMENTO, BAIRRO
• Histórico opcional: compras, datas e dias sem comprar`}
              </pre>
            </details>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Importando contatos... isso pode levar alguns segundos.
            </div>
            <Progress value={progress || 8} className="h-2" />
          </div>
        )}

        {result && !isProcessing && <ImportSummary result={result} />}

        <DialogFooter>
          {!result ? (
            <Button onClick={handleImport} disabled={!file || isProcessing}>
              {isProcessing ? (
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
