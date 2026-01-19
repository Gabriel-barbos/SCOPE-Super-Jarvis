import { useState } from "react";
import { Upload, Play, X, AlertCircle, CheckCircle2, Loader2,Copy,FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import engineService from "@/services/EngineService";

interface UploadComponentProps {
  onExecute: () => void;
  isAnimationActive: boolean;
}

interface TestResult {
  summary: {
    totalExcelRows: number;
    matchedRoutines: number;
    errorCount: number;
    mode: string;
  };
  routines: Array<{
    routineId: string;
    routineName: string;
    client: string;
    executedActions: any;
  }>;
  errors: Array<{
    line: number;
    chassi: string;
    cliente: string;
    grupo?: string;
    reason: string;
  }>;
}

interface ExecutionResult extends TestResult {
  summary: TestResult['summary'] & {
    mode?: string;
  };
}

export function UploadComponent({ onExecute, isAnimationActive }: UploadComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setTestResult(null);
    setExecutionResult(null);
    setError(null);
    setIsTestLoading(true);

    try {
      const result = await engineService.testEngine(selectedFile);
      setTestResult(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao processar planilha');
      console.error('Erro ao testar:', err);
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!file) return;

    setIsExecuting(true);
    setExecutionResult(null);
    setError(null);
    onExecute(); // Ativa animação

    try {
      const result = await engineService.executeEngine(file);
      setExecutionResult(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao executar rotinas');
      console.error('Erro ao executar:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTestResult(null);
    setExecutionResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">

      {!file ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">Carregar Planilha</p>
              <p className="text-sm text-muted-foreground mt-1">
                Arraste ou clique para selecionar (.xlsx, .xls)
              </p>
            </div>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <X className="w-4 h-4" />
            </Button>
          </div>


          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isTestLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Analisando planilha...</span>
            </div>
          )}


          {testResult && !isExecuting && !executionResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Total de Linhas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {testResult.summary.totalExcelRows}
                  </p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-muted-foreground">Rotinas Encontradas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {testResult.summary.matchedRoutines}
                  </p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm text-muted-foreground">Erros</p>
                  <p className="text-2xl font-bold text-red-600">
                    {testResult.summary.errorCount}
                  </p>
                </div>
              </div>

              {/* Routines Preview */}
              {testResult.routines.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Rotinas que serão executadas:</h3>
                  {testResult.routines.map((routine) => (
                    <div
                      key={routine.routineId}
                      className="p-3 bg-muted rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{routine.routineName}</p>
                        <p className="text-sm text-muted-foreground">
                          Cliente: {routine.client}
                        </p>
                      </div>
                      <div className="text-right">
                        {routine.executedActions.addVehicleToGroup && (
                          <p className="text-sm text-muted-foreground">
                            {routine.executedActions.addVehicleToGroup.totalVehicles} veículos
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Errors Preview */}
              {testResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-red-600">Linhas com erro:</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {testResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-red-500/10 rounded border border-red-500/20 text-sm"
                      >
                        <p>
                          Linha {err.line}: {err.chassi} - {err.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleExecute}
                className="w-full"
                size="lg"
                disabled={testResult.summary.matchedRoutines === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Executar Rotinas
              </Button>
            </div>
          )}

          {/* Executing */}
          {isExecuting && (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Executando rotinas...</p>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto processamos os veículos
              </p>
            </div>
          )}

          {/* Execution Result */}
          {executionResult && (
            <div className="space-y-4">
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Execução concluída com sucesso!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-muted-foreground">Total Processado</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {executionResult.summary.totalExcelRows}
                  </p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-muted-foreground">Rotinas Executadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {executionResult.summary.matchedRoutines}
                  </p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-sm text-muted-foreground">Erros</p>
                  <p className="text-2xl font-bold text-red-600">
                    {executionResult.summary.errorCount}
                  </p>
                </div>
              </div>

              {/* Summary por Rotina */}
              {executionResult.routines.map((routine) => {
                const addResults = routine.executedActions.addVehicleToGroup || [];
                const shareResults = routine.executedActions.shareVehicle || [];

                const addSuccess = addResults.filter((r: any) => r.success).length;
                const addErrors = addResults.filter((r: any) => !r.success);

                const shareSuccess = shareResults.filter((r: any) => r.success).length;
                const shareErrors = shareResults.filter((r: any) => !r.success);

                const allErrors = [...addErrors, ...shareErrors];

                return (
                  <div key={routine.routineId} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{routine.routineName}</h4>
                        <p className="text-sm text-muted-foreground">{routine.client}</p>
                      </div>
                    </div>

                    {/* Success Summary */}
                    <div className="grid grid-cols-2 gap-3">
                      {routine.executedActions.addVehicleToGroup && (
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-xs text-muted-foreground">Adicionados ao Grupo</p>
                          <p className="text-xl font-bold text-green-600">
                            {addSuccess} / {addResults.length}
                          </p>
                        </div>
                      )}

                      {routine.executedActions.shareVehicle && (
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-xs text-muted-foreground">Compartilhamentos</p>
                          <p className="text-xl font-bold text-green-600">
                            {shareSuccess} / {shareResults.length}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Errors List */}
                    {allErrors.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-red-600">
                            Erros ({allErrors.length})
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const errorText = allErrors
                                .map((err: any) => `${err.chassi}\t${err.error}`)
                                .join('\n');
                              navigator.clipboard.writeText(errorText);
                            }}
                            className="text-xs"
                          >
                           <Copy />
                           Copiar
                          </Button>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2 bg-muted/50">
                          {allErrors.map((result: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-sm p-2 rounded bg-red-500/10 text-red-600 font-mono"
                            >
                              <span className="font-semibold">{result.chassi}</span>: {result.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Errors from Matching */}
              {executionResult.errors && executionResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-red-600">
                      Veiculos sem rotina cadastrada ({executionResult.errors.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const errorText = `Linha\tChassi\tCliente\tGrupo\tMotivo\n` +
                          executionResult.errors
                            .map((err) => `${err.line}\t${err.chassi}\t${err.cliente}\t${err.grupo || ''}\t${err.reason}`)
                            .join('\n');
                        navigator.clipboard.writeText(errorText);
                      }}
                    >
                      Copiar lista
                      <Copy className="w-4 h-4 mr-2" />
                    </Button>
                  </div>

             
                </div>
              )}

              <Button onClick={handleReset} variant="outline" className="w-full">
                Nova Execução
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}