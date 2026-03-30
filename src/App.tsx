import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminEditorProvider } from "@/contexts/AdminEditorContext";
import AdminEditorSidebar from "@/components/AdminEditorSidebar";
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
import AdminHome from "./pages/admin/AdminHome";
import AdminQuemSomos from "./pages/admin/AdminQuemSomos";
import AdminCardapio from "./pages/admin/AdminCardapio";
import AdminConfiguracoes from "./pages/admin/AdminConfiguracoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AdminEditorProvider>
        <AdminEditorSidebar />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="home" element={<AdminHome />} />
              <Route path="quem-somos" element={<AdminQuemSomos />} />
              <Route path="cardapio" element={<AdminCardapio />} />
              <Route path="configuracoes" element={<AdminConfiguracoes />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminEditorProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
