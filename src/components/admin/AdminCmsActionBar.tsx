import { AdminEditToolbar } from "@/components/AdminEditToolbar";
import { cn } from "@/lib/utils";

interface AdminCmsActionBarProps {
  className?: string;
}

/** Barra de Salvar / Publicar / Preview — abaixo do título, alinhada à direita. */
export function AdminCmsActionBar({ className }: AdminCmsActionBarProps) {
  return (
    <div className={cn("flex justify-end", className)}>
      <AdminEditToolbar align="end" />
    </div>
  );
}
