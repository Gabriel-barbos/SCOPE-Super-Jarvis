import { useState, useEffect } from "react";
import { FolderMinus, Search, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  listarVehicleGroups,
  RemoveVehiclesToGroup,
  buscarVeiculosRemovidos,
} from "@/services/RemoveGroupService";

import ResultDialog from "@/components/ResultDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import GroupSelector from "@/components/GroupSelector";
import VehicleInput from "@/components/VehicleInput";
interface VehicleGroup {
  id: string;
  description: string;
}

interface RemovedVehicle {
  id: string;
  description: string;
  vin?: string;
}

type IdentifierType = "description" | "vin";

export default function VeiculosRemover() {
  const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([]);
  const [selectedGroupManual, setSelectedGroupManual] = useState<VehicleGroup | null>(null);
  const [selectedGroupRemoved, setSelectedGroupRemoved] = useState<VehicleGroup | null>(null);
  const [identifierType, setIdentifierType] = useState<IdentifierType>("description");
  const [vehicleData, setVehicleData] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [openManual, setOpenManual] = useState(false);
  const [openRemoved, setOpenRemoved] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSuccess, setResultSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [removedVehicles, setRemovedVehicles] = useState<RemovedVehicle[]>([]);
  const [loadingRemovedVehicles, setLoadingRemovedVehicles] = useState(false);
  const [searchRemovedVehicles, setSearchRemovedVehicles] = useState("");

  useEffect(() => {
    carregarGrupos();
  }, []);

  const carregarGrupos = async () => {
    setLoadingGroups(true);
    try {
      const grupos = await listarVehicleGroups();
      setVehicleGroups(grupos);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleAddVehicles = () => {
    if (!vehicleData.trim() || !selectedGroupManual) return;
    setShowConfirmModal(true);
  };

  const confirmarAdicao = async () => {
    setShowConfirmModal(false);
    setProcessing(true);

    const identifiers = vehicleData
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    try {
      const success = await RemoveVehiclesToGroup(
        selectedGroupManual!.description,
        identifiers,
        identifierType
      );
      setResultSuccess(success);
    } catch (error) {
      console.error("Erro ao retirar veículos:", error);
      setResultSuccess(false);
    } finally {
      setProcessing(false);
      setShowResultModal(true);
    }
  };

  const resetForm = () => {
    setVehicleData("");
    setSelectedGroupManual(null);
    setSelectedGroupRemoved(null);
    setShowResultModal(false);
  };

  const carregarVeiculosRemovidos = async () => {
    setLoadingRemovedVehicles(true);
    setSearchRemovedVehicles("");
    try {
      const veiculos = await buscarVeiculosRemovidos();
      setRemovedVehicles(veiculos);
    } catch (error) {
      console.error("Erro ao carregar veículos removidos:", error);
    } finally {
      setLoadingRemovedVehicles(false);
    }
  };

  const adicionarRemovidosAoGrupo = async () => {
    if (removedVehicles.length === 0 || !selectedGroupRemoved) return;

    const descriptions = removedVehicles.map(v => v.description);
    setProcessing(true);

    try {
      const success = await RemoveVehiclesToGroup(
        selectedGroupRemoved.description,
        descriptions,
        "description"
      );
      setResultSuccess(success);
    } catch (error) {
      console.error("Erro ao retirar veículos:", error);
      setResultSuccess(false);
    } finally {
      setProcessing(false);
      setShowResultModal(true);
    }
  };

  const filteredRemovedVehicles = removedVehicles.filter(v =>
    v.description.toLowerCase().includes(searchRemovedVehicles.toLowerCase()) ||
    (v.vin && v.vin.toLowerCase().includes(searchRemovedVehicles.toLowerCase()))
  );

  const vehicleCount = vehicleData.split('\n').filter(line => line.trim().length > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <FolderMinus className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Retirar do Grupo</h1>
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
                <p>Retira veículos a grupos específicos em lote</p>
                <Button
                  onClick={handleAddVehicles}
                  disabled={!vehicleData.trim() || !selectedGroupManual || processing}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth"
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FolderMinus className="w-4 h-4" />
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
              disabled={processing}
            />

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    Retirando veículos...
                  </span>
                </div>
                <Progress value={50} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  Processando sua solicitação...
                </p>
              </div>
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
                <Button
                  variant="outline"
                  onClick={carregarVeiculosRemovidos}
                  disabled={loadingRemovedVehicles}
                  className="flex items-center gap-2"
                >
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
                  onClick={adicionarRemovidosAoGrupo}
                  disabled={processing || !selectedGroupRemoved || removedVehicles.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {processing ? (
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
                    {removedVehicles.length === 0
                      ? "Nenhum veículo removido encontrado"
                      : "Nenhum resultado para sua busca"}
                  </div>
                ) : (
                  filteredRemovedVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="p-3 rounded-md border border-border bg-background hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-foreground truncate">
                        {vehicle.description}
                      </p>
                      {vehicle.vin && (
                        <p className="text-xs text-muted-foreground truncate">
                          VIN: {vehicle.vin}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {removedVehicles.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Exibindo {filteredRemovedVehicles.length} de {removedVehicles.length} veículo{removedVehicles.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        onConfirm={confirmarAdicao}
        vehicleCount={vehicleCount}
        identifierType={identifierType}
        groupName={selectedGroupManual?.description}
        actionType="remove"
      />

      <ResultDialog
        open={showResultModal}
        onOpenChange={setShowResultModal}
        success={resultSuccess}
        groupName={selectedGroupManual?.description || selectedGroupRemoved?.description}
        onReset={resetForm}
        actionType="remove"
      />
    </div>
  );
}