import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { WhatsappBusinessHoursCard } from "@/components/admin/whatsapp/WhatsappBusinessHoursCard";
import { Button } from "@/components/ui/button";
import { useContactDeletionAudit } from "@/hooks/whatsapp";
import { useCanManageUsers } from "@/hooks/useFilteredAdminNav";

const AdminConfiguracoes = () => {
  const { data: deletionAudit } = useContactDeletionAudit();
  const canManageUsers = useCanManageUsers();

  function exportDeletionAudit() {
    if (!deletionAudit?.length) {
      toast.error("Nenhum registro de exclusão para exportar.");
      return;
    }
    const blob = new Blob([JSON.stringify(deletionAudit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lgpd-exclusoes-contatos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportação concluída.");
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Ajustes</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Horário de atendimento WhatsApp e registros LGPD. Logo, menus e textos do site ficam em{" "}
        <Link to="/admin/header-footer" className="text-primary hover:underline">
          Topo e rodapé
        </Link>
        .
      </p>

      <div className="space-y-4">
        {canManageUsers && (
          <div className="rounded-xl border bg-background p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Equipe do painel</p>
              <p className="text-xs text-muted-foreground">
                Convide pessoas, defina permissões e gerencie acessos.
              </p>
            </div>
            <Button asChild size="sm" className="min-h-[44px]">
              <Link to="/admin/equipe">Gerenciar equipe</Link>
            </Button>
          </div>
        )}
        <WhatsappBusinessHoursCard />
        <div className="rounded-xl border bg-background p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Conexão WhatsApp</p>
            <p className="text-xs text-muted-foreground">
              Vincule o número da pizzaria ao painel (coexistência com o app no celular).
            </p>
          </div>
          <Button asChild size="sm" className="min-h-[44px]">
            <Link to="/admin/conectar-whatsapp">Conectar WhatsApp</Link>
          </Button>
        </div>
        <div className="rounded-xl border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Quem saiu da lista (LGPD)</p>
              <p className="text-xs text-muted-foreground">
                {deletionAudit?.length ?? 0} registro(s) de exclusão permanente.
              </p>
            </div>
            <Button size="sm" variant="outline" className="min-h-[44px]" onClick={exportDeletionAudit}>
              <Download className="h-4 w-4 mr-2" />
              Baixar registro
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConfiguracoes;
