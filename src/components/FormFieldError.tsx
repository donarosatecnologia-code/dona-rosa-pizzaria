import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const fieldErrorStyles =
  "[&_input]:border-destructive [&_input]:focus-visible:ring-destructive [&_textarea]:border-destructive [&_textarea]:focus-visible:ring-destructive [&_[role=combobox]]:border-destructive [&_[role=combobox]]:focus-visible:ring-destructive";

interface FormFieldErrorProps {
  label?: React.ReactNode;
  error?: string;
  showError?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Agrupa label + controle e exibe tooltip de erro quando a validação falha. */
export function FormFieldError({
  label,
  error,
  showError = false,
  className,
  children,
}: FormFieldErrorProps) {
  const hasError = showError && !!error;

  return (
    <div className={cn("space-y-2", className)}>
      {label}
      <Tooltip open={hasError}>
        <TooltipTrigger asChild>
          <div
            className={cn("w-full", hasError && fieldErrorStyles)}
            aria-invalid={hasError || undefined}
          >
            {children}
          </div>
        </TooltipTrigger>
        {hasError && (
          <TooltipContent
            side="bottom"
            align="start"
            className="border-destructive/50 bg-destructive text-destructive-foreground max-w-[min(100vw-2rem,20rem)]"
          >
            {error}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
