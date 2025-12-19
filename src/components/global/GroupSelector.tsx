import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface VehicleGroup {
  id: string;
  description: string;
}

interface GroupSelectorProps {
  vehicleGroups: VehicleGroup[];
  selectedGroup: VehicleGroup | null;
  onSelectGroup: (group: VehicleGroup) => void;
  loading: boolean;
  onRefresh: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string;
}

export default function GroupSelector({
  vehicleGroups,
  selectedGroup,
  onSelectGroup,
  loading,
  onRefresh,
  open,
  onOpenChange,
  label = "Grupo de Veículos"
}: GroupSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      </div>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between transition-smooth"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Carregando grupos...</span>
              </div>
            ) : selectedGroup ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{selectedGroup.description}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Selecione um grupo...</span>
            )}
            <RefreshCw className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                      onSelectGroup(group);
                      onOpenChange(false);
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
        onClick={onRefresh}
        disabled={loading}
        className="bg-white hover:bg-primary/90 text-primary-foreground transition-smooth"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin mr-1" />
        ) : (
          <RefreshCw className="w-3 h-3 mr-1" />
        )}
        Atualizar
      </Button>
    </div>
  );
}