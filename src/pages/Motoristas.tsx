import { useState } from "react";
import { UserCheck, Users, Eye, CheckCircle, XCircle } from "lucide-react";
import { ExcelButtons } from "@/components/ExcelButtons";
import InsertManyTable from "@/components/InsertManyTable";
import { ImportExcelModal } from "@/components/ImportModal";
import DriverService from "@/services/DriverService";
import loading from "../assets/loadingDriver.gif"

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

export default function Motoristas() {
  const [openImport, setOpenImport] = useState(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'running' | 'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const motoristasColumns = [
    { key: "nomeCompleto", label: "Nome Completo", required: true },
    { key: "codigoMzone", label: "Código MZone", required: true },
    { key: "idDriver", label: "ID Driver", required: false },
  ];

  const handleSubmitMotoristas = async (data: any[]) => {
    if (!data.length) return alert("Nenhum motorista para cadastrar.");

    setIsSubmitting(true);
    setOpenDialog(true);
    setProgress(0);
    setTotal(data.length);
    setLog([]);
    setShowDetails(false);
    setExecutionStatus('running');
    setErrorMessage('');

    try {
      await DriverService.cadastrarMotoristasEmLote(
        data,
        10,
        (sent, total, nome) => {
          setProgress(sent);
          setTotal(total);
          setLog((prev) => [...prev, `Motorista ${nome} criado com sucesso!`]);
        }
      );
      
      // Sucesso - todos os motoristas foram cadastrados
      setExecutionStatus('success');
    } catch (error: any) {
      console.error("Erro ao cadastrar motoristas:", error);
      setExecutionStatus('error');
      setErrorMessage(error?.message || 'Erro desconhecido ao cadastrar motoristas');
      setLog((prev) => [...prev, `❌ Erro ao cadastrar motoristas: ${error?.message || 'Erro desconhecido'}`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    alert("Aqui você pode gerar e baixar o modelo de motoristas...");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setShowDetails(false);
    setExecutionStatus(null);
    setErrorMessage('');
    setLog([]);
    setProgress(0);
    setTotal(0);
  };

  const renderDialogContent = () => {
    if (executionStatus === 'success') {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-600">Cadastro Concluído com Sucesso!</h3>
            <p className="text-sm text-muted-foreground">
              {total} motorista{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''} com sucesso.
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
            <h3 className="text-lg font-semibold text-red-600">Erro no Cadastro</h3>
            <p className="text-sm text-muted-foreground">
              {errorMessage}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {progress} de {total} motoristas foram processados antes do erro.
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
        {/* GIF de Loading */}
        <div className="flex justify-center">
          <img 
            src={loading} 
            alt="Cadastrando motoristas..." 
            className="w-40 h-40 object-contain"
          />
        </div>

        {/* Contador */}
        <div className="text-center">
          <p className="text-lg font-semibold">
            {progress}/{total} motoristas processados
          </p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <UserCheck className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Cadastrar Motoristas</h1>
        </div>
        <ExcelButtons
          onDownload={handleDownloadTemplate}
          onImport={() => setOpenImport(true)}
        />
      </div>

      <InsertManyTable
        columns={motoristasColumns}
        initialData={importedData.length ? importedData : []}
        onSubmit={handleSubmitMotoristas}
        submitButtonText={isSubmitting ? "Enviando..." : "Cadastrar Motoristas"}
        icon={Users}
        disabled={isSubmitting}
      />

      <ImportExcelModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        columns={motoristasColumns}
        onImport={setImportedData}
      />

      {/* Dialog de progresso melhorado */}
      <Dialog open={openDialog} onOpenChange={!isSubmitting ? handleCloseDialog : undefined}>
        <DialogContent className="sm:max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>
              {executionStatus === 'success' ? 'Cadastro Concluído' : 
               executionStatus === 'error' ? 'Erro no Cadastro' : 
               'Cadastrando motoristas...'}
            </DialogTitle>
            {executionStatus === 'running' && (
              <DialogDescription>
                Aguarde enquanto os motoristas são cadastrados no sistema.
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