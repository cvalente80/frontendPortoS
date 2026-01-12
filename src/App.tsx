import { Routes, Route, NavLink, Navigate, useParams } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import i18n from "./i18n";
import { ResponsiveGate } from "./components/ResponsiveGate";
import DesktopNav from "./components/DesktopNav";
import MobileNav from "./components/MobileNav";
import Home from "./pages/Home";
import SimulacaoAuto from "./pages/SimulacaoAuto";
import SimulacaoVida from "./pages/SimulacaoVida";
import SimulacaoSaude from "./pages/SimulacaoSaude";
import SimulacaoHabitacao from "./pages/SimulacaoHabitacao";
import Produtos from "./pages/Produtos";
import Contato from "./pages/Contato";
import ProdutoAuto from "./pages/ProdutoAuto";
import ProdutoVida from "./pages/ProdutoVida";
import ProdutoSaude from "./pages/ProdutoSaude";
import ProdutoHabitacao from "./pages/ProdutoHabitacao";
import ProdutoFrota from "./pages/ProdutoFrota";
import ProdutoAcidentesTrabalho from "./pages/ProdutoAcidentesTrabalho";
import ProdutoResponsabilidadeCivilProfissional from "./pages/ProdutoResponsabilidadeCivilProfissional";
import SimulacaoResponsabilidadeCivilProfissional from "./pages/SimulacaoResponsabilidadeCivilProfissional";
import ProdutoMultirriscosEmpresarial from "./pages/ProdutoMultirriscosEmpresarial";
import ProdutoCondominio from "./pages/ProdutoCondominio";
import SimulacaoCondominio from "./pages/SimulacaoCondominio";
import PoliticaRGPD from "./pages/PoliticaRGPD";
import './App.css';
import ChatInbox from './pages/admin/ChatInbox';
import ChatThread from './pages/admin/ChatThread';
import { useAuth } from './context/AuthContext';
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));
import React from "react";
import Header from "./components/Header";
import { ProtectedRoute } from './context/AuthContext';
import MinhasSimulacoes from './pages/MinhasSimulacoes';
import MinhasApolices from './pages/MinhasApolices';
import ChatWidget from './components/ChatWidget';


function App(): React.ReactElement {

  function LangScopedRoutes() {
    const { lang } = useParams();
    const base = lang === 'en' ? 'en' : (lang === 'pt' ? 'pt' : 'pt');
    const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    let brandName = 'Ansião Seguros';
    if (host.includes('aurelio')) brandName = 'Aurélio Seguros';
    else if (host.includes('povoaseg') || host.includes('povoa')) brandName = 'Póvoa Seguros';
    else if (host.includes('lisboaseg') || host.includes('lisboa')) brandName = 'Lisboa Seguros';
    else if (host.includes('portoseg') || host.includes('porto')) brandName = 'Porto Seguros';
    // Force i18n language to follow URL param (robust on first load / GH Pages)
    useEffect(() => {
      if (lang === 'pt' || lang === 'en') {
        i18n.changeLanguage(lang);
        document.documentElement.lang = lang;
      }
    }, [lang]);
    // if invalid lang in URL, normalize to /pt
    if (lang !== 'pt' && lang !== 'en') {
      return <Navigate to="/pt" replace />;
    }
    return (
      <>
        {/* Marca de água da vila de Ansião no body */}
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.12,
          background: `url('${import.meta.env.BASE_URL}imagens/image.png') center center / cover no-repeat`
        }} />
        {/* Navbar responsiva: Mobile (md-) e Desktop (md+) */}
        <ResponsiveGate mobile={<MobileNav />} desktop={<DesktopNav />} />
        <Suspense fallback={<div className="p-6 text-center">Carregando…</div>}>
  <Routes>
          <Route index element={<Home />} />
          <Route path="inicio" element={<Home />} />
          {/* Auth */}
          <Route path="auth/login" element={<Login />} />
          <Route path="auth/register" element={<Register />} />
          <Route path="auth/forgot" element={<ForgotPassword />} />
          <Route path="auth/verify-email" element={<VerifyEmail />} />
          {/* Área autenticada */}
          <Route path="minhas-simulacoes" element={<ProtectedRoute><MinhasSimulacoes /></ProtectedRoute>} />
          <Route path="minhas-apolices" element={<ProtectedRoute><MinhasApolices /></ProtectedRoute>} />
          <Route path="simulacao-auto" element={<SimulacaoAuto />} />
          <Route path="simulacao-vida" element={<SimulacaoVida />} />
          <Route path="simulacao-saude" element={<SimulacaoSaude />} />
          <Route path="simulacao-habitacao" element={<SimulacaoHabitacao />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="contato" element={<Contato />} />
          <Route path="produto-auto" element={<ProdutoAuto />} />
          <Route path="produto-vida" element={<ProdutoVida />} />
          <Route path="produto-saude" element={<ProdutoSaude />} />
          <Route path="produto-habitacao" element={<ProdutoHabitacao />} />
          <Route path="produto-frota" element={<ProdutoFrota />} />
          <Route path="produto-acidentes-trabalho" element={<ProdutoAcidentesTrabalho />} />
          <Route path="produto-responsabilidade-civil-profissional" element={<ProdutoResponsabilidadeCivilProfissional />} />
          <Route path="simulacao-rc-profissional" element={<SimulacaoResponsabilidadeCivilProfissional />} />
          <Route path="produto-multirriscos-empresarial" element={<ProdutoMultirriscosEmpresarial />} />
          <Route path="produto-condominio" element={<ProdutoCondominio />} />
          <Route path="simulacao-condominio" element={<SimulacaoCondominio />} />
          <Route path="politica-rgpd" element={<PoliticaRGPD />} />
    {/* Admin chat (guarded) */}
    <Route path="admin/inbox" element={<AdminRoute><ChatInbox /></AdminRoute>} />
    <Route path="admin/chat/:chatId" element={<AdminRoute><ChatThread /></AdminRoute>} />
          {/* Not found inside lang: redirect to index within the same lang */}
          <Route path="*" element={<Navigate to={`/${base}`} replace />} />
  </Routes>
  </Suspense>
        {/* Footer com link para RGPD */}
        <footer className="bg-blue-900 text-blue-100 py-6 mt-12 text-center w-full">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-4 gap-2">
            <span className="text-sm">© {new Date().getFullYear()} {brandName}. Todos os direitos reservados.</span>
            <div className="flex gap-4 items-center">
              <NavLink to={`/${base}/contato`} className="text-blue-200 underline hover:text-white text-sm">Contacto</NavLink>
              <span className="hidden md:inline-block">|</span>
              <NavLink to={`/${base}/politica-rgpd`} className="text-blue-200 underline hover:text-white text-sm">Política de Privacidade &amp; RGPD</NavLink>
              <span className="hidden md:inline-block">|</span>
              <NavLink to={`/${base}/auth/login`} className="text-blue-200 underline hover:text-white text-sm">Entrar</NavLink>
            </div>
          </div>
        </footer>
      </>
    );
  }

  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
      // You can log the error to an error reporting service here
      // console.error(error, info);
    }

    render() {
      if (this.state.error) {
        return (
          <div className="p-6">
            <h1 className="font-bold text-red-600">Ocorreu um erro</h1>
            <pre className="mt-2 whitespace-pre-wrap text-sm">{this.state.error.message}</pre>
          </div>
        );
      }

      return (
        <React.Suspense fallback={<div className="p-6">A carregar...</div>}>
          {this.props.children}
        </React.Suspense>
      );
    }
  }

  function AdminRoute({ children }: { children: React.ReactElement }) {
    const { user, loading, isAdmin } = useAuth();
    if (loading) return <div className="p-4 text-center">A carregar…</div>;
    if (!user) return <div className="p-6 text-center">Acesso restrito. É necessário autenticação.</div>;
    if (!isAdmin) return <div className="p-6 text-center">Acesso restrito a administradores.</div>;
    return children;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/pt" replace />} />
        <Route path=":lang/*" element={<LangScopedRoutes />} />
        {/* Fallback: qualquer outra rota vai para /pt */}
        <Route path="*" element={<Navigate to="/pt" replace />} />
      </Routes>
      {/* Floating Chat/WhatsApp widget visible in all pages */}
      <ChatWidget phoneNumber={"+351 962 116 764"} whatsappNumber={"351962116764"} />
    </>
  );
}

export default App;
