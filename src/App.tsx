import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/services/AuthService"; 
import Dashboard from "./pages/Dashboard";
import Veiculos from "./pages/Vehicles";
import VeiculosAtualizar from "./pages/UpdateVehicles";
import VeiculosRegistrar from "./pages/AddGroupPage";
import VeiculosRemover from "./pages/RemoveGroupPage";
import VeiculosShare from "./pages/VeiculosShare";
import VeiculosDeletar from "./pages/DeleteVehicle";
import Clients from "./pages/Clients";
import Motoristas from "./pages/Drivers";
import NotFound from "./pages/NotFound";
import Rotinas from "./pages/Routines"
import Remocao from "./pages/Deinstallation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider> 
        <div className="dark">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/vehicles" element={<Layout><Veiculos /></Layout>} />
              <Route path="/vehicles/update" element={<Layout><VeiculosAtualizar /></Layout>} />
              <Route path="/vehicles/register" element={<Layout><VeiculosRegistrar /></Layout>} />
              <Route path="/vehicles/remove" element={<Layout><VeiculosRemover /></Layout>} />
              <Route path="/vehicles/share" element={<Layout><VeiculosShare /></Layout>} />
              <Route path="/vehicles/delete" element={<Layout><VeiculosDeletar /></Layout>} />
              <Route path="/users" element={<Layout><Clients /></Layout>} />
              <Route path="/drivers" element={<Layout><Motoristas /></Layout>} />
              <Route path="/routines" element={<Layout><Rotinas /></Layout>} />
              <Route path="/deinstallation" element={<Layout><Remocao /></Layout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
