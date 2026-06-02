import { Input } from "@/components/ui/input";
import {
  BRAZIL_PHONE_INPUT_PLACEHOLDER,
  maskBrazilPhoneInput,
} from "@/lib/input-masks";
import { cn } from "@/lib/utils";

interface MaskedPhoneInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
> {
  value: string;
  onChange: (value: string) => void;
}

export function MaskedPhoneInput({
  value,
  onChange,
  className,
  placeholder = BRAZIL_PHONE_INPUT_PLACEHOLDER,
  autoComplete = "tel",
  ...props
}: MaskedPhoneInputProps) {
  return (
    <Input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      placeholder={placeholder}
      className={cn(className)}
      value={value}
      onChange={(event) => onChange(maskBrazilPhoneInput(event.target.value))}
    />
  );
}

interface MaskedPhoneFieldProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode"
> {
  value: string;
  onChange: (value: string) => void;
}

/** Campo nativo com a mesma máscara (ex.: widget WhatsApp). */
export function MaskedPhoneField({
  value,
  onChange,
  className,
  placeholder = BRAZIL_PHONE_INPUT_PLACEHOLDER,
  autoComplete = "tel",
  ...props
}: MaskedPhoneFieldProps) {
  return (
    <input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      placeholder={placeholder}
      className={className}
      value={value}
      onChange={(event) => onChange(maskBrazilPhoneInput(event.target.value))}
    />
  );
}
