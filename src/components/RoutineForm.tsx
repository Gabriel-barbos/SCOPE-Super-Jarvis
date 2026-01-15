    import { useEffect, useState } from "react";
import { InputWithIcon } from "@/components/global/InputWithIcon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Tag, Layers, Share2 } from "lucide-react";
import { useRoutines } from "@/hooks/useRoutines";
import { useClients } from "@/hooks/useClients";

import SelectGroup from "./share/SelectGroup";
import GroupSelector from "./global/GroupSelector";

import vehicleService from "@/services/VehicleGroupService";
import ShareService from "@/services/ShareService";

export function RoutineForm({ onSuccess }: { onSuccess?: () => void }) {
  const { createRoutine, isCreating } = useRoutines();
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

  /** carregar grupos de veículos */
  const carregarGrupos = async () => {
    setLoadingGroups(true);
    try {
      const grupos = await vehicleService.listarGrupos();
      setVehicleGroups(grupos);
    } finally {
      setLoadingGroups(false);
    }
  };

  /** carregar grupos de share */
  const carregarUserGroups = async () => {
    setLoadingGroups(true);
    try {
      const groups = await ShareService.listarUserGroups();
      setUserGroups(groups);
    } finally {
      setLoadingGroups(false);
    }
  };

  /** resetar campos condicionais */
  useEffect(() => {
    if (!addVehicleToGroup) {
      setSelectedVehicleGroup(null);
    }
  }, [addVehicleToGroup]);

  useEffect(() => {
    if (!shareVehicle) {
      setSelectedShareGroup(null);
    }
  }, [shareVehicle]);

  async function handleSubmit() {
    await createRoutine({
      name,
      client,
      clientIdentificator,
      groupIdentificator,

      addVehicleToGroup,
      vehicleGroup: selectedVehicleGroup?.id ?? null,

      shareVehicle,
      shareGroup: selectedShareGroup?.id ?? null,
    });

    onSuccess?.();
  }

  return (
    <div className="space-y-4">

        <div>
            <Label>Rotina</Label>
                   {/* Nome */}
      <InputWithIcon
        placeholder="Nome da rotina"
          icon={<Tag className="h-4 w-4" />}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

        </div>
   
      {/* Cliente */}
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
        placeholder="Client Identificator"
        icon={<User className="h-4 w-4" />}
        value={clientIdentificator}
        onChange={(e) => setClientIdentificator(e.target.value)}
      />

      <InputWithIcon
        placeholder="Group Identificator"
        icon={<Layers className="h-4 w-4" />}
        value={groupIdentificator}
        onChange={(e) => setGroupIdentificator(e.target.value)}
      />

      {/* ADD VEHICLE */}
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

      {/* SHARE */}
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

      {/* ACTIONS */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleSubmit} disabled={isCreating}>
          Criar rotina
        </Button>
      </div>
    </div>
  );
}
