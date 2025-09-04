import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Dashboard from "./pages/Dashboard";
import Veiculos from "./pages/Veiculos";
import VeiculosAtualizar from "./pages/VeiculosAtualizar";
import VeiculosRegistrar from "./pages/VeiculosRegistrar";
import VeiculosRemover from "./pages/VeiculosRemover";
import VeiculosShare from "./pages/VeiculosShare";
import VeiculosDeletar from "./pages/VeiculosDeletar";
import Usuarios from "./pages/Usuarios";
import Motoristas from "./pages/Motoristas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark"> {/* Força o tema dark */}
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />
            <Route path="/veiculos" element={
              <Layout>
                <Veiculos />
              </Layout>
            } />
            <Route path="/veiculos/atualizar" element={
              <Layout>
                <VeiculosAtualizar />
              </Layout>
            } />
            <Route path="/veiculos/registrar" element={
              <Layout>
                <VeiculosRegistrar />
              </Layout>
            } />
            <Route path="/veiculos/remover" element={
              <Layout>
                <VeiculosRemover />
              </Layout>
            } />
            <Route path="/veiculos/share" element={
              <Layout>
                <VeiculosShare />
              </Layout>
            } />
            <Route path="/veiculos/deletar" element={
              <Layout>
                <VeiculosDeletar />
              </Layout>
            } />
            <Route path="/usuarios" element={
              <Layout>
                <Usuarios />
              </Layout>
            } />
            <Route path="/motoristas" element={
              <Layout>
                <Motoristas />
              </Layout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
