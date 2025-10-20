import { useState, useEffect } from "react";
import { FolderMinus, Search, Loader2, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  listarVehicleGroups,
  RemoveVehiclesToGroup,
  buscarVeiculosRemovidos,
} from "@/services/RemoveGroupService";

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
  const [open, setOpen] = useState(false);
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

  const adicionarRemovidosAoGrupo = () => {
    if (removedVehicles.length === 0 || !selectedGroupRemoved) return;

    const descriptions = removedVehicles.map(v => v.description);
    setProcessing(true);

    RemoveVehiclesToGroup(selectedGroupRemoved.description, descriptions, "description")
      .then((success) => {
        setResultSuccess(success);
        setShowResultModal(true);
      })
      .catch((error) => {
        console.error("Erro ao retirar veículos:", error);
        setResultSuccess(false);
        setShowResultModal(true);
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  const filteredRemovedVehicles = removedVehicles.filter(v =>
    v.description.toLowerCase().includes(searchRemovedVehicles.toLowerCase()) ||
    (v.vin && v.vin.toLowerCase().includes(searchRemovedVehicles.toLowerCase()))
  );

  const vehicleCount = vehicleData.split('\n').filter(line => line.trim().length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
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

        {/* Aba: Inserir Lista */}
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

            {/* Seleção de Grupo (Manual) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Grupo de Veículos
                </label>
              </div>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between transition-smooth"
                    disabled={loadingGroups}
                  >
                    {loadingGroups ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Carregando grupos...</span>
                      </div>
                    ) : selectedGroupManual ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>{selectedGroupManual.description}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Selecione um grupo...</span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar grupo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
                      <CommandGroup>
                        {vehicleGroups.map((group) => (
                          <CommandItem
                            key={group.id}
                            onSelect={() => {
                              setSelectedGroupManual(group);
                              setOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{group.description}</p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button
                variant="default"
                size="sm"
                onClick={carregarGrupos}
                disabled={loadingGroups}
                className="bg-white hover:bg-primary/90 text-primary-foreground transition-smooth"
              >
                {loadingGroups ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Search className="w-3 h-3 mr-1" />
                )}
                Atualizar
              </Button>
            </div>

            {/* Tipo de Identificação */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tipo de Identificação
              </label>
              <Select
                value={identifierType}
                onValueChange={(value: IdentifierType) => setIdentifierType(value)}
                disabled={processing}
              >
                <SelectTrigger className="w-full transition-smooth">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="description">Descrição do Veículo</SelectItem>
                  <SelectItem value="vin">Chassi (VIN)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {identifierType === "description"
                  ? "Use a descrição completa do veículo para identificá-lo"
                  : "Use o número do chassi  para identificar o veículo"}
              </p>
            </div>

            {/* Textarea para dados */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {identifierType === "description" ? "Descrições dos Veículos" : "Chassis dos Veículos"}
              </label>
              <Textarea
                placeholder={identifierType === "description"
                  ? "Cole as descrições dos veículos aqui (uma por linha)"
                  : "Cole os números de chassi aqui (um por linha)"}
                value={vehicleData}
                onChange={(e) => setVehicleData(e.target.value)}
                className="min-h-[120px] transition-smooth font-mono"
                disabled={processing}
              />
              {vehicleCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {vehicleCount} veículo{vehicleCount !== 1 ? 's' : ''} para adicionar
                </p>
              )}
            </div>

            {/* Barra de Progresso durante processamento */}
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

        {/* Aba: Filtrar Removidos */}
        <TabsContent value="removed">
          <div className="p-6 space-y-6 shadow-md border border-border">
            {/* Seleção de Grupo (Removed) + Ações */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Grupo de Destino</label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between transition-smooth"
                    disabled={loadingGroups}
                  >
                    {loadingGroups ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Carregando grupos...</span>
                      </div>
                    ) : selectedGroupRemoved ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span>{selectedGroupRemoved.description}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Selecione um grupo...</span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar grupo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum grupo encontrado.</CommandEmpty>
                      <CommandGroup>
                        {vehicleGroups.map((group) => (
                          <CommandItem
                            key={group.id}
                            onSelect={() => {
                              setSelectedGroupRemoved(group);
                              setOpen(false);
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-2 w-full">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{group.description}</p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

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

            {/* Busca local e lista de removidos */}
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

      {/* Modal de Confirmação (apenas fluxo manual) */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderMinus className="w-5 h-5 text-primary" />
              Confirmar Adição
            </DialogTitle>
            <DialogDescription>
              Você está prestes a retirar <strong>{vehicleCount} veículo{vehicleCount !== 1 ? 's' : ''}</strong> por <strong>{identifierType === "description" ? "Descrição" : "Chassi"}</strong> ao grupo:
              <br />
              <strong className="text-foreground">{selectedGroupManual?.description}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarAdicao} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Resultado (compartilhado) */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              {resultSuccess ? "Veículos Retirados!" : "Erro na Adição"}
            </DialogTitle>
            <DialogDescription>
              {resultSuccess ? (
                <div className="space-y-2">
                  <p>
                    Os veículos foram retirados do grupo <strong>{selectedGroupManual?.description || selectedGroupRemoved?.description}</strong>.
                  </p>
                  <div className="text-green-600">
                    Operação concluída com sucesso
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>Ocorreu um erro ao retirar os veículos.</p>
                  <div className="text-red-600">
                    Verifique o console para mais detalhes
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={resetForm} variant="outline">
              Limpar Dados
            </Button>
            <Button onClick={() => setShowResultModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}