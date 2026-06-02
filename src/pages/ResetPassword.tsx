import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClearMustChangePassword } from "@/hooks/useAdminProfile";
import { BrandTomilho } from "@/components/BrandAccents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/FormFieldError";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { passwordMatchField, passwordMinField, requiredField } from "@/lib/form-validation";
import logoSmall from "@/assets/logo-small.png";

type ResetPasswordField = "password" | "confirm";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const clearMustChange = useClearMustChangePassword();
  const { validate, clearField, getError, showError } = useFieldErrors<ResetPasswordField>();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setReady(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Partial<Record<ResetPasswordField, string>> = {};
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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error("Não deu para atualizar a senha. Tente de novo.");
      return;
    }

    try {
      await clearMustChange.mutateAsync();
    } catch {
      // flag opcional — senha já foi alterada
    }

    toast.success("Senha atualizada!");
    navigate(user ? "/admin/dashboard" : "/login", { replace: true });
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-3">
          <p className="text-muted-foreground text-sm">
            Abra o link que enviamos por e-mail para redefinir sua senha.
          </p>
          <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
            Pedir novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <BrandTomilho className="absolute right-6 top-24 h-20 w-auto opacity-[0.12] hidden md:block" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoSmall} alt="Dona Rosa" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Nova senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha uma senha segura.</p>
        </div>

        <div className="rounded-2xl border p-6 shadow-sm bg-background">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <FormFieldError
              label={<Label htmlFor="new-password">Nova senha</Label>}
              error={getError("password")}
              showError={showError("password")}
            >
              <div className="relative">
                <Input
                  id="new-password"
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
              label={<Label htmlFor="confirm-password">Confirmar senha</Label>}
              error={getError("confirm")}
              showError={showError("confirm")}
            >
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
