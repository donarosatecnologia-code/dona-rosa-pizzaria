import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Smartphone,
  Monitor,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminPageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  isEmbeddedSignupConfigured,
  META_APP_ID,
  META_EMBEDDED_SIGNUP_CONFIG_ID,
} from "@/lib/meta-embedded-signup";
import { useMetaEmbeddedSignup } from "@/hooks/whatsapp/useMetaEmbeddedSignup";
import { useWhatsappConnectionStatus } from "@/hooks/whatsapp";
import { useWhatsappEmbeddedSignupComplete } from "@/hooks/whatsapp/useWhatsappEmbeddedSignupComplete";

const SETUP_STEPS = [
  "Meta for Developers → app Dona Rosa Piuzza",
  "Facebook Login for Business → Configurações → Criar configuração",
  "Modelo: WhatsApp Embedded Signup (token 60 dias)",
  "Copie o ID da configuração para VITE_META_EMBEDDED_SIGNUP_CONFIG_ID",
  "Facebook Login for Business → Configurações → Domínios permitidos: donarosapizzaria.com.br e localhost",
];

export default function AdminConectarWhatsapp() {
  const { isConnected, lastWebhookAt, config, isLoading: statusLoading } =
    useWhatsappConnectionStatus();
  const completeSignup = useWhatsappEmbeddedSignupComplete();

  const handleComplete = useCallback(
    async (payload: Parameters<typeof completeSignup.mutateAsync>[0]) => {
      const result = await completeSignup.mutateAsync(payload);
      toast.success(result.message ?? "WhatsApp conectado com sucesso.");
    },
    [completeSignup],
  );

  const { phase, errorMessage, launchSignup, isReady, isLaunching } =
    useMetaEmbeddedSignup({ onComplete: handleComplete });

  const configured = isEmbeddedSignupConfigured();
  const isBusy = isLaunching || completeSignup.isPending;

  return (
    <AdminPageShell width="md">
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
        <Link to="/admin/configuracoes">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar aos ajustes
        </Link>
      </Button>

      <AdminPageHeader
        title="Conectar WhatsApp"
        description="Vincule o número da pizzaria ao painel sem perder o app no celular."
      />

      {!configured && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuração pendente no deploy</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Adicione a variável <code>VITE_META_EMBEDDED_SIGNUP_CONFIG_ID</code> no ambiente
              de produção e faça um novo deploy do site.
            </p>
            <ol className="list-decimal pl-5 text-sm space-y-1">
              {SETUP_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="text-xs pt-1">
              App ID atual: <code>{META_APP_ID}</code>
              {META_EMBEDDED_SIGNUP_CONFIG_ID
                ? ` · Config ID: ${META_EMBEDDED_SIGNUP_CONFIG_ID}`
                : " · Config ID: não definido"}
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertTitle className="text-amber-900">Antes de começar</AlertTitle>
        <AlertDescription className="text-amber-900/90 space-y-2">
          <p>
            No celular da pizzaria, desconecte o <strong>WhatsApp Web</strong> em Configurações →
            Aparelhos conectados. A coexistência funciona melhor com só o app no celular.
          </p>
          <p>
            Mantenha o WhatsApp Business aberto e atualizado (versão 2.24.17 ou superior).
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Neste computador
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Clique em &quot;Iniciar conexão&quot; abaixo.</p>
            <p>2. Faça login com a conta Meta da Dona Rosa.</p>
            <p>3. Escolha <strong>Conectar app WhatsApp Business</strong>.</p>
            <p>4. Informe o número +55 11 93061-7116.</p>
            <p>5. Quando aparecer o QR code, avise quem está no celular.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              No celular da pizzaria
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Abra a conversa do <strong>Facebook Business</strong> / Meta.</p>
            <p>2. Toque em <strong>Conectar</strong> → <strong>Plataforma comercial</strong>.</p>
            <p>3. Escaneie o QR code que está na tela deste computador.</p>
            <p>4. Confirme compartilhar histórico, se pedir.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Status atual</p>
              {statusLoading ? (
                <p className="text-xs text-muted-foreground">Verificando…</p>
              ) : isConnected ? (
                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Webhook ativo
                  {config?.display_name ? ` · ${config.display_name}` : ""}
                </p>
              ) : (
                <p className="text-xs text-amber-700">Aguardando conexão completa</p>
              )}
              {lastWebhookAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Último evento: {new Date(lastWebhookAt).toLocaleString("pt-BR")}
                </p>
              )}
            </div>

            <Button
              type="button"
              size="lg"
              className="min-h-[44px]"
              disabled={!configured || !isReady || isBusy}
              onClick={launchSignup}
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Conectando…
                </>
              ) : phase === "loading_sdk" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Carregando Meta…
                </>
              ) : (
                "Iniciar conexão"
              )}
            </Button>
          </div>

          {phase === "success" && (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Conexão concluída</AlertTitle>
              <AlertDescription>
                Envie uma mensagem de teste para +55 11 93061-7116 e confira em{" "}
                <Link to="/admin/conversas" className="underline font-medium">
                  Mensagens
                </Link>
                .
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Não foi possível conectar</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
