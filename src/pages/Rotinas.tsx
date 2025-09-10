import { useState } from "react";
import { CalendarClock, Loader2, Eye, Car } from "lucide-react";
import UnidasService, { Veiculo } from "../services/UnidasService";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Rotinas() {
  const [vehicles, setVehicles] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [executionTime, setExecutionTime] = useState<string | null>(null);

  // ================== BUSCAR VEÍCULOS ==================
  const handleBuscarVeiculos = async () => {
    setLoading(true);
    setVehicles([]);
    setProcessed(0);
    setTotal(0);
    setStatusMessage("Conectando com a API...");
    const startTime = new Date();

    try {
      setStatusMessage("Gerando token de acesso...");
      await UnidasService.loginUnidas();

      setStatusMessage("Iniciando busca na base de dados...");
      const resultado = await UnidasService.buscarVeiculosSemGrupo(500, (processados, totalCount, descricao) => {
        setProcessed(processados);
        setTotal(totalCount || 0);

        if (descricao) {
          setStatusMessage(`Analisando veículos... ${descricao}`);
        }
      });

      setVehicles(resultado);
      setStatusMessage(`Concluído! ${resultado.length} veículos encontrados`);

      const endTime = new Date();
      const now = new Date().toLocaleString('pt-BR');
      setExecutionTime(now);

    } catch (error) {
      console.error("Erro na rotina Unidas:", error);
      setStatusMessage("Erro ao processar dados");
    } finally {
      setLoading(false);
    }
  };

  // ================== ADICIONAR TODOS VEÍCULOS AO GRUPO ==================
  const handleAdicionarAoGrupo = async () => {
    if (vehicles.length === 0) return;

    setLoading(true);
    setProcessed(0);
    setTotal(vehicles.length);
    setStatusMessage("Iniciando adição de veículos ao grupo...");

    try {
      // Adiciona veículo por veículo para atualizar progresso
      for (let i = 0; i < vehicles.length; i++) {
        await UnidasService.adicionarVeiculosAoGrupoTodos([vehicles[i]]);
        setProcessed(i + 1);
        setStatusMessage(`Adicionando veículo ${i + 1} de ${vehicles.length}`);
      }
      setStatusMessage("✅ Todos os veículos foram adicionados ao grupo com sucesso!");
    } catch (err: any) {
      console.error(err);
      setStatusMessage("❌ Erro ao adicionar veículos ao grupo");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = total > 0 ? (processed / total) * 100 : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Rotinas</h1>
        </div>
      </div>

      {/* Card Principal */}
      <Card className="shadow-md border border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">Rotina - Grupo de Veículos Unidas</CardTitle>
            <Badge variant="default" className="px-3">Ativo</Badge>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">Programar</Button>
            <Button
              variant="default"
              className="bg-white hover:from-blue-600 hover:to-indigo-600"
              size="sm"
              onClick={handleBuscarVeiculos}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Executando...
                </>
              ) : (
                "Executar"
              )}
            </Button>
          </div>
        </CardHeader>

        <CardDescription className="px-6">
          Essa rotina analisa a base da Unidas e identifica veículos que possuem apenas 1 grupo de veículos.
        </CardDescription>

        <CardContent className="p-6 space-y-4">
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium">Processando</span>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {statusMessage}
                </div>

                {total > 0 && (
                  <>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{processed} de {total} processados</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {!loading && total > 0 && (
            <div className="space-y-2">
              <div className="text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">{processed}</span> de {total} veículos processados
                </p>
              </div>
              <div className="text-sm text-green-600 font-medium">
                {statusMessage}
              </div>
            </div>
          )}

          {vehicles.length > 0 && !loading && (
            <div className="flex gap-2">
              {/* Botão Ver Detalhes */}
              <Button
                variant="secondary"
                className="hover:from-slate-200 hover:to-slate-300"
                onClick={() => setShowModal(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes ({vehicles.length} veículos)
              </Button>

              {/* Botão Adicionar ao grupo */}
              <Button
                variant="default"
                className="bg-white  hover:bg-green-700"
                onClick={handleAdicionarAoGrupo}
                disabled={loading || vehicles.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  "Adicionar ao grupo"
                )}
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="text-xs text-muted-foreground">
          {executionTime ? (
            `Última execução: ${executionTime}`
          ) : (
            "Última execução: 05/09/2025 às 14:32"
          )}
        </CardFooter>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Veículos sem Grupo
              <Badge variant="outline" className="ml-2">
                {vehicles.length} encontrados
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh]">
            <div className="space-y-2">
              {vehicles.map((vehicle, index) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <div className="font-medium text-sm">
                      Chassi: {vehicle.vin}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {vehicle.id}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {vehicle.vehicleGroups[0]?.isAll ? "Todos os veiculos" : "Grupo Específico"}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}

              {vehicles.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum veículo encontrado</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
