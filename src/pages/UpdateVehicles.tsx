import { useState } from "react";
import { ClipboardPen, Eye, CheckCircle, XCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { ExcelButtons } from "@/components/global/ExcelButtons";
import InsertManyTable from "@/components/InsertManyTable";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SetupResultComponent from "@/components/SetupResult";
import { ImportExcelModal } from "@/components/global/ImportModal";
import SetupVeiculosService, {
  SetupData,
  SetupResult,
} from "@/services/SetupService";
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
import { toast } from "sonner";

const SetupColumns = [
  { key: "unitId", label: "ID unidade", required: true },
  { key: "vin", label: "Chassi", required: true },
  { key: "model", label: "Modelo", required: true },
  { key: "plate", label: "Placa", required: false },
  { key: "vehicle_group", label: "Grupo de veículos", required: false },
  { key: "odometer", label: "Odômetro", required: false },
];

export default function VeiculosAtualizar() {
  const [openImport, setOpenImport] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSecondarySetup, setIsSecondarySetup] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentItem, setCurrentItem] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'running' | 'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [setupSummary, setSetupSummary] = useState<any>(null);

  async function handleDownloadTemplate() {
    try {
      const response = await fetch('/templates/Setup_template.xlsx');
      if (!response.ok) {
        throw new Error('Template não encontrado');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Setup_Veiculos.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      toast.error('Erro ao baixar o template. Tente novamente mais tarde :(');
    }
  }

  async function handleSubmit(data: any[]) {
    if (!data.length) return alert("Nenhum veículo para realizar setup.");

    setIsSubmitting(true);
    setOpenDialog(true);
    setProgress(0);
    setTotal(data.length);
    setCurrentItem(null);
    setLog([]);
    setShowDetails(false);
    setExecutionStatus('running');
    setErrorMessage('');
    setSetupSummary(null);

    try {
      const payload: SetupData[] = data.map((row) => ({
        id: row.unitId,
        vin: row.vin,
        model: row.model,
        plate: row.plate || undefined,
        vehicle_group: row.vehicle_group || undefined,
        odometer: row.odometer ? Number(row.odometer) : undefined,
        isSecondarySetup,
      }));

      const results: SetupResult[] =
        await SetupVeiculosService.processarSetupEmLote(
          payload,
          (processed, total, current) => {
            setProgress(processed);
            setTotal(total);
            setCurrentItem(current?.identifier ?? null);
            if (current?.identifier) {
              setLog((prev) => [...prev, `setup do ID ${current.identifier} feito com sucesso!`]);
            }
          }
        );

      const report = SetupVeiculosService.gerarRelatorio(results);
      setSetupSummary(report);
      setExecutionStatus('success');
    } catch (error: any) {
      console.error("Erro no setup:", error);
      setExecutionStatus('error');
      setErrorMessage(error?.message || 'Erro desconhecido ao realizar setup dos veículos');
      setLog((prev) => [...prev, ` Erro ao fazer setup dos veículos: ${error?.message || 'Erro desconhecido'}`]);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setShowDetails(false);
    setExecutionStatus(null);
    setErrorMessage('');
    setLog([]);
    setProgress(0);
    setTotal(0);
    setCurrentItem(null);
  };

  // Renderiza o sucesso 
  const renderDialogContent = () => {
    if (executionStatus === 'success') {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-600">Setup Concluído com Sucesso!</h3>
            <p className="text-sm text-muted-foreground">
              {total} veículo{total !== 1 ? 's' : ''} configurado{total !== 1 ? 's' : ''} com sucesso.
            </p>
          </div>
          {log.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showDetails ? 'Ocultar' : 'Ver'} Detalhes
            </Button>
          )}
        </div>
      );
    }

    if (executionStatus === 'error') {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-600">Erro no Setup</h3>
            <p className="text-sm text-muted-foreground">
              {errorMessage}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {progress} de {total} veículos foram processados antes do erro.
            </p>
          </div>
          {log.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {showDetails ? 'Ocultar' : 'Ver'} Detalhes
            </Button>
          )}
        </div>
      );
    }

    // Estado de execução (running)
    return (
      <div className="space-y-4">
        {/* Contador */}
        <div className="text-center">
          {/* add gif */}
          <p className="text-lg font-semibold">
            {progress}/{total} veículos processados
          </p>
          {currentItem && (
            <p className="text-sm text-muted-foreground mt-1">
              Processando: {currentItem}
            </p>
          )}
        </div>

        {/* Barra de Progresso */}
        <Progress value={(progress / total) * 100} className="w-full" />

        {/* Botão Ver Detalhes */}
        {log.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="link"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
              size="sm"
            >
              {showDetails ? 'Ocultar' : 'Ver'} Detalhes
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <ClipboardPen className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Setup Manual
          </h1>
        </div>

        <ExcelButtons
          onDownload={handleDownloadTemplate}
          onImport={() => setOpenImport(true)}
        />
      </div>

      <p className="text-muted-foreground">
        Realizar Setup Manual dos veículos
      </p>

      {/* Switch */}
      <div className="flex items-center gap-2">
        <Switch
          id="secondary-setup"
          checked={isSecondarySetup}
          onCheckedChange={setIsSecondarySetup}
        />
        <Label htmlFor="secondary-setup">
          Dispositivo secundário
        </Label>
      </div>

      {/* Tabela */}
      <InsertManyTable
        columns={SetupColumns}
        initialData={importedData.length ? importedData : []}
        onSubmit={handleSubmit}
        submitButtonText={
          isSubmitting ? "Processando..." : "Realizar Setup dos Veículos"
        }
        icon={ClipboardPen}
        disabled={isSubmitting}
      />

      <ImportExcelModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        columns={SetupColumns}
        onImport={setImportedData}
      />

      {/* Resultado */}
      {setupSummary && !openDialog && (
        <SetupResultComponent
          result={setupSummary}
          title="Resultado da Configuração"
        />
      )}

      {/* Dialog de progresso */}
      <Dialog open={openDialog} onOpenChange={!isSubmitting ? handleCloseDialog : undefined}>
        <DialogContent className="sm:max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>
              {executionStatus === 'success' ? 'Setup Concluído' : 
               executionStatus === 'error' ? 'Erro no Setup' : 
               'Configurando veículos...'}
            </DialogTitle>
            {executionStatus === 'running' && (
              <DialogDescription>
                Aguarde enquanto os veículos são configurados no sistema.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="py-4">
            {renderDialogContent()}
          </div>

          {/* Lista de detalhes (condicional) */}
          {showDetails && log.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Detalhes da Execução:</h4>
              <ScrollArea className="h-32 border rounded p-2 bg-background">
                {log.map((item, index) => (
                  <p key={index} className="text-xs text-foreground mb-1">
                    {item}
                  </p>
                ))}
              </ScrollArea>
            </div>
          )}

          <DialogFooter>
            <Button
              disabled={isSubmitting}
              onClick={handleCloseDialog}
              variant={executionStatus === 'success' ? 'default' : 'secondary'}
            >
              {executionStatus === 'success' ? 'Concluir' : 'Fechar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}