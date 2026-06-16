import { useEffect, useRef } from "react";
import { Check, AlertCircle, X, Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { OdometerSummary, OdometerResultStatus } from "@/services/OdometerService";

interface OdometerProgressModalProps {
  open: boolean;
  onClose: () => void;
  isProcessing: boolean;
  executionStatus: "running" | "success" | "error" | null;
  progress: { current: number; total: number; currentChassi: string; status: string };
  log: string[];
  summary: OdometerSummary | null;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
}

export function OdometerProgressModal({
  open,
  onClose,
  isProcessing,
  executionStatus,
  progress,
  log,
  summary,
  showDetails,
  setShowDetails,
}: OdometerProgressModalProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom on update
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [log]);

  // Auxiliar para retornar o ícone correto baseado no conteúdo do log
  const getLogIcon = (logText: string) => {
    if (logText.includes("Ajustado")) {
      return <Check className="w-3.5 h-3.5 text-green-400" />;
    }
    if (logText.includes("Não encontrado") || logText.includes("Ñ Encontrado")) {
      return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />;
    }
    if (logText.includes("Erro") || logText.includes("Erro fatal")) {
      return <X className="w-3.5 h-3.5 text-red-400" />;
    }
    return <Info className="w-3.5 h-3.5 text-blue-400" />;
  };

  const renderDialogContent = () => {
    if (executionStatus === "success") {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-400">Processamento Concluído</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Todos os {progress.total} veículos foram processados.
            </p>
          </div>

          {summary && (
            <div className="grid grid-cols-4 gap-2 text-center my-4">
              <div className="bg-green-950/40 border border-green-900/50 p-2 rounded-lg">
                <p className="text-[10px] text-green-400 uppercase font-semibold">Sucesso</p>
                <p className="text-xl font-bold text-green-300">{summary.sucessos}</p>
              </div>
              <div className="bg-red-950/40 border border-red-900/50 p-2 rounded-lg">
                <p className="text-[10px] text-red-400 uppercase font-semibold">Falha</p>
                <p className="text-xl font-bold text-red-300">{summary.falhas}</p>
              </div>
              <div className="bg-yellow-950/40 border border-yellow-900/50 p-2 rounded-lg">
                <p className="text-[10px] text-yellow-400 uppercase font-semibold">Ñ Encontrado</p>
                <p className="text-xl font-bold text-yellow-300">{summary.naoEncontrados}</p>
              </div>
              <div className="bg-muted p-2 rounded-lg border border-border">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Inválidos</p>
                <p className="text-xl font-bold text-foreground">{summary.invalidos}</p>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              size="sm"
            >
              {showDetails ? "Ocultar" : "Ver"} Ver detalhes
            </Button>
          </div>
        </div>
      );
    }

    if (executionStatus === "error") {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <XCircle className="w-16 h-16 text-red-500 animate-bounce" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-400">Erro no Processamento</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ocorreu um problema ao executar a operação.
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              size="sm"
            >
              {showDetails ? "Ocultar" : "Ver"} Detalhes do Erro
            </Button>
          </div>
        </div>
      );
    }

    // Estado Executando (Running)
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            Ajustando Odômetros: {progress.current} de {progress.total}
          </p>
          {progress.currentChassi && (
            <p className="text-sm text-muted-foreground mt-1">
              Processando: <span className="font-mono text-primary">{progress.currentChassi}</span>
            </p>
          )}
        </div>

        <Progress value={(progress.current / progress.total) * 100} className="w-full h-3" />

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Processando lote...</span>
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            size="sm"
            className="text-xs text-primary hover:text-primary/80"
          >
            {showDetails ? "Ocultar" : "Ver"} Log em tempo real
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={!isProcessing ? onClose : undefined}>
      <DialogContent className="sm:max-w-lg w-full max-h-[85vh] overflow-y-auto border border-border bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {executionStatus === "success"
              ? "Ajuste Concluído"
              : executionStatus === "error"
              ? "Falha no Processamento"
              : "Ajustando Odômetros..."}
          </DialogTitle>
          {executionStatus === "running" && (
            <DialogDescription className="text-muted-foreground">
              Por favor, aguarde enquanto o lote é processado pelo sistema.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">{renderDialogContent()}</div>

        {/* Log de execução simples com rolagem automática */}
        {showDetails && log.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
              Log de Execução
            </h4>
            <ScrollArea ref={scrollAreaRef} className="h-44 border border-border rounded-lg p-3 bg-muted font-mono text-[11px]">
              <div className="space-y-1.5 pr-2">
                {log.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-foreground/90">
                    <span className="shrink-0 mt-0.5">{getLogIcon(item)}</span>
                    <span className="break-all">{item}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={isProcessing}
            onClick={onClose}
            variant={executionStatus === "success" ? "default" : "secondary"}
            className={executionStatus === "success" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
          >
            {executionStatus === "success" ? "Concluir" : "Fechar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
