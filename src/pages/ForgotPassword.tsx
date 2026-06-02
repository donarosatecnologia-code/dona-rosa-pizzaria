import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BrandTomilho } from "@/components/BrandAccents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoSmall from "@/assets/logo-small.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
              <div className="space-y-2">
                <Label htmlFor="recover-email">E-mail</Label>
                <Input
                  id="recover-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="min-h-[44px]"
                  placeholder="seu@email.com"
                />
              </div>
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
