import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { AdminPermissionsEditor } from "@/components/admin/AdminPermissionsEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AppScrollArea } from "@/components/ui/app-scroll-area";
import {
  useAdminUsers,
  useResendAdminInvite,
  useUpdateAdminUser,
} from "@/hooks/useAdminUsers";
import { useAdminProfile } from "@/hooks/useAdminProfile";
import { useCanManageUsers } from "@/hooks/useFilteredAdminNav";
import { type AdminPermissionsMap, normalizePermissions } from "@/lib/adminPermissions";

export default function AdminEquipeEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canManage = useCanManageUsers();
  const { data: profile } = useAdminProfile();
  const { data: users, isLoading } = useAdminUsers();
  const updateUser = useUpdateAdminUser();
  const resendInvite = useResendAdminInvite();

  const user = users?.find((u) => u.id === id);
  const isSelf = profile?.id === user?.id;

  const [fullName, setFullName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<AdminPermissionsMap>(normalizePermissions({}));
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    setFullName(user.full_name);
    setIsActive(user.is_active);
    setPermissions(user.permissions);
  }, [user]);

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground px-4 lg:px-0">
        Você não tem permissão para editar a equipe.
      </p>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full max-w-2xl mx-auto" />;
  }

  if (!user) {
    return (
      <div className="px-4 lg:px-0 max-w-2xl mx-auto space-y-3">
        <p className="text-muted-foreground text-sm">Usuário não encontrado.</p>
        <Button variant="outline" asChild>
          <Link to="/admin/equipe">Voltar</Link>
        </Button>
      </div>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !fullName.trim()) {
      toast.error("Informe o nome.");
      return;
    }
    try {
      await updateUser.mutateAsync({
        id: user.id,
        full_name: fullName.trim(),
        is_active: user.is_super_admin ? undefined : isActive,
        permissions: user.is_super_admin ? undefined : permissions,
      });
      toast.success("Salvo!");
      navigate("/admin/equipe");
    } catch {
      toast.error("Não deu para salvar.");
    }
  }

  async function handleResend() {
    try {
      const result = await resendInvite.mutateAsync(user.id);
      setTempPassword(result.temp_password);
      toast.success(result.email_sent ? "E-mail reenviado!" : "Nova senha gerada — copie abaixo.");
    } catch {
      toast.error("Não deu para reenviar.");
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

      <div className="px-4 lg:px-0 mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Editar usuário</h1>
        {user.is_super_admin && <Badge>Super admin</Badge>}
        {isSelf && <Badge variant="outline">Você</Badge>}
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="flex min-h-0 flex-1 flex-col">
        <AppScrollArea className="flex-1 min-h-0 px-4 lg:px-0">
          <div className="space-y-6 pb-6">
            <div className="space-y-4 rounded-xl border bg-background p-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="min-h-[44px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input id="edit-email" value={user.email} disabled className="min-h-[44px] bg-muted" />
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
              </div>

              {!user.is_super_admin && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="edit-active">Usuário ativo</Label>
                  <Switch id="edit-active" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              )}

              {!user.is_super_admin && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full min-h-[44px]"
                  disabled={resendInvite.isPending}
                  onClick={() => void handleResend()}
                >
                  {resendInvite.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Reenviar convite / nova senha
                    </>
                  )}
                </Button>
              )}
            </div>

            {!user.is_super_admin && (
              <AdminPermissionsEditor value={permissions} onChange={setPermissions} />
            )}

            {user.is_super_admin && (
              <p className="text-sm text-muted-foreground rounded-lg border p-4 bg-muted/30">
                Como super admin, você pode alterar seu nome aqui ou em Minha conta. Permissões e exclusão não se aplicam.
              </p>
            )}

            {tempPassword && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 space-y-2">
                <p className="font-medium">Nova senha temporária:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all">{tempPassword}</code>
                  <Button type="button" size="icon" variant="outline" className="h-11 w-11" onClick={copyTempPassword}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </AppScrollArea>

        <div className="shrink-0 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" className="min-h-[44px] sm:flex-1" asChild>
            <Link to="/admin/equipe">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={updateUser.isPending} className="min-h-[44px] sm:flex-1">
            {updateUser.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
