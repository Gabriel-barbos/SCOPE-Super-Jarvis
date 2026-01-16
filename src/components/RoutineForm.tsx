import { useEffect, useState } from "react";
import { InputWithIcon } from "@/components/global/InputWithIcon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScanSearch, Tag, SearchCheck } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { useClients } from "@/hooks/useClients";
import SelectGroup from "./share/SelectGroup";
import GroupSelector from "./global/GroupSelector";
import vehicleService from "@/services/VehicleGroupService";
import ShareService from "@/services/ShareService";

interface RoutineFormProps {
  routineId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoutineForm({ routineId, onSuccess, onCancel }: RoutineFormProps) {
  const { toast } = useToast();
  const { createRoutine, updateRoutine, isCreating, isUpdating, routines } = useRoutines();
  const { clients } = useClients();

  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [clientIdentificator, setClientIdentificator] = useState("");
  const [groupIdentificator, setGroupIdentificator] = useState("");
  const [addVehicleToGroup, setAddVehicleToGroup] = useState(false);
  const [shareVehicle, setShareVehicle] = useState(false);
  const [vehicleGroups, setVehicleGroups] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selectedVehicleGroup, setSelectedVehicleGroup] = useState<any>(null);
  const [selectedShareGroup, setSelectedShareGroup] = useState<any>(null);
  const [openVehicleGroup, setOpenVehicleGroup] = useState(false);

  // Carregar dados da rotina ao editar
  useEffect(() => {
    if (routineId) {
      const routine = routines.find((r) => r._id === routineId);
      if (routine) {
        setName(routine.name);
        setClient(routine.client?._id || "");
        setClientIdentificator(routine.clientIdentificator || "");
        setGroupIdentificator(routine.groupIdentificator || "");
        setAddVehicleToGroup(routine.addVehicleToGroup || false);
        setShareVehicle(routine.shareVehicle || false);
        
        if (routine.vehicleGroup) {
          setSelectedVehicleGroup({ id: routine.vehicleGroup });
        }
        if (routine.shareGroup) {
          setSelectedShareGroup({ id: routine.shareGroup });
        }
      }
    } else {
      resetForm();
    }
  }, [routineId, routines]);

  const resetForm = () => {
    setName("");
    setClient("");
    setClientIdentificator("");
    setGroupIdentificator("");
    setAddVehicleToGroup(false);
    setShareVehicle(false);
    setSelectedVehicleGroup(null);
    setSelectedShareGroup(null);
  };

  const carregarGrupos = async () => {
    setLoadingGroups(true);
    try {
      const grupos = await vehicleService.listarGrupos();
      setVehicleGroups(grupos);
    } finally {
      setLoadingGroups(false);
    }
  };

  const carregarUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const groups = await ShareService.listarUserGroups();
      setUserGroups(groups);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (!addVehicleToGroup) setSelectedVehicleGroup(null);
  }, [addVehicleToGroup]);

  useEffect(() => {
    if (!shareVehicle) setSelectedShareGroup(null);
  }, [shareVehicle]);

  async function handleSubmit() {
    if (!name || !client) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome da rotina e selecione um cliente.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name,
      client,
      clientIdentificator,
      groupIdentificator,
      addVehicleToGroup,
      vehicleGroup: selectedVehicleGroup?.id ?? null,
      shareVehicle,
      shareGroup: selectedShareGroup?.id ?? null,
    };

    try {
      if (routineId && routineId !== null) {
        console.log("Atualizando rotina ID:", routineId);
        await updateRoutine({ id: routineId, data });
        toast({
          title: "Rotina atualizada",
          description: "A rotina foi atualizada com sucesso.",
        });
      } else {
        console.log("Criando nova rotina");
        await createRoutine(data);
        toast({
          title: "Rotina criada",
          description: "A rotina foi criada com sucesso.",
        });
      }
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar rotina:", error);
      toast({
        title: "Erro",
        description: routineId ? "Erro ao atualizar rotina." : "Erro ao criar rotina.",
        variant: "destructive",
      });
    }
  }

  const isLoading = isCreating || isUpdating;

  return (
    <div className="space-y-4">
      <div>
        <Label>Rotina</Label>
        <InputWithIcon
          placeholder="Nome da rotina"
          icon={<Tag className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>Cliente</Label>
        <select
          className="w-full h-10 rounded-md border border-input bg-background px-3"
          value={client}
          onChange={(e) => setClient(e.target.value)}
        >
          <option value="">Selecione um cliente</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <InputWithIcon
        placeholder="Identificador do cliente"
        icon={<SearchCheck className="h-4 w-4" />}
        value={clientIdentificator}
        onChange={(e) => setClientIdentificator(e.target.value)}
      />

      <InputWithIcon
        placeholder="Identificador do grupo de veículos"
        icon={<ScanSearch className="h-4 w-4" />}
        value={groupIdentificator}
        onChange={(e) => setGroupIdentificator(e.target.value)}
      />

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label>Adicionar veículo a grupo</Label>
          <p className="text-xs text-muted-foreground">
            Habilita alocação automática de veículos
          </p>
        </div>
        <Switch checked={addVehicleToGroup} onCheckedChange={setAddVehicleToGroup} />
      </div>

      {addVehicleToGroup && (
        <GroupSelector
          vehicleGroups={vehicleGroups}
          selectedGroup={selectedVehicleGroup}
          onSelectGroup={setSelectedVehicleGroup}
          loading={loadingGroups}
          onRefresh={carregarGrupos}
          open={openVehicleGroup}
          onOpenChange={setOpenVehicleGroup}
          label="Grupo de veículos"
        />
      )}

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label>Compartilhar veículo</Label>
          <p className="text-xs text-muted-foreground">
            Habilita compartilhamento com outra conta
          </p>
        </div>
        <Switch checked={shareVehicle} onCheckedChange={setShareVehicle} />
      </div>

      {shareVehicle && (
        <SelectGroup
          userGroups={userGroups}
          selectedGroup={selectedShareGroup}
          loading={loadingGroups}
          onSelect={setSelectedShareGroup}
          onReload={carregarUserGroups}
        />
      )}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Salvando..." : routineId ? "Atualizar" : "Criar rotina"}
        </Button>
      </div>
    </div>
  );
}