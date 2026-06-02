import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BrandTomilho } from "@/components/BrandAccents";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/FormFieldError";
import { MaskedEmailInput } from "@/components/MaskedEmailInput";
import { useFieldErrors } from "@/hooks/useFieldErrors";
import { emailField } from "@/lib/form-validation";
import logoSmall from "@/assets/logo-small.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { validate, clearField, getError, showError } = useFieldErrors<"email">();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = emailField(email);
    if (!validate(emailErr ? { email: emailErr } : {})) {
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      toast.error("Não deu para enviar o e-mail. Confira o endereço e tente de novo.");
      return;
    }
    setSent(true);
    toast.success("Se o e-mail existir, você receberá o link em instantes.");
  }

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <BrandTomilho className="absolute right-6 top-24 h-20 w-auto opacity-[0.12] hidden md:block" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoSmall} alt="Dona Rosa" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <div className="rounded-2xl border p-6 shadow-sm bg-background">
          {sent ? (
            <p className="text-sm text-muted-foreground text-center">
              Verifique sua caixa de entrada e siga o link do e-mail.
            </p>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <FormFieldError
                label={<Label htmlFor="recover-email">E-mail</Label>}
                error={getError("email")}
                showError={showError("email")}
              >
                <MaskedEmailInput
                  id="recover-email"
                  value={email}
                  onChange={(value) => {
                    clearField("email");
                    setEmail(value);
                  }}
                  className="min-h-[44px]"
                />
              </FormFieldError>
              <Button type="submit" disabled={loading} className="w-full min-h-[44px]">
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center mt-4">
          <Link to="/login" className="text-sm text-primary hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
