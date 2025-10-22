import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  success: boolean;
  groupName?: string;
  onReset?: () => void;
  actionType?: "add" | "remove";
}

export default function ResultDialog({
  open,
  onOpenChange,
  success,
  groupName,
  onReset,
  actionType = "remove"
}: ResultDialogProps) {
  const actionText = actionType === "add" ? "adicionados ao" : "retirados do";
  const successText = actionType === "add" ? "Veículos Adicionados!" : "Veículos Retirados!";
  const errorText = actionType === "add" ? "Erro na Adição" : "Erro na Remoção";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            {success ? successText : errorText}
          </DialogTitle>
          <DialogDescription>
            {success ? (
              <div className="space-y-2">
                <p>
                  Os veículos foram {actionText} grupo <strong>{groupName}</strong>.
                </p>
                <div className="text-green-600">
                  Operação concluída com sucesso
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p>Ocorreu um erro ao processar os veículos.</p>
                <div className="text-red-600">
                  Verifique o console para mais detalhes
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {onReset && (
            <Button onClick={onReset} variant="outline">
              Limpar Dados
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}