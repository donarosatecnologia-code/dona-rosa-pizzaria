import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Upload, Search, Trash2, Loader2, Send, Eye } from "lucide-react";
import { toast } from "sonner";
import { ContactTagsEditor } from "@/components/admin/contatos/ContactTagsEditor";
import { DeleteContactDialog } from "@/components/admin/contatos/DeleteContactDialog";
import { ImportContactsModal } from "@/components/admin/contatos/ImportContactsModal";
import { ImportHistoryCard } from "@/components/admin/contatos/ImportHistoryCard";
import { SendActiveMessageDialog } from "@/components/admin/disparos/SendActiveMessageDialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LIST_PAGE_SIZE } from "@/hooks/usePagedItems";
import { useWhatsappContactsPage, useUpdateWhatsappContactStatus } from "@/hooks/whatsapp";
import { useWhatsappTags } from "@/hooks/whatsapp/useWhatsappTags";
import { useDeleteWhatsappContact } from "@/hooks/whatsapp/useWhatsappBusinessHours";
import { useQaHomologacaoContactIds } from "@/hooks/whatsapp/useWhatsappContactTags";
import { useRefreshContactPurchaseTagsOnPage } from "@/hooks/whatsapp/useRefreshContactPurchaseTags";
import { formatPhoneDisplay } from "@/lib/format-phone";
import {
  canInteractViaWhatsapp,
  TELEFONE_FIXO_TAG_NAME,
  TELEFONE_FIXO_TAG_SLUG,
} from "@/lib/whatsapp/contactTelefoneFixo";
import {
  formatContactDate,
  getDaysWithoutPurchase,
  getRegisteredAtDisplay,
} from "@/lib/whatsapp/contactCrm";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";

const QA_TAG_SLUG = "qa-homologacao";

function ContactListMetrics({ contact }: { contact: WhatsappContact }) {
  const days = getDaysWithoutPurchase(contact.last_purchase_at);
  return (
    <>
      <TableCell className="text-xs text-center">
        {contact.purchase_count ?? "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {getRegisteredAtDisplay(contact.registered_at, contact.created_at)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatContactDate(contact.last_purchase_at)}
      </TableCell>
      <TableCell className="text-xs text-center">
        {days != null ? days : "—"}
      </TableCell>
    </>
  );
}

export default function AdminContatos() {
  useRefreshContactPurchaseTagsOnPage();
  const { data: qaIds } = useQaHomologacaoContactIds();
  const { data: allTags } = useWhatsappTags();
  const qaContactIds = qaIds ?? [];
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tagFilterSlug, setTagFilterSlug] = useState("all");
  const [page, setPage] = useState(0);
  const [isPurgingQa, setIsPurgingQa] = useState(false);
  const [activeMessageContactId, setActiveMessageContactId] = useState<string | null>(null);
  const updateStatus = useUpdateWhatsappContactStatus();
  const deleteContact = useDeleteWhatsappContact();

  const tagFilter = useMemo(() => {
    if (tagFilterSlug === "all") {
      return null;
    }

    const tag = allTags?.find((item) => item.slug === tagFilterSlug);
    return { slug: tagFilterSlug, tagId: tag?.id };
  }, [allTags, tagFilterSlug]);

  const filterTags = useMemo(() => {
    const tags = (allTags ?? []).filter((tag) => tag.slug !== QA_TAG_SLUG);
    const hasTelefoneFixo = tags.some((tag) => tag.slug === TELEFONE_FIXO_TAG_SLUG);

    if (!hasTelefoneFixo) {
      tags.push({
        id: TELEFONE_FIXO_TAG_SLUG,
        name: TELEFONE_FIXO_TAG_NAME,
        slug: TELEFONE_FIXO_TAG_SLUG,
        description: null,
        color: "#64748b",
        is_system: true,
        created_at: "",
      });
    }

    return tags.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [allTags]);

  const { data, isLoading, isFetching, error } = useWhatsappContactsPage({
    page,
    search,
    excludeContactIds: qaContactIds,
    pageSize: LIST_PAGE_SIZE,
    tagFilter,
  });

  const pageItems = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));
  const hasLoadedOnce = data !== undefined;
  const showContactList = hasLoadedOnce && total > 0;

  useEffect(() => {
    if (isFetching || !hasLoadedOnce) {
      return;
    }
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages, isFetching, hasLoadedOnce]);

  function handlePageChange(nextPage: number) {
    const maxPage = Math.max(0, totalPages - 1);
    setPage(Math.max(0, Math.min(nextPage, maxPage)));
  }

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
        description="Importe sua lista, consulte endereços e histórico de compras dos clientes."
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

      <div className="mb-4 grid gap-3 w-full min-w-0 md:grid-cols-2">
        <div className="relative w-full min-w-0">
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
        <Select
          value={tagFilterSlug}
          onValueChange={(value) => {
            setTagFilterSlug(value);
            setPage(0);
          }}
        >
          <SelectTrigger className="min-h-[44px] w-full">
            <SelectValue placeholder="Filtrar por etiqueta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etiquetas</SelectItem>
            {filterTags.map((tag) => (
              <SelectItem key={tag.slug} value={tag.slug}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && !hasLoadedOnce && (
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

      {!isLoading && !error && hasLoadedOnce && total === 0 && (
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

      {showContactList && (
        <div className={isFetching ? "opacity-60 pointer-events-none" : undefined}>
          <div className="md:hidden space-y-3 w-full min-w-0">
            {pageItems.map((contact) => {
              const whatsappEnabled = canInteractViaWhatsapp(contact);
              return (
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
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Cadastro</dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {getRegisteredAtDisplay(contact.registered_at, contact.created_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Últ. compra</dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {formatContactDate(contact.last_purchase_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Compras</dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {contact.purchase_count ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Dias s/ compra</dt>
                        <dd className="font-medium text-foreground mt-0.5">
                          {getDaysWithoutPurchase(contact.last_purchase_at) ?? "—"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  {contact.status === "active" && (
                    <div className="border-t bg-muted/25 px-4 py-3 pb-4 space-y-2.5">
                      <Button size="sm" variant="outline" className="min-h-[44px] w-full" asChild>
                        <Link to={`/admin/contatos/${contact.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </Link>
                      </Button>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Classificar
                      </p>
                      <ContactTagsEditor contact={contact} compact fullWidth />
                      {whatsappEnabled ? (
                        <div className="flex flex-col gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="min-h-[44px] w-full"
                            onClick={() => setActiveMessageContactId(contact.id)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Mensagem ativa
                          </Button>
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
                      ) : (
                        <p className="text-xs text-muted-foreground pt-1">
                          Contato só para consulta — sem interação via WhatsApp.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Compras</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Últ. compra</TableHead>
                  <TableHead>Dias s/ compra</TableHead>
                  <TableHead>Etiquetas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((contact) => {
                  const whatsappEnabled = canInteractViaWhatsapp(contact);
                  return (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium whitespace-nowrap">{contact.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatPhoneDisplay(contact.phone_number)}</TableCell>
                    <ContactListMetrics contact={contact} />
                    <TableCell>
                      <ContactTagsEditor contact={contact} compact />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5 flex-wrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs shrink-0"
                          asChild
                        >
                          <Link to={`/admin/contatos/${contact.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Link>
                        </Button>
                        {contact.status === "active" && whatsappEnabled && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs shrink-0"
                              onClick={() => setActiveMessageContactId(contact.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Ativa
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs shrink-0"
                              disabled={updateStatus.isPending}
                              onClick={() => handleOptOut(contact.id)}
                            >
                              Não quer receber
                            </Button>
                            <DeleteContactDialog
                              contactId={contact.id}
                              contactName={contact.name}
                              compact
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </div>

          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={handlePageChange}
            isFetching={isFetching}
            label="contato(s)"
          />
        </div>
      )}

      <ImportContactsModal open={importOpen} onOpenChange={setImportOpen} />

      <SendActiveMessageDialog
        open={Boolean(activeMessageContactId)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveMessageContactId(null);
          }
        }}
        initialContactId={activeMessageContactId ?? undefined}
      />
    </AdminPageShell>
  );
}
