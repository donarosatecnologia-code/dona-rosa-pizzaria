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
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";
import AdminPages from "./pages/admin/AdminPages";
import AdminHeaderFooter from "./pages/admin/AdminHeaderFooter";
import AdminCardapio from "./pages/admin/AdminCardapio";
import AdminMirrorPage from "./pages/admin/AdminMirrorPage";
import AdminPreviewPage from "./pages/admin/AdminPreviewPage";
import { CmsConfirmDialog } from "./components/CmsConfirmDialog";
import { SeoShell } from "./components/SeoShell";
import { SitePublicChrome } from "./components/SitePublicChrome";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminEditorProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <SitePublicChrome />
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
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
              <Route path="preview/:pageSlug" element={<AdminPreviewPage />} />
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="mirror/:pageSlug" element={<AdminMirrorPage />} />
                <Route path="home" element={<Navigate to="/admin/mirror/home" replace />} />
                <Route path="quem-somos" element={<Navigate to="/admin/mirror/quem-somos" replace />} />
                <Route path="cardapio" element={<AdminCardapio />} />
                <Route path="header-footer" element={<AdminHeaderFooter />} />
                <Route path="configuracoes" element={<AdminConfiguracoes />} />
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
