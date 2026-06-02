import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useClearMustChangePassword } from "@/hooks/useAdminProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormFieldError } from "@/components/FormFieldError";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { passwordMatchField, passwordMinField, requiredField } from "@/lib/form-validation";

type ForcePasswordField = "password" | "confirm";

export default function AdminForceChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const clearMustChange = useClearMustChangePassword();
  const { validate, clearField, getError, showError } = useFieldErrors<ForcePasswordField>();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Partial<Record<ForcePasswordField, string>> = {};
    const passwordErr = passwordMinField(password);
    if (passwordErr) {
      errors.password = passwordErr;
    }
    const confirmRequired = requiredField(confirm, "Confirme sua senha.");
    if (confirmRequired) {
      errors.confirm = confirmRequired;
    } else {
      const matchErr = passwordMatchField(password, confirm);
      if (matchErr) {
        errors.confirm = matchErr;
      }
    }
    if (!validate(errors)) {
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      setLoading(false);
      toast.error("Não deu para atualizar. Tente de novo.");
      return;
    }

    try {
      await clearMustChange.mutateAsync();
    } catch {
      // segue mesmo se a flag falhar
    }

    setLoading(false);
    toast.success("Senha atualizada! Bem-vinda de volta.");
    window.location.href = "/admin/dashboard";
  }

  return (
    <div className="max-w-md mx-auto px-4 lg:px-0">
      <Card>
        <CardHeader>
          <CardTitle>Troque sua senha</CardTitle>
          <CardDescription>
            Por segurança, defina uma senha nova antes de continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <FormFieldError
              label={<Label htmlFor="force-password">Nova senha</Label>}
              error={getError("password")}
              showError={showError("password")}
            >
              <div className="relative">
                <Input
                  id="force-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    clearField("password");
                    setPassword(e.target.value);
                  }}
                  minLength={8}
                  className="min-h-[44px] pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </FormFieldError>
            <FormFieldError
              label={<Label htmlFor="force-confirm">Confirmar senha</Label>}
              error={getError("confirm")}
              showError={showError("confirm")}
            >
              <Input
                id="force-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => {
                  clearField("confirm");
                  setConfirm(e.target.value);
                }}
                minLength={8}
                className="min-h-[44px]"
              />
            </FormFieldError>
            <Button type="submit" disabled={loading} className="w-full min-h-[44px]">
              {loading ? "Salvando..." : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
