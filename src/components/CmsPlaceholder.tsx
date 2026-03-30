interface CmsPlaceholderProps {
  label?: string;
  className?: string;
}

/**
 * Exibido quando não há conteúdo publicado no Supabase para o bloco (sem mock no código).
 */
export function CmsPlaceholder({ label = "Conteúdo a configurar", className = "" }: CmsPlaceholderProps) {
  return (
    <div
      className={`rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground ${className}`}
      role="status"
    >
      {label}
    </div>
  );
}
