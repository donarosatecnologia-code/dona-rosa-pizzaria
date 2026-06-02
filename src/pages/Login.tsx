import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BrandTomilho } from "@/components/BrandAccents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/FormFieldError";
import { MaskedEmailInput } from "@/components/MaskedEmailInput";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { emailField, requiredField } from "@/lib/form-validation";
import logoSmall from "@/assets/logo-small.png";

type LoginField = "email" | "password";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { validate, clearField, getError, showError } = useFieldErrors<LoginField>();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const errors: Partial<Record<LoginField, string>> = {};
    const emailErr = emailField(email);
    if (emailErr) {
      errors.email = emailErr;
    }
    const passwordErr = requiredField(password, "Informe sua senha.");
    if (passwordErr) {
      errors.password = passwordErr;
    }
    if (!validate(errors)) {
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setAuthError("E-mail ou senha incorretos. Tente de novo.");
    } else {
      navigate("/admin/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center px-4 py-10">
      <BrandTomilho className="absolute right-6 top-24 h-20 w-auto opacity-[0.12] hidden md:block" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoSmall} alt="Dona Rosa" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Painel administrativo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Acesso só para quem foi convidado pela equipe.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {authError && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{authError}</div>
            )}
            <FormFieldError
              label={<Label htmlFor="login-email">E-mail</Label>}
              error={getError("email")}
              showError={showError("email")}
            >
              <MaskedEmailInput
                id="login-email"
                name="username"
                autoComplete="username email"
                value={email}
                onChange={(value) => {
                  clearField("email");
                  setEmail(value);
                }}
                className="min-h-[44px]"
              />
            </FormFieldError>
            <FormFieldError
              label={
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Link to="/recuperar-senha" className="text-xs text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
              }
              error={getError("password")}
              showError={showError("password")}
            >
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    clearField("password");
                    setPassword(e.target.value);
                  }}
                  className="min-h-[44px] pr-11"
                  placeholder="Sua senha"
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
            <Button type="submit" disabled={loading} className="w-full min-h-[44px] btn-primary-dr">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Não há cadastro público. Peça um convite ao administrador.
        </p>
      </div>
    </div>
  );
};

export default Login;
