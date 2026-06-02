import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionsEditor } from "@/components/admin/AdminPermissionsEditor";
import { FormFieldError } from "@/components/FormFieldError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import { useInviteAdminUser } from "@/hooks/useAdminUsers";
import { useCanManageUsers } from "@/hooks/useFilteredAdminNav";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { emailField, requiredField } from "@/lib/form-validation";
import {
  createEmptyPermissions,
  createFullPermissions,
  type AdminPermissionsMap,
} from "@/lib/adminPermissions";

export default function AdminEquipeConvidar() {
  const navigate = useNavigate();
  const canManage = useCanManageUsers();
  const invite = useInviteAdminUser();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<AdminPermissionsMap>(createEmptyPermissions());
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const { validate, clearField, getError, showError } = useFieldErrors<"fullName" | "email">();

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground px-4 lg:px-0">
        Você não tem permissão para convidar pessoas.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Partial<Record<"fullName" | "email", string>> = {};
    const nameErr = requiredField(fullName, "Informe o nome.");
    if (nameErr) {
      errors.fullName = nameErr;
    }
    const emailErr = emailField(email);
    if (emailErr) {
      errors.email = emailErr;
    }
    if (!validate(errors)) {
      return;
    }
    try {
      const result = await invite.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        permissions,
      });
      setTempPassword(result.temp_password);
      toast.success(
        result.email_sent
          ? "Convite enviado por e-mail!"
          : "Usuário criado. Copie a senha temporária abaixo.",
      );
    } catch {
      toast.error("Não deu para convidar. Verifique se o e-mail já existe.");
    }
  }

  function copyTempPassword() {
    if (!tempPassword) {
      return;
    }
    void navigator.clipboard.writeText(tempPassword);
    toast.success("Senha copiada!");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col max-w-2xl mx-auto w-full">
      <Link
        to="/admin/equipe"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 px-4 lg:px-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para equipe
      </Link>

      <div className="px-4 lg:px-0 mb-4">
        <h1 className="text-xl sm:text-2xl font-bold">Convidar pessoa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sem cadastro público — só quem receber convite entra no painel.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
        <AppScrollArea className="flex-1 min-h-0 px-4 lg:px-0">
          <div className="space-y-6 pb-6">
            <div className="space-y-4 rounded-xl border bg-background p-4">
              <FormFieldError
                label={<Label htmlFor="invite-name">Nome</Label>}
                error={getError("fullName")}
                showError={showError("fullName")}
              >
                <Input
                  id="invite-name"
                  value={fullName}
                  onChange={(e) => {
                    clearField("fullName");
                    setFullName(e.target.value);
                  }}
                  className="min-h-[44px]"
                  placeholder="Ex.: Maria Silva"
                />
              </FormFieldError>
              <FormFieldError
                label={<Label htmlFor="invite-email">E-mail</Label>}
                error={getError("email")}
                showError={showError("email")}
              >
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    clearField("email");
                    setEmail(e.target.value);
                  }}
                  className="min-h-[44px]"
                  placeholder="nome@email.com"
                />
              </FormFieldError>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">Permissões</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={() => setPermissions(createFullPermissions())}
                  >
                    Marcar tudo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={() => setPermissions(createEmptyPermissions())}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
              <AdminPermissionsEditor value={permissions} onChange={setPermissions} />
            </div>

            {tempPassword && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 space-y-2">
                <p className="font-medium">Senha temporária (mostrada uma vez):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all text-base">{tempPassword}</code>
                  <Button type="button" size="icon" variant="outline" className="shrink-0 h-11 w-11" onClick={copyTempPassword}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button type="button" variant="outline" className="w-full min-h-[44px] mt-2" onClick={() => navigate("/admin/equipe")}>
                  Concluir
                </Button>
              </div>
            )}
          </div>
        </AppScrollArea>

        {!tempPassword && (
          <div className="shrink-0 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" className="min-h-[44px] sm:flex-1" asChild>
              <Link to="/admin/equipe">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={invite.isPending} className="min-h-[44px] sm:flex-1">
              {invite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar convite"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
