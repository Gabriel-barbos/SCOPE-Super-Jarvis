import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Copy } from "lucide-react";
import { useState } from "react";

import type { ResultDialogProps } from "../../lib/types";

export default function ResultDialog({
  open,
  status,
  title,
  description,
  summary,
  errors = [],
  onClose,
  onReset,
}: ResultDialogProps) {
  const [copied, setCopied] = useState(false);

  const iconMap = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    partial: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
  };

  const copyErrors = async () => {
    await navigator.clipboard.writeText(errors.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {iconMap[status]}
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        {summary && (
          <div className="text-sm mt-2">
            <span className="font-medium">
              {summary.success}/{summary.total}
            </span>{" "}
            itens processados com sucesso
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4 p-3 border rounded-md bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">
                ❌ Não encontrados ({errors.length})
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={copyErrors}
                className="flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>

            <div className="max-h-40 overflow-y-auto text-xs space-y-1 font-mono">
              {errors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {onReset && (
            <Button variant="outline" onClick={onReset}>
              Limpar dados
            </Button>
          )}

          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
