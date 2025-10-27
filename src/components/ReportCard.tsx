import { useState } from "react";
import { FileChartColumn, FileDown, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import vehicleExportService from "@/services/ReportService";

function ReportCard() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [result, setResult] = useState<{ success: boolean; message: string; total: number } | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleGerarRelatorio = async () => {
    // Reset dos estados
    setLoading(true);
    setResult(null);
    setShowModal(false);
    setProgress({ current: 0, total: 0, status: "Iniciando exportação..." });

    // Chama o service com callback de progresso
    const resultado = await vehicleExportService.exportarVeiculos(
      (current, total, status) => {
        setProgress({ current, total, status });
      }
    );

    // Atualiza resultado final e abre modal
    setResult(resultado);
    setLoading(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setResult(null);
  };

  // Calcula percentual do progresso
  const progressPercent = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  return (
    <>
      <Card className="p-6 shadow-md border border-border">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <FileChartColumn className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold">Relatório Mzone</h2>
            <p className="text-sm text-muted-foreground">
              Extrair lista de placa, chassi, descrição e ID de todos os veículos
            </p>

            {/* Área de Progresso */}
            {loading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{progress.status}</span>
                  {progress.total > 0 && (
                    <span className="font-medium text-primary">
                      {progressPercent}%
                    </span>
                  )}
                </div>
                <Progress value={progressPercent} className="h-2" />
                {progress.total > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    {progress.current.toLocaleString()} / {progress.total.toLocaleString()} veículos
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <Button
              variant="default"
              onClick={handleGerarRelatorio}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  Gerar Relatório
                  <FileDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal de Resultado */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {result?.success ? (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              )}
              <div className="flex-1">
                <DialogTitle>
                  {result?.success ? "Relatório Gerado!" : "Erro na Exportação"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <DialogDescription className="pt-4 space-y-3">
            <p className="text-base text-foreground">
              {result?.message}
            </p>
            
            {result?.success && result.total > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total de veículos:</span>
                  <span className="text-lg font-bold text-primary">
                    {result.total.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  O arquivo foi baixado automaticamente para sua pasta de downloads.
                </p>
              </div>
            )}

            {!result?.success && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Deu errado, falar com Estagio
                </p>
              </div>
            )}
          </DialogDescription>

          <DialogFooter className="sm:justify-end">
            {result?.success ? (
              <Button onClick={handleCloseModal} className="w-full sm:w-auto">
                Fechar
              </Button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={handleCloseModal} className="flex-1">
                  Fechar
                </Button>
                <Button onClick={handleGerarRelatorio} className="flex-1">
                  Tentar Novamente
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ReportCard;