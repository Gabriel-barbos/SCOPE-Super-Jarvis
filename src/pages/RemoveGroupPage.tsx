import { useState, useEffect } from "react";
import { FolderPlus, Search, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import vehicleService, { type VehicleGroup, type OperationResult, type SearchType } from "@/services/VehicleGroupService";
import ConfirmDialog from "@/components/global/ConfirmDialog";
import OperationReport from "@/components/OperationReport";
import GroupSelector from "@/components/global/GroupSelector";
import VehicleInput from "@/components/VehicleInput";

interface ProcessState {
  active: boolean;
  current: number;
  total: number;
  results: OperationResult[];
}

export default function VeiculosDeletar() {
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([]);
  const [selectedGroupManual, setSelectedGroupManual] = useState<VehicleGroup | null>(null);
  const [selectedGroupRemoved, setSelectedGroupRemoved] = useState<VehicleGroup | null>(null);
  const [identifierType, setIdentifierType] = useState<SearchType>("description");
  const [vehicleData, setVehicleData] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [openManual, setOpenManual] = useState(false);
  const [openRemoved, setOpenRemoved] = useState(false);
  const [removedVehicles, setRemovedVehicles] = useState<any[]>([]);
  const [loadingRemovedVehicles, setLoadingRemovedVehicles] = useState(false);
  const [searchRemovedVehicles, setSearchRemovedVehicles] = useState("");
  const [showConfirmManual, setShowConfirmManual] = useState(false);
  const [showConfirmRemoved, setShowConfirmRemoved] = useState(false);
  const [processState, setProcessState] = useState<ProcessState>({
    active: false,
    current: 0,
    total: 0,
    results: [],
  });

  useEffect(() => {
    carregarGrupos();
  }, []);

  const carregarGrupos = async () => {
    setLoadingGroups(true);
    try {
      const grupos = await vehicleService.listarGrupos();
      setVehicleGroups(grupos);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleAddVehicles = () => {
    if (!vehicleData.trim() || !selectedGroupManual) return;
    setShowConfirmManual(true);
  };

  const confirmarAdicaoManual = async () => {
    setShowConfirmManual(false);

    const identifiers = vehicleData
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    setProcessState({ active: true, current: 0, total: identifiers.length, results: [] });

    try {
      const results = await vehicleService.removerVeiculosDoGrupo(
        selectedGroupManual!.description,
        identifiers,
        identifierType,
        (current, total, result) => {
          setProcessState((prev) => ({
            ...prev,
            current,
            total,
            results: [...prev.results, result],
          }));
        }
      );

      setProcessState((prev) => ({ ...prev, active: false, results }));
    } catch (error) {
      console.error("Erro ao Remover veículos:", error);
      setProcessState((prev) => ({ ...prev, active: false }));
    }
  };

  const carregarVeiculosRemovidos = async () => {
    setLoadingRemovedVehicles(true);
    setSearchRemovedVehicles("");
    try {
      const veiculos = await vehicleService.buscarVeiculosRemovidos();
      setRemovedVehicles(veiculos);
    } catch (error) {
      console.error("Erro ao carregar veículos removidos:", error);
    } finally {
      setLoadingRemovedVehicles(false);
    }
  };

  const handleAddRemovedVehicles = () => {
    if (removedVehicles.length === 0 || !selectedGroupRemoved) return;
    setShowConfirmRemoved(true);
  };

  const confirmarAdicaoRemovidos = async () => {
    setShowConfirmRemoved(false);

    const descriptions = removedVehicles.map((v) => v.description);
    setProcessState({ active: true, current: 0, total: descriptions.length, results: [] });

    try {
      const results = await vehicleService.removerVeiculosDoGrupo(
        selectedGroupRemoved!.description,
        descriptions,
        "description",
        (current, total, result) => {
          setProcessState((prev) => ({
            ...prev,
            current,
            total,
            results: [...prev.results, result],
          }));
        }
      );

      setProcessState((prev) => ({ ...prev, active: false, results }));
    } catch (error) {
      console.error("Erro ao retirar veículos:", error);
      setProcessState((prev) => ({ ...prev, active: false }));
    }
  };

  const resetForm = () => {
    setVehicleData("");
    setSelectedGroupManual(null);
    setSelectedGroupRemoved(null);
    setProcessState({ active: false, current: 0, total: 0, results: [] });
  };

  const filteredRemovedVehicles = removedVehicles.filter(
    (v) =>
      v.description.toLowerCase().includes(searchRemovedVehicles.toLowerCase()) ||
      (v.vin && v.vin.toLowerCase().includes(searchRemovedVehicles.toLowerCase()))
  );

  const vehicleCount = vehicleData.split("\n").filter((line) => line.trim().length > 0).length;
  const relatorio = vehicleService.gerarRelatorio(processState.results);
  const progressPercent = processState.total > 0 ? (processState.current / processState.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <FolderPlus className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Remover do Grupo</h1>
        </div>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList>
          <TabsTrigger value="manual">Inserir Lista</TabsTrigger>
          <TabsTrigger value="removed">Filtrar Removidos</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <div className="p-6 space-y-6 shadow-md border border-border">
            <div className="text-muted-foreground">
              <div className="flex justify-between items-center mb-4">
                <p>Retira veículos do grupo específico em lote</p>
                <Button
                  onClick={handleAddVehicles}
                  disabled={!vehicleData.trim() || !selectedGroupManual || processState.active}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {processState.active ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FolderPlus className="w-4 h-4" />
                      <span>Retirar Veículos</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            <GroupSelector
              vehicleGroups={vehicleGroups}
              selectedGroup={selectedGroupManual}
              onSelectGroup={setSelectedGroupManual}
              loading={loadingGroups}
              onRefresh={carregarGrupos}
              open={openManual}
              onOpenChange={setOpenManual}
            />

            <VehicleInput
              identifierType={identifierType}
              onIdentifierTypeChange={setIdentifierType}
              vehicleData={vehicleData}
              onVehicleDataChange={setVehicleData}
              disabled={processState.active}
            />

            {processState.active && (
              <div className="space-y-3 p-4 border border-border rounded-md bg-muted/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    Processando {processState.current} de {processState.total}
                  </span>
                  <span className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="w-full" />
              </div>
            )}

            {processState.results.length > 0 && !processState.active && (
              <OperationReport
                report={relatorio}
                onReset={resetForm}
                groupName={selectedGroupManual?.description}
                actionType="add"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="removed">
          <div className="p-6 space-y-6 shadow-md border border-border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Grupo de Destino</label>
              <GroupSelector
                vehicleGroups={vehicleGroups}
                selectedGroup={selectedGroupRemoved}
                onSelectGroup={setSelectedGroupRemoved}
                loading={loadingGroups}
                onRefresh={carregarGrupos}
                open={openRemoved}
                onOpenChange={setOpenRemoved}
                label=""
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={carregarVeiculosRemovidos} disabled={loadingRemovedVehicles}>
                  {loadingRemovedVehicles ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Filtrando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Filtrar Removidos</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleAddRemovedVehicles}
                  disabled={processState.active || !selectedGroupRemoved || removedVehicles.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {processState.active ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Retirando...</span>
                    </div>
                  ) : (
                    <span>Retirar do Grupo</span>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou VIN..."
                  value={searchRemovedVehicles}
                  onChange={(e) => setSearchRemovedVehicles(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto border border-border rounded-md p-4 bg-muted/30">
                {loadingRemovedVehicles ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : filteredRemovedVehicles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {removedVehicles.length === 0 ? "Nenhum veículo removido encontrado" : "Nenhum resultado para sua busca"}
                  </div>
                ) : (
                  filteredRemovedVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="p-3 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors">
                      <p className="font-medium text-foreground truncate">{vehicle.description}</p>
                      {vehicle.vin && <p className="text-xs text-muted-foreground truncate">Chassi: {vehicle.vin}</p>}
                    </div>
                  ))
                )}
              </div>

              {removedVehicles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Exibindo {filteredRemovedVehicles.length} de {removedVehicles.length} veículo{removedVehicles.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {processState.results.length > 0 && !processState.active && (
              <OperationReport
                report={relatorio}
                onReset={resetForm}
                groupName={selectedGroupRemoved?.description}
                actionType="remove"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showConfirmManual}
        onOpenChange={setShowConfirmManual}
        onConfirm={confirmarAdicaoManual}
        vehicleCount={vehicleCount}
        identifierType={identifierType}
        groupName={selectedGroupManual?.description}
        actionType="remove"
      />

      <ConfirmDialog
        open={showConfirmRemoved}
        onOpenChange={setShowConfirmRemoved}
        onConfirm={confirmarAdicaoRemovidos}
        vehicleCount={removedVehicles.length}
        identifierType="description"
        groupName={selectedGroupRemoved?.description}
        actionType="remove"
      />
    </div>
  );
}