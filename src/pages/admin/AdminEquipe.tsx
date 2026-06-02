import { Link } from "react-router-dom";
import { Mail, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminUsers,
  useDeleteAdminUser,
  useResendAdminInvite,
} from "@/hooks/useAdminUsers";
import { useCanManageUsers } from "@/hooks/useFilteredAdminNav";

export default function AdminEquipe() {
  const canManage = useCanManageUsers();
  const { data: users, isLoading, error } = useAdminUsers();
  const deleteUser = useDeleteAdminUser();
  const resendInvite = useResendAdminInvite();

  async function handleDelete(id: string, name: string, isSuperAdmin: boolean) {
    if (isSuperAdmin) {
      toast.error("Este usuário não pode ser excluído.");
      return;
    }
    if (!confirm(`Excluir ${name}? Essa ação não tem volta.`)) {
      return;
    }
    try {
      await deleteUser.mutateAsync(id);
      toast.success("Usuário removido.");
    } catch {
      toast.error("Não deu para excluir.");
    }
  }

  async function handleResend(id: string) {
    try {
      const result = await resendInvite.mutateAsync(id);
      toast.success(
        result.email_sent
          ? "E-mail reenviado!"
          : `Nova senha: ${result.temp_password} (copie agora)`,
      );
    } catch {
      toast.error("Não deu para reenviar.");
    }
  }

  if (!canManage) {
    return (
      <AdminPageShell width="md">
        <p className="text-muted-foreground text-sm">
          Você não tem permissão para gerenciar a equipe.
        </p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell width="md" className="space-y-6">
      <AdminPageHeader
        title="Equipe"
        description="Convide pessoas por e-mail. Cada uma recebe senha temporária e redefine no primeiro acesso."
        icon={Users}
        actions={
          <Button asChild className="min-h-[44px]">
            <Link to="/admin/equipe/convidar">
              <Plus className="h-4 w-4 mr-2" />
              Convidar
            </Link>
          </Button>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="pt-6 text-sm text-destructive">
            Não deu para carregar a equipe.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {users?.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium truncate">{user.full_name}</p>
                  {user.is_super_admin && <Badge>Super admin</Badge>}
                  {!user.is_active && <Badge variant="secondary">Inativo</Badge>}
                  {user.must_change_password && <Badge variant="outline">Senha pendente</Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="min-h-[44px] flex-1 sm:flex-none" asChild>
                  <Link to={`/admin/equipe/editar/${user.id}`}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Link>
                </Button>
                {!user.is_super_admin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] flex-1 sm:flex-none"
                      disabled={resendInvite.isPending}
                      onClick={() => void handleResend(user.id)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Reenviar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => void handleDelete(user.id, user.full_name, user.is_super_admin)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
