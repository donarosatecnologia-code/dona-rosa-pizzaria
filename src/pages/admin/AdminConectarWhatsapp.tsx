import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Smartphone,
  Monitor,
  ArrowLeft,
  RefreshCw,
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
  META_BUSINESS_ID,
} from "@/lib/meta-embedded-signup";
import { useMetaEmbeddedSignup } from "@/hooks/whatsapp/useMetaEmbeddedSignup";
import { useWhatsappConnectionStatus, useWhatsappPhoneStatus } from "@/hooks/whatsapp";
import { useWhatsappEmbeddedSignupComplete } from "@/hooks/whatsapp/useWhatsappEmbeddedSignupComplete";

const META_WEBHOOK_FIELDS_URL =
  "https://developers.facebook.com/apps/912159588512848/whatsapp-business/wa-settings/";

const META_BUSINESS_SETTINGS_URL = "https://business.facebook.com/latest/settings/whatsapp_account";

export default function AdminConectarWhatsapp() {
  const queryClient = useQueryClient();
  const { isConnected, lastWebhookAt, config, isLoading: statusLoading } =
    useWhatsappConnectionStatus();
  const phoneStatus = useWhatsappPhoneStatus(true);
  const completeSignup = useWhatsappEmbeddedSignupComplete();

  const handleComplete = useCallback(
    async (payload: Parameters<typeof completeSignup.mutateAsync>[0]) => {
      const result = await completeSignup.mutateAsync(payload);
      toast.success(result.message ?? "WhatsApp conectado! Confira no celular se a Meta pediu para tocar em Conectar.");
      await queryClient.invalidateQueries({ queryKey: ["whatsapp", "phone-status"] });
      await queryClient.invalidateQueries({ queryKey: ["whatsapp", "connection-status"] });
    },
    [completeSignup, queryClient],
  );

  const { phase, errorMessage, currentStep, launchSignup, isReady, isLaunching } =
    useMetaEmbeddedSignup({ onComplete: handleComplete });

  const configured = isEmbeddedSignupConfigured();
  const isBusy = isLaunching || completeSignup.isPending;
  const cloudReady = phoneStatus.data?.phone?.is_cloud_ready ?? false;
  const needsCoexistence = phoneStatus.data?.phone?.needs_coexistence ?? true;

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
        description="Ligue o número da pizzaria ao painel. O app no celular continua funcionando."
      />

      {!configured && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Falta configurar o site</AlertTitle>
          <AlertDescription>
            Peça para colocar <code>VITE_META_EMBEDDED_SIGNUP_CONFIG_ID</code> no deploy (valor atual da
            configuração Meta) e publicar de novo o site.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Situação do número</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {phoneStatus.isLoading ? (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Consultando a Meta…
            </p>
          ) : phoneStatus.data?.phone ? (
            <>
              <div className="flex flex-wrap gap-2">
                {cloudReady ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Pronto — celular e painel sincronizados
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Falta concluir a conexão
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                {phoneStatus.data.phone.display_phone_number ?? "—"}
                {phoneStatus.data.phone.verified_name
                  ? ` · ${phoneStatus.data.phone.verified_name}`
                  : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                API: {phoneStatus.data.phone.status} / {phoneStatus.data.phone.platform_type}
                {phoneStatus.data.phone.is_on_biz_app ? " · app no celular" : ""}
              </p>
              <p>{phoneStatus.data.user_hint}</p>
              <p className="font-medium text-foreground">{phoneStatus.data.next_step}</p>
            </>
          ) : (
            <p className="text-destructive">
              {phoneStatus.data?.message ?? phoneStatus.error?.message ?? "Não foi possível verificar."}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={phoneStatus.isFetching}
            onClick={() => void phoneStatus.refetch()}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${phoneStatus.isFetching ? "animate-spin" : ""}`} />
            Atualizar status
          </Button>
        </CardContent>
      </Card>

      <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertTitle className="text-amber-900">Antes de clicar em Iniciar conexão</AlertTitle>
        <AlertDescription className="text-amber-900/90 space-y-2 text-sm">
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              No celular: <strong>WhatsApp Business</strong> → Configurações → Aparelhos conectados →
              desconecte o WhatsApp Web.
            </li>
            <li>
              Use no computador a <strong>mesma conta Facebook</strong> que é administradora do app{" "}
              <strong>Dona Rosa Piuzza</strong> na Meta.
            </li>
            <li>
              No popup, escolha o portfólio <strong>Dona Rosa Pizzaria</strong> (sua pizzaria).{" "}
              <strong>Não</strong> escolha MentoraLab — isso ativa modo parceiro e gera erro de permissão.
            </li>
            <li>
              Escolha <strong>Conectar app WhatsApp Business</strong> e informe +55 11 93061-7116.
            </li>
            <li>
              Quando o QR aparecer nesta tela, no celular abra a <strong>mensagem da Meta</strong> e toque
              em Conectar à plataforma comercial → escaneie o QR.
            </li>
          </ol>
        </AlertDescription>
      </Alert>

      {needsCoexistence && (
        <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-950">
          <AlertTitle className="text-blue-900 text-sm">Se o portfólio Dona Rosa estiver cinza no popup</AlertTitle>
          <AlertDescription className="text-blue-900/90 text-sm space-y-2">
            <p>
              Vincule o app à conta WhatsApp antes:{" "}
              <a
                href={META_BUSINESS_SETTINGS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-1"
              >
                Configurações do negócio
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <p className="text-xs">
              App ID: <code>{META_APP_ID}</code>
              {META_EMBEDDED_SIGNUP_CONFIG_ID ? ` · Config: ${META_EMBEDDED_SIGNUP_CONFIG_ID}` : ""}
              {META_BUSINESS_ID ? ` · Business: ${META_BUSINESS_ID}` : " · (opcional: VITE_META_BUSINESS_ID no deploy)"}
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Neste computador
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Clique em <strong>Iniciar conexão</strong>.</p>
            <p>2. Portfólio <strong>Dona Rosa Pizzaria</strong> → Conectar app WhatsApp Business.</p>
            <p>3. Número +55 11 93061-7116.</p>
            <p>4. Quando aparecer o QR, avise quem está com o celular.</p>
            {currentStep && (
              <p className="text-xs text-primary">Passo Meta: {currentStep}</p>
            )}
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
            <p>1. Abra a conversa da <strong>Meta / Facebook Business</strong>.</p>
            <p>2. Toque em <strong>Conectar à plataforma comercial</strong>.</p>
            <p>3. Escaneie o QR que está no popup do computador.</p>
            <p>4. Confirme compartilhar conversas, se pedir (mantém histórico no painel).</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Painel e webhook</p>
              {statusLoading ? (
                <p className="text-xs text-muted-foreground">Verificando…</p>
              ) : cloudReady ? (
                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Número na Cloud API
                  {config?.display_name ? ` · ${config.display_name}` : ""}
                </p>
              ) : isConnected ? (
                <p className="text-xs text-amber-700">Webhook ok, número ainda não na API</p>
              ) : (
                <p className="text-xs text-amber-700">Aguardando primeira conexão</p>
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
              <AlertTitle>Etapa no computador concluída</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Confirme no celular a mensagem da Meta e escaneie o QR se ainda não fez. Depois toque em{" "}
                  <strong>Atualizar status</strong> até aparecer &quot;Pronto&quot;.
                </p>
                <Link to="/admin/conversas" className="underline font-medium text-sm">
                  Ir para Mensagens
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Não foi possível conectar</AlertTitle>
              <AlertDescription className="whitespace-pre-line text-sm">{errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Para quem configura a Meta (uma vez)</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            Webhook com campos <strong>messages</strong> e <strong>smb_message_echoes</strong> (mensagens
            enviadas pelo celular aparecem no painel):{" "}
            <a href={META_WEBHOOK_FIELDS_URL} target="_blank" rel="noopener noreferrer" className="underline">
              abrir configuração
            </a>
          </p>
          <p>
            Facebook Login for Business: modelo <strong>WhatsApp 60 dias</strong>, só ativos WhatsApp (sem
            Instagram nem anúncios).
          </p>
          <p>App em modo <strong>Desenvolvimento</strong> + você como <strong>Administradora</strong> — uso da própria pizzaria, sem App Review de parceiro.</p>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
