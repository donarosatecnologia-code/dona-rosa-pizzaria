import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminEditorProvider } from "@/contexts/AdminEditorContext";
import Index from "./pages/Index";
import QuemSomosPage from "./pages/QuemSomosPage";
import CardapioPage from "./pages/CardapioPage";
import VenuePage from "./pages/VenuePage";
import CoursesPage from "./pages/CoursesPage";
import SustainabilityPage from "./pages/SustainabilityPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfUsePage from "./pages/TermsOfUsePage";
import DataDeletionPage from "./pages/DataDeletionPage";
import Login from "./pages/Login";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminConectarWhatsapp from "./pages/admin/AdminConectarWhatsapp";
import AdminEquipe from "./pages/admin/AdminEquipe";
import AdminEquipeConvidar from "./pages/admin/AdminEquipeConvidar";
import AdminEquipeEditar from "./pages/admin/AdminEquipeEditar";
import AdminMinhaConta from "./pages/admin/AdminMinhaConta";
import AdminForceChangePassword from "./pages/admin/AdminForceChangePassword";
import AdminPages from "./pages/admin/AdminPages";
import AdminHeaderFooter from "./pages/admin/AdminHeaderFooter";
import AdminCardapio from "./pages/admin/AdminCardapio";
import AdminContatos from "./pages/admin/AdminContatos";
import AdminConversas from "./pages/admin/AdminConversas";
import AdminConversaDetail from "./pages/admin/AdminConversaDetail";
import AdminDisparoDetail from "./pages/admin/AdminDisparoDetail";
import AdminDisparos from "./pages/admin/AdminDisparos";
import AdminEtiquetas from "./pages/admin/AdminEtiquetas";
import AdminPesquisas from "./pages/admin/AdminPesquisas";
import AdminSegmentos from "./pages/admin/AdminSegmentos";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminMirrorPage from "./pages/admin/AdminMirrorPage";
import AdminPreviewPage from "./pages/admin/AdminPreviewPage";
import { CmsConfirmDialog } from "./components/CmsConfirmDialog";
import { SeoShell } from "./components/SeoShell";
import { SitePublicChrome } from "./components/SitePublicChrome";
import { PublicSiteChromeExtras } from "./components/PublicSiteChromeExtras";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminEditorProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SitePublicChrome />
          <PublicSiteChromeExtras />
          <SeoShell />
          <CmsConfirmDialog />
          <div className="relative z-10">
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/quem-somos" element={<QuemSomosPage />} />
            <Route path="/cardapio" element={<CardapioPage />} />
            <Route path="/espacos" element={<VenuePage />} />
            <Route path="/cursos-e-eventos" element={<CoursesPage />} />
            <Route path="/saude-e-sustentabilidade" element={<SustainabilityPage />} />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicyPage />} />
            <Route path="/termos-de-uso" element={<TermsOfUsePage />} />
            <Route path="/exclusao-de-dados" element={<DataDeletionPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

            <Route path="/admin" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path="preview/:pageSlug" element={<AdminPreviewPage />} />
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="trocar-senha" element={<AdminForceChangePassword />} />
                <Route path="minha-conta" element={<AdminMinhaConta />} />
                <Route path="equipe" element={<AdminEquipe />} />
                <Route path="equipe/convidar" element={<AdminEquipeConvidar />} />
                <Route path="equipe/editar/:id" element={<AdminEquipeEditar />} />
                <Route path="contatos" element={<AdminContatos />} />
                <Route path="etiquetas" element={<AdminEtiquetas />} />
                <Route path="segmentos" element={<AdminSegmentos />} />
                <Route path="pesquisas" element={<AdminPesquisas />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="conversas" element={<AdminConversas />} />
                <Route path="conversas/:id" element={<AdminConversaDetail />} />
                <Route path="disparos" element={<AdminDisparos />} />
                <Route path="disparos/:id" element={<AdminDisparoDetail />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="mirror/:pageSlug" element={<AdminMirrorPage />} />
                <Route path="home" element={<Navigate to="/admin/mirror/home" replace />} />
                <Route path="quem-somos" element={<Navigate to="/admin/mirror/quem-somos" replace />} />
                <Route path="cardapio" element={<AdminCardapio />} />
                <Route path="header-footer" element={<AdminHeaderFooter />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
                <Route path="conectar-whatsapp" element={<AdminConectarWhatsapp />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AdminEditorProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
