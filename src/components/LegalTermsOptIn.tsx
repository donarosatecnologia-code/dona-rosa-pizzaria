import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LegalTermsOptInProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function LegalTermsOptIn({ id, checked, onCheckedChange, className }: LegalTermsOptInProps) {
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-border/80 bg-muted/30 p-3", className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <Label htmlFor={id} className="cursor-pointer text-xs leading-relaxed font-normal text-foreground">
        Li e concordo com os{" "}
        <Link
          to="/termos-de-uso"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link
          to="/politica-de-privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Política de Privacidade
        </Link>
        .
      </Label>
    </div>
  );
}
