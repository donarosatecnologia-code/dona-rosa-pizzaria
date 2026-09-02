import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { ContactTagsEditor } from "@/components/admin/contatos/ContactTagsEditor";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWhatsappContact,
  useUpdateWhatsappContact,
} from "@/hooks/whatsapp/useWhatsappContactDetail";
import { useWhatsappConversationsByContact } from "@/hooks/whatsapp/useWhatsappConversations";
import { formatPhoneDisplay, formatRelativeTime } from "@/lib/format-phone";
import {
  formatContactDate,
  getDaysWithoutPurchase,
  getRegisteredAtDisplay,
} from "@/lib/whatsapp/contactCrm";
import type { WhatsappContact } from "@/integrations/supabase/types/whatsapp-broadcast";

interface ContactFormState {
  name: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  purchase_count: string;
  purchase_total: string;
  last_purchase_at: string;
}

function contactToForm(contact: WhatsappContact): ContactFormState {
  return {
    name: contact.name,
    address_street: contact.address_street ?? "",
    address_number: contact.address_number ?? "",
    address_complement: contact.address_complement ?? "",
    address_neighborhood: contact.address_neighborhood ?? "",
    purchase_count: contact.purchase_count != null ? String(contact.purchase_count) : "",
    purchase_total: contact.purchase_total != null ? String(contact.purchase_total) : "",
    last_purchase_at: contact.last_purchase_at ?? "",
  };
}

export default function AdminContatoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: contact, isLoading, error } = useWhatsappContact(id);
  const { data: conversations, isLoading: conversationsLoading } =
    useWhatsappConversationsByContact(id, contact?.phone_number);
  const updateContact = useUpdateWhatsappContact();
  const [form, setForm] = useState<ContactFormState | null>(null);

  useEffect(() => {
    if (contact) {
      setForm(contactToForm(contact));
    }
  }, [contact]);

  const daysWithoutPurchase = useMemo(
    () => getDaysWithoutPurchase(form?.last_purchase_at || contact?.last_purchase_at),
    [form?.last_purchase_at, contact?.last_purchase_at],
  );

  async function handleSave() {
    if (!id || !form) {
      return;
    }

    const purchaseCount = form.purchase_count.trim()
      ? Number.parseInt(form.purchase_count.replace(/\D/g, ""), 10)
      : null;
    const purchaseTotal = form.purchase_total.trim()
      ? Number.parseFloat(form.purchase_total.replace(",", "."))
      : null;

    try {
      await updateContact.mutateAsync({
        contactId: id,
        patch: {
          name: form.name.trim() || contact?.phone_number || "Cliente",
          address_street: form.address_street.trim() || null,
          address_number: form.address_number.trim() || null,
          address_complement: form.address_complement.trim() || null,
          address_neighborhood: form.address_neighborhood.trim() || null,
          purchase_count: Number.isFinite(purchaseCount) ? purchaseCount : null,
          purchase_total: Number.isFinite(purchaseTotal) ? purchaseTotal : null,
          last_purchase_at: form.last_purchase_at || null,
        },
      });
      toast.success("Dados salvos.");
    } catch {
      toast.error("Não deu para salvar. Tente de novo.");
    }
  }

  if (isLoading || !form) {
    return (
      <AdminPageShell width="lg">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </AdminPageShell>
    );
  }

  if (error || !contact) {
    return (
      <AdminPageShell width="lg">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link to="/admin/contatos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para clientes
          </Link>
        </Button>
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">
            Cliente não encontrado.
          </CardContent>
        </Card>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell width="lg">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to="/admin/contatos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Clientes
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">{contact.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatPhoneDisplay(contact.phone_number)}
          </p>
        </div>
        <Button
          className="min-h-[44px] shrink-0"
          disabled={updateContact.isPending}
          onClick={() => void handleSave()}
        >
          {updateContact.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar alterações
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados cadastrais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nome</Label>
              <Input
                id="contact-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="min-h-[44px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-street">Endereço</Label>
                <Input
                  id="contact-street"
                  value={form.address_street}
                  onChange={(e) => setForm({ ...form, address_street: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-number">Número</Label>
                <Input
                  id="contact-number"
                  value={form.address_number}
                  onChange={(e) => setForm({ ...form, address_number: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-complement">Complemento</Label>
                <Input
                  id="contact-complement"
                  value={form.address_complement}
                  onChange={(e) => setForm({ ...form, address_complement: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contact-neighborhood">Bairro</Label>
                <Input
                  id="contact-neighborhood"
                  value={form.address_neighborhood}
                  onChange={(e) => setForm({ ...form, address_neighborhood: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-purchase-count">Total de compras</Label>
                <Input
                  id="contact-purchase-count"
                  inputMode="numeric"
                  value={form.purchase_count}
                  onChange={(e) => setForm({ ...form, purchase_count: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-purchase-total">Total R$ compras</Label>
                <Input
                  id="contact-purchase-total"
                  inputMode="decimal"
                  value={form.purchase_total}
                  onChange={(e) => setForm({ ...form, purchase_total: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data de cadastro</Label>
                <Input
                  readOnly
                  disabled
                  value={getRegisteredAtDisplay(contact.registered_at, contact.created_at)}
                  className="min-h-[44px] bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-last-purchase">Data da última compra</Label>
                <Input
                  id="contact-last-purchase"
                  type="date"
                  value={form.last_purchase_at}
                  onChange={(e) => setForm({ ...form, last_purchase_at: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Dias sem comprar</Label>
                <Input
                  readOnly
                  disabled
                  value={daysWithoutPurchase != null ? String(daysWithoutPurchase) : "—"}
                  className="min-h-[44px] bg-muted"
                />
              </div>
            </div>

            {contact.status === "active" && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Etiquetas
                </p>
                <ContactTagsEditor contact={contact} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Histórico de conversas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversationsLoading && (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}

            {!conversationsLoading && (!conversations || conversations.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Nenhuma conversa registrada para este cliente.
              </p>
            )}

            {!conversationsLoading && conversations && conversations.length > 0 && (
              <ul className="space-y-2">
                {conversations.map((conversation) => {
                  const preview = conversation.whatsapp_messages?.at(-1);
                  return (
                    <li key={conversation.id}>
                      <Link
                        to={`/admin/conversas/${conversation.id}`}
                        className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium capitalize">
                            {conversation.status === "closed" ? "Atendida" : "Aberta"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {conversation.last_message_at
                              ? formatRelativeTime(conversation.last_message_at)
                              : "—"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {preview?.body_text?.trim() || "Sem mensagens de texto"}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
