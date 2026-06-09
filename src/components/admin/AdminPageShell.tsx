import { cn } from "@/lib/utils";

type AdminPageWidth = "sm" | "md" | "lg" | "xl";

const WIDTH_CLASS: Record<AdminPageWidth, string> = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

interface AdminPageShellProps {
  children: React.ReactNode;
  className?: string;
  width?: AdminPageWidth;
}

/** Container padrão das páginas do backoffice (margem e largura consistentes). */
export function AdminPageShell({
  children,
  className,
  width = "lg",
}: AdminPageShellProps) {
  return (
    <div className={cn(WIDTH_CLASS[width], "mx-auto w-full min-w-0 max-w-full box-border", className)}>
      {children}
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 min-w-0 w-full">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 min-w-0">
          {Icon && <Icon className="h-6 w-6 text-primary shrink-0" />}
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground break-words">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:shrink-0 min-w-0">{actions}</div>
      )}
    </div>
  );
}
