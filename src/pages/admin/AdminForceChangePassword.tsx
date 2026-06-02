import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useClearMustChangePassword } from "@/hooks/useAdminProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminForceChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const clearMustChange = useClearMustChangePassword();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
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
            <div className="space-y-2">
              <Label htmlFor="force-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="force-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="force-confirm">Confirmar senha</Label>
              <Input
                id="force-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="min-h-[44px]"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full min-h-[44px]">
              {loading ? "Salvando..." : "Continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
