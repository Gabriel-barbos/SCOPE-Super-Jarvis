import { useState } from "react";
import { RefreshCw, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ComboboxItem {
  id: string;
  description: string;
}

interface ComboboxSelectorProps {
  label: string;
  items: ComboboxItem[];
  selectedItem: ComboboxItem | null;
  loading: boolean;
  onSelect: (item: ComboboxItem) => void;
  onReload: () => void;
  placeholder?: string;
  emptyMessage?: string;
}

export default function ComboboxSelector({
  label,
  items,
  selectedItem,
  loading,
  onSelect,
  onReload,
  placeholder = "Buscar...",
  emptyMessage = "Nenhum item encontrado.",
}: ComboboxSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : selectedItem ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span>{selectedItem.description}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Selecione...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.description}
                    onSelect={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.description}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={onReload}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin mr-2" />
        ) : (
          <RefreshCw className="w-3 h-3 mr-2" />
        )}
        Atualizar
      </Button>
    </div>
  );
}