import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";

interface ResultModalProps {
  open: boolean;
  success: boolean;
  groupName: string;
  progress: {
    success: number;
    total: number;
    errors: string[];
  };
  onClose: () => void;
  onReset: () => void;
}

export default function ResultModal({
  open,
  success,
  groupName,
  progress,
  onClose,
  onReset
}: ResultModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            {success ? "Compartilhamento Concluído!" : "Erro no Compartilhamento"}
          </DialogTitle>

          <DialogDescription asChild>
            {success ? (
              <div className="space-y-2">
                <div>
                  Os veículos foram processados com o grupo{" "}
                  <strong>{groupName}</strong>.
                </div>

                <div className="text-green-600">
                  ✅ {progress.success}/{progress.total} veículos compartilhados com sucesso
                </div>

                {progress.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="font-medium mb-2 text-red-600 dark:text-red-400">
                      ❌ Erros encontrados ({progress.errors.length}):
                    </div>

                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {progress.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 dark:text-red-400">
                          • {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                Ocorreu um erro durante o compartilhamento.{" "}
                <span className="text-red-600">
                  {progress.success}/{progress.total} veículos processados
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <button
            onClick={onReset}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-fast"
          >
            Limpar Dados
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-fast"
          >
            Fechar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}