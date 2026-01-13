import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/services/AuthService"; // Seu provider de clientes/tokens
import { LoginProvider } from "@/services/LoginService"; // Novo provider de autenticação
import { ProtectedRoute } from "@/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import Dashboard from "@/pages/Dashboard";
import Veiculos from "@/pages/Vehicles";
import VeiculosAtualizar from "@/pages/UpdateVehicles";
import VeiculosRegistrar from "@/pages/AddGroupPage";
import VeiculosRemover from "@/pages/RemoveGroupPage";
import VeiculosShare from "@/pages/VeiculosShare";
import VeiculosDeletar from "@/pages/DeleteVehicle";
import Clients from "@/pages/Clients";
import Motoristas from "@/pages/Drivers";
import NotFound from "@/pages/NotFound";
import Rotinas from "@/pages/Routines";
import Remocao from "@/pages/Deinstallation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LoginProvider>
        <AuthProvider>
          <div className="dark">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Rota pública de login */}
                <Route path="/login" element={<LoginPage />} />

                {/* Rotas protegidas */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Veiculos />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/update"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <VeiculosAtualizar />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/register"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <VeiculosRegistrar />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/remove"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <VeiculosRemover />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/share"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <VeiculosShare />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/vehicles/delete"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <VeiculosDeletar />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Clients />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drivers"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Motoristas />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/routines"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Rotinas />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/deinstallation"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Remocao />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Rota 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </AuthProvider>
      </LoginProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;