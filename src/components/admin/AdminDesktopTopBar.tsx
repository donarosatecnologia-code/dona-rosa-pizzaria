import { AdminHeaderActions } from "@/components/admin/AdminHeaderActions";

export function AdminDesktopTopBar() {
  return (
    <div className="hidden lg:flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6 -mx-6 -mt-6 mb-4">
      <p className="text-sm font-medium text-muted-foreground">Painel administrativo</p>
      <AdminHeaderActions variant="light" />
    </div>
  );
}
