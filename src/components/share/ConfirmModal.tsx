// components/share/ConfirmModal.tsx
import { CheckCircle } from "lucide-react";

interface ConfirmModalProps {
  show: boolean;
  vehicleCount: number;
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  show,
  vehicleCount,
  groupName,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4 border border-border">
        
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Confirmar Compartilhamento
          </h3>
        </div>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          Você está prestes a compartilhar{" "}
          <strong>{vehicleCount} veículo{vehicleCount !== 1 ? "s" : ""}</strong>{" "}
          com o grupo <strong>{groupName}</strong>.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-muted transition-fast"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-fast"
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}
