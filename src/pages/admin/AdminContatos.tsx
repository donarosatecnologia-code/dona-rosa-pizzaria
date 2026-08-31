import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Upload, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ContactTagsEditor } from "@/components/admin/contatos/ContactTagsEditor";
import { ContactStatusBadge } from "@/components/admin/contatos/ContactStatusBadge";
import { DeleteContactDialog } from "@/components/admin/contatos/DeleteContactDialog";
import { ImportContactsModal } from "@/components/admin/contatos/ImportContactsModal";
import { ImportHistoryCard } from "@/components/admin/contatos/ImportHistoryCard";
import { ListPagination } from "@/components/admin/ListPagination";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LIST_PAGE_SIZE } from "@/hooks/usePagedItems";
import { useWhatsappContactsPage, useUpdateWhatsappContactStatus } from "@/hooks/whatsapp";
import { useDeleteWhatsappContact } from "@/hooks/whatsapp/useWhatsappBusinessHours";
import { useQaHomologacaoContactIds } from "@/hooks/whatsapp/useWhatsappContactTags";
import { formatPhoneDisplay } from "@/lib/format-phone";

function formatLastCampaign(at: string | null): string {
  if (!at) {
    return "—";
  }
  return new Date(at).toLocaleDateString("pt-BR");
}

const QA_TAG_SLUG = "qa-homologacao";

export default function AdminContatos() {
  const { data: qaIds } = useQaHomologacaoContactIds();
  const qaContactIds = qaIds ?? [];
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [isPurgingQa, setIsPurgingQa] = useState(false);
  const updateStatus = useUpdateWhatsappContactStatus();
  const deleteContact = useDeleteWhatsappContact();

  const { data, isLoading, error } = useWhatsappContactsPage({
    page,
    search,
    excludeContactIds: qaContactIds,
    pageSize: LIST_PAGE_SIZE,
  });

  const pageItems = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

  async function handleOptOut(contactId: string) {
    try {
      await updateStatus.mutateAsync({ contactId, status: "opted_out" });
      toast.success("Cliente marcado como não quer receber.");
    } catch {
      toast.error("Não deu para atualizar. Tente de novo.");
    }
  }

  async function handlePurgeQaContacts() {
    if (qaContactIds.length === 0) {
      return;
    }
    const confirmed = window.confirm(
      `Excluir ${qaContactIds.length} contato(s) de teste da homologação? Não dá para desfazer.`,
    );
    if (!confirmed) {
      return;
    }

    setIsPurgingQa(true);
    let removed = 0;
    try {
      for (const contactId of qaContactIds) {
        await deleteContact.mutateAsync({
          contactId,
          reason: "Limpeza pós-homologação QA",
        });
        removed += 1;
      }
      toast.success(`${removed} contato(s) de teste removido(s).`);
    } catch {
      toast.error(
        removed > 0
          ? `${removed} removido(s), mas falhou no restante. Rode db:deploy e tente de novo.`
          : "Não deu para excluir os contatos de teste. Rode db:deploy e tente de novo.",
      );
    } finally {
      setIsPurgingQa(false);
    }
  }

  return (
    <AdminPageShell width="lg" className="max-md:pb-2">
      <AdminPageHeader
        title="Contatos"
        description="Importe sua lista e organize com etiquetas e segmentos para campanhas."
        icon={Users}
        actions={
          <Button onClick={() => setImportOpen(true)} className="shrink-0 min-h-[44px] w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            Importar lista
          </Button>
        }
      />

      <div className="mb-4 grid max-md:grid-cols-2 gap-2 w-full min-w-0 md:flex md:flex-wrap text-sm">
        <Button variant="outline" size="sm" className="min-h-[44px] max-md:w-full" asChild>
          <Link to="/admin/etiquetas">Etiquetas</Link>
        </Button>
        <Button variant="outline" size="sm" className="min-h-[44px] max-md:w-full" asChild>
          <Link to="/admin/segmentos">Segmentos</Link>
        </Button>
      </div>

      <ImportHistoryCard />

      {qaContactIds.length > 0 && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
          <AlertTitle>Contatos de teste ocultos</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>
              {qaContactIds.length} número(s) de homologação não aparecem na lista do dia a dia.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="min-h-[44px] shrink-0 border-amber-400 text-amber-950 hover:bg-amber-100"
              disabled={isPurgingQa || deleteContact.isPending}
              onClick={() => void handlePurgeQaContacts()}
            >
              {isPurgingQa ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir contatos de teste
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="relative mb-4 w-full min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 min-h-[44px]"
          placeholder="Buscar nome ou telefone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">
            Não foi possível carregar os contatos. Tente novamente.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && total === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Nenhum contato ainda</p>
            <p>Importe uma lista CSV ou Excel (.xlsx) para começar.</p>
            <Button className="mt-4 min-h-[44px]" variant="secondary" onClick={() => setImportOpen(true)}>
              Importar lista
            </Button>
          </CardContent>
        </Card>
      )}

      {pageItems.length > 0 && (
        <>
          <div className="md:hidden space-y-3 w-full min-w-0">
            {pageItems.map((contact) => (
              <Card key={contact.id} className="w-full min-w-0 overflow-hidden rounded-xl max-md:shadow-sm">
                <CardContent className="p-0 min-w-0">
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-base leading-snug truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatPhoneDisplay(contact.phone_number)}
                        </p>
                      </div>
                      <ContactStatusBadge status={contact.status} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Último envio</dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {formatLastCampaign(contact.last_outbound_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Cadastro</dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {new Date(contact.created_at).toLocaleDateString("pt-BR")}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  {contact.status === "active" && (
                    <div className="border-t bg-muted/25 px-4 py-3 pb-4 space-y-2.5">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Classificar
                      </p>
                      <ContactTagsEditor contact={contact} compact fullWidth />
                      <div className="flex flex-col gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-[44px] w-full"
                          disabled={updateStatus.isPending}
                          onClick={() => void handleOptOut(contact.id)}
                        >
                          Não quer receber mensagens
                        </Button>
                        <DeleteContactDialog contactId={contact.id} contactName={contact.name} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Último envio</TableHead>
                  <TableHead>Etiquetas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{formatPhoneDisplay(contact.phone_number)}</TableCell>
                    <TableCell>
                      <ContactStatusBadge status={contact.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatLastCampaign(contact.last_outbound_at)}
                    </TableCell>
                    <TableCell>
                      {contact.status === "active" ? (
                        <ContactTagsEditor contact={contact} compact />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {contact.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs min-h-[44px]"
                            disabled={updateStatus.isPending}
                            onClick={() => handleOptOut(contact.id)}
                          >
                            Não quer receber
                          </Button>
                          <DeleteContactDialog contactId={contact.id} contactName={contact.name} />
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            label="contato(s)"
          />
        </>
      )}

      <ImportContactsModal open={importOpen} onOpenChange={setImportOpen} />
    </AdminPageShell>
  );
}
