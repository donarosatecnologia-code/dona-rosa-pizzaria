import { useMemo, useState } from "react";
import { Users, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import { ContactStatusBadge } from "@/components/admin/contatos/ContactStatusBadge";
import { DeleteContactDialog } from "@/components/admin/contatos/DeleteContactDialog";
import { ImportContactsModal } from "@/components/admin/contatos/ImportContactsModal";
import { ImportHistoryCard } from "@/components/admin/contatos/ImportHistoryCard";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useWhatsappContacts, useUpdateWhatsappContactStatus } from "@/hooks/whatsapp";
import { formatPhoneDisplay } from "@/lib/format-phone";

const PAGE_SIZE = 50;

function formatLastCampaign(at: string | null): string {
  if (!at) {
    return "—";
  }
  return new Date(at).toLocaleDateString("pt-BR");
}

export default function AdminContatos() {
  const { data: contacts, isLoading, error } = useWhatsappContacts();
  const updateStatus = useUpdateWhatsappContactStatus();
  const [importOpen, setImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!contacts) {
      return [];
    }
    if (!q) {
      return contacts;
    }
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone_number.includes(q.replace(/\D/g, "")),
    );
  }, [contacts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  async function handleOptOut(contactId: string) {
    try {
      await updateStatus.mutateAsync({ contactId, status: "opted_out" });
      toast.success("Cliente marcado como não quer receber.");
    } catch {
      toast.error("Não deu para atualizar. Tente de novo.");
    }
  }

  return (
    <AdminPageShell width="lg">
      <AdminPageHeader
        title="Contatos"
        description="Importe sua lista de clientes para disparar campanhas pelo WhatsApp."
        icon={Users}
        actions={
          <Button onClick={() => setImportOpen(true)} className="shrink-0 min-h-[44px] w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            Importar lista
          </Button>
        }
      />

      <ImportHistoryCard />

      <div className="relative mb-4">
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

      {!isLoading && !error && filtered.length === 0 && (
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
          <div className="md:hidden space-y-3">
            {pageItems.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{formatPhoneDisplay(contact.phone_number)}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <ContactStatusBadge status={contact.status} />
                        <span className="text-xs text-muted-foreground">
                          Último envio: {formatLastCampaign(contact.last_outbound_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {contact.status === "active" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-[44px] flex-1"
                        disabled={updateStatus.isPending}
                        onClick={() => void handleOptOut(contact.id)}
                      >
                        Não quer receber
                      </Button>
                      <DeleteContactDialog contactId={contact.id} contactName={contact.name} />
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

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm">
            <p className="text-muted-foreground">
              {filtered.length} contato(s) · página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="min-h-[44px] flex-1 sm:flex-none" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="min-h-[44px] flex-1 sm:flex-none"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}

      <ImportContactsModal open={importOpen} onOpenChange={setImportOpen} />
    </AdminPageShell>
  );
}
