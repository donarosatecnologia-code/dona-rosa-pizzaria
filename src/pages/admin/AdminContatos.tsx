import { useMemo, useState } from "react";
import { Users, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import { ContactStatusBadge } from "@/components/admin/contatos/ContactStatusBadge";
import { DeleteContactDialog } from "@/components/admin/contatos/DeleteContactDialog";
import { ImportContactsModal } from "@/components/admin/contatos/ImportContactsModal";
import { WhatsappDevBanner } from "@/components/admin/whatsapp/WhatsappDevBanner";
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
      toast.success("Contato marcado como opt-out.");
    } catch {
      toast.error("Não foi possível atualizar o contato.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Contatos</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Importe sua lista de clientes para disparar campanhas pelo WhatsApp.
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)} className="shrink-0">
          <Upload className="h-4 w-4 mr-2" />
          Importar CSV
        </Button>
      </div>

      <WhatsappDevBanner />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por nome ou telefone..."
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
            <Skeleton key={i} className="h-12 w-full" />
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
            <p>Importe uma lista CSV para começar.</p>
            <Button className="mt-4" variant="secondary" onClick={() => setImportOpen(true)}>
              Importar CSV
            </Button>
          </CardContent>
        </Card>
      )}

      {pageItems.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Cadastro</TableHead>
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
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {contact.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            disabled={updateStatus.isPending}
                            onClick={() => handleOptOut(contact.id)}
                          >
                            Marcar opt-out
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

          <div className="flex items-center justify-between mt-4 text-sm">
            <p className="text-muted-foreground">
              {filtered.length} contato(s) · página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
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
    </div>
  );
}
