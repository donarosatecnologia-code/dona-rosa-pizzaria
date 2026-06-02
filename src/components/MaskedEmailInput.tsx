import { Input } from "@/components/ui/input";
import { maskEmailInput } from "@/lib/input-masks";
import { cn } from "@/lib/utils";

interface MaskedEmailInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
> {
  value: string;
  onChange: (value: string) => void;
}

export function MaskedEmailInput({
  value,
  onChange,
  className,
  placeholder = "seu@email.com",
  autoComplete = "email",
  ...props
}: MaskedEmailInputProps) {
  return (
    <Input
      {...props}
      type="email"
      inputMode="email"
      autoComplete={autoComplete}
      placeholder={placeholder}
      className={cn(className)}
      value={value}
      onChange={(event) => onChange(maskEmailInput(event.target.value))}
    />
  );
}
