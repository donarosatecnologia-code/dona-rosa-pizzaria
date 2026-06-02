import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAdminProfile, useUpdateMyProfile } from "@/hooks/useAdminProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMinhaConta() {
  const { data: profile, isLoading } = useAdminProfile();
  const updateProfile = useUpdateMyProfile();
  const { updatePassword } = useAuth();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Informe seu nome.");
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile.mutateAsync(fullName.trim());
      toast.success("Nome atualizado!");
    } catch {
      toast.error("Não deu para salvar. Tente de novo.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setSavingPassword(true);
    const { error } = await updatePassword(password);
    setSavingPassword(false);
    if (error) {
      toast.error("Não deu para alterar a senha.");
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Senha alterada!");
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full max-w-lg" />;
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold">Minha conta</h1>
          {profile?.is_super_admin && <Badge>Super admin</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Atualize seu nome e senha. O e-mail não pode ser alterado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seus dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={profile?.email ?? ""} disabled className="min-h-[44px] bg-muted" />
          </div>
          <form onSubmit={(e) => void handleSaveName(e)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="my-name">Nome</Label>
              <Input
                id="my-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <Button type="submit" disabled={savingProfile} className="min-h-[44px]">
              {savingProfile ? "Salvando..." : "Salvar nome"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar senha</CardTitle>
          <CardDescription>Mínimo de 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSavePassword(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="my-password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="my-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-[44px] pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="my-confirm">Confirmar senha</Label>
              <Input
                id="my-confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
            <Button type="submit" disabled={savingPassword} className="min-h-[44px]">
              {savingPassword ? "Salvando..." : "Atualizar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
