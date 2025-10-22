import { FolderMinus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  vehicleCount: number;
  identifierType: "description" | "vin";
  groupName?: string;
  actionType?: "add" | "remove";
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  vehicleCount,
  identifierType,
  groupName,
  actionType = "remove"
}: ConfirmDialogProps) {
  const Icon = actionType === "add" ? FolderPlus : FolderMinus;
  const actionText = actionType === "add" ? "adicionar" : "retirar";
  const actionTextPast = actionType === "add" ? "Adição" : "Remoção";
  const preposition = actionType === "add" ? "ao" : "do";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            Confirmar {actionTextPast}
          </DialogTitle>
          <DialogDescription>
            Você está prestes a {actionText} <strong>{vehicleCount} veículo{vehicleCount !== 1 ? 's' : ''}</strong> por <strong>{identifierType === "description" ? "Descrição" : "Chassi"}</strong> {preposition} grupo:
            <br />
            <strong className="text-foreground">{groupName}</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}