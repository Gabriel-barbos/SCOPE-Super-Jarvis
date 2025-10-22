import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type IdentifierType = "description" | "vin";

interface VehicleInputProps {
  identifierType: IdentifierType;
  onIdentifierTypeChange: (type: IdentifierType) => void;
  vehicleData: string;
  onVehicleDataChange: (data: string) => void;
  disabled?: boolean;
}

export default function VehicleInput({
  identifierType,
  onIdentifierTypeChange,
  vehicleData,
  onVehicleDataChange,
  disabled = false
}: VehicleInputProps) {
  const vehicleCount = vehicleData.split('\n').filter(line => line.trim().length > 0).length;

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Tipo de Identificação
        </label>
        <Select
          value={identifierType}
          onValueChange={(value: IdentifierType) => onIdentifierTypeChange(value)}
          disabled={disabled}
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
            : "Use o número do chassi para identificar o veículo"}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {identifierType === "description" ? "Descrições dos Veículos" : "Chassis dos Veículos"}
        </label>
        <Textarea
          placeholder={identifierType === "description"
            ? "Cole as descrições dos veículos aqui (uma por linha)"
            : "Cole os números de chassi aqui (um por linha)"}
          value={vehicleData}
          onChange={(e) => onVehicleDataChange(e.target.value)}
          className="min-h-[120px] transition-smooth font-mono"
          disabled={disabled}
        />
        {vehicleCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {vehicleCount} veículo{vehicleCount !== 1 ? 's' : ''} para processar
          </p>
        )}
      </div>
    </>
  );
}