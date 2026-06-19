import { useState } from "react";
import { Gauge, Play, Loader2, RefreshCw, Clipboard, CheckCircle2, XCircle, AlertTriangle, Calendar } from "lucide-react";
import OdometerService, { OdometerInput, OdometerSummary } from "@/services/OdometerService";
import { OdometerProgressModal } from "@/components/OdometerProgressModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function OdometerUpdate() {
  const [inputText, setInputText] = useState("");
  const [usarData, setUsarData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentChassi: "", status: "" });
  const [log, setLog] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'running' | 'success' | 'error' | null>(null);
  const [summary, setSummary] = useState<OdometerSummary | null>(null);

  // Analisa as linhas digitadas em tempo real para pré-visualização
  const parsedPreview = OdometerService.parsePastedList(inputText, usarData);

  // Verifica se algum item do preview possui data de ajuste
  const hasDateColumn = usarData && parsedPreview.some((item) => item.dataAjuste);

  async function handleExecute() {
    const list = OdometerService.parsePastedList(inputText, usarData);

    if (list.length === 0) {
      toast.error("Nenhum veículo válido encontrado na lista!");
      return;
    }

    setIsProcessing(true);
    setOpenDialog(true);
    setProgress({ current: 0, total: list.length, currentChassi: "", status: "Iniciando..." });
    setLog([]);
    setShowDetails(false);
    setExecutionStatus('running');
    setSummary(null);

    try {
      const resultSummary = await OdometerService.ajustarOdometroEmLote(
        list,
        (current, total, currentItem) => {
          setProgress({
            current,
            total,
            currentChassi: currentItem?.chassi || "",
            status: currentItem?.status || "",
          });

          if (currentItem) {
            const statusLabel =
              currentItem.status === "success"
                ? "Ajustado"
                : currentItem.status === "not_found"
                ? "Nao encontrado"
                : currentItem.status === "invalid"
                ? "Invalido"
                : "Erro";

            const info = currentItem.vehicleInfo ? ` (${currentItem.vehicleInfo})` : "";
            setLog((prev) => [
              ...prev,
              `[${current}/${total}] Chassi: ${currentItem.chassi}${info} - Status: ${statusLabel}`,
            ]);
          }
        }
      );

      setSummary(resultSummary);
      setExecutionStatus('success');
      setInputText("");
      toast.success("Processo de ajuste de odômetro finalizado!");
    } catch (error: any) {
      console.error("Erro ao atualizar odômetros:", error);
      setExecutionStatus('error');
      setLog((prev) => [...prev, `Erro fatal: ${error?.message || "Erro desconhecido"}`]);
      toast.error("Ocorreu um erro ao processar o lote.");
    } finally {
      setIsProcessing(false);
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setShowDetails(false);
    setExecutionStatus(null);
    setLog([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">
              Ajuste de Odômetro
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ajuste o odômetro de múltiplos veículos de forma automatizada
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Input */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <label htmlFor="odometer-list" className="block text-sm font-semibold mb-2 text-foreground flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-blue-400" />
                Cole a Lista do Excel / CSV
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Formatos aceitos: <code className="bg-muted px-1 py-0.5 rounded text-primary">CHASSI ODOMETRO</code> ou <code className="bg-muted px-1 py-0.5 rounded text-primary">CHASSI ODOMETRO DATA</code>, separado por TAB, ponto e vírgula ou vírgula.
                {usarData
                  ? <> Exemplo com data: <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">ABC1234{"\t"}15000{"\t"}15/06/2025</code>.</>  
                  : <> Exemplo: <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">ABC1234,15000</code>.</>}
              </p>

              <p className="text-xs text-muted-foreground mb-3">
                
               <AlertTriangle className="w-4 h-4 text-blue-400" /> Certifique-se de selecionar o cliente correto no topo da pagina
              </p>
              
              <textarea
                id="odometer-list"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={usarData
                  ? "Cole as 3 colunas aqui...\nExemplo:\n3VVSS65N3RM113673\t15000\t15/06/2025\nWBAFG9C50DD123456\t35400\t01/03/2025"
                  : "Cole as colunas aqui...\nExemplo:\n3VVSS65N3RM113673\t15000\nWBAFG9C50DD123456\t35400"}
                className="w-full h-56 px-4 py-3 border border-border bg-input text-foreground rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                disabled={isProcessing}
              />
            </div>

            {/* Switch: usar data da planilha */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <Switch
                id="usar-data-switch"
                checked={usarData}
                onCheckedChange={setUsarData}
                disabled={isProcessing}
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="usar-data-switch" className="text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Usar data de ajuste personalizada
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {usarData
                    ? "A 3ª coluna será usada como data da medição. Se ausente ou inválida, usa a data atual."
                    : "Desativado — a data atual será usada como timestamp do ajuste."}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-muted-foreground">
                Total detectado: <strong className="text-foreground">{parsedPreview.length}</strong> {parsedPreview.length === 1 ? 'veículo' : 'veículos'}
              </span>
              
              <Button
                onClick={handleExecute}
                disabled={isProcessing || parsedPreview.length === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition duration-200 flex items-center gap-2 px-5 shadow-md"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>Ajustar Odômetros</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Lado Direito: Preview da Lista */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 h-[410px] flex flex-col">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400" />
            Pré-visualização do Parse ({parsedPreview.length})
          </h3>

          <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-input">
            {parsedPreview.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/60 sticky top-0">
                    <th className="p-2.5 font-semibold text-muted-foreground">Chassi/Identificador</th>
                    <th className="p-2.5 font-semibold text-muted-foreground text-right">Novo Odômetro</th>
                    {hasDateColumn && (
                      <th className="p-2.5 font-semibold text-muted-foreground text-right">Data Medição</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {parsedPreview.map((item, index) => (
                    <tr key={index} className="hover:bg-muted/40 transition">
                      <td className="p-2.5 font-mono text-foreground">{item.chassi}</td>
                      <td className="p-2.5 text-right font-semibold text-blue-400 font-mono">{Number(item.odometro).toLocaleString('pt-BR')} km</td>
                      {hasDateColumn && (
                        <td className="p-2.5 text-right font-mono text-emerald-400">
                          {item.dataAjuste
                            ? new Date(item.dataAjuste).toLocaleDateString('pt-BR')
                            : <span className="text-muted-foreground italic">hoje</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm">Nenhum dado colado ou formato inválido.</p>
                <p className="text-xs mt-1">A visualização aparecerá em tempo real após colar o conteúdo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico/Resultados da última execução */}
      {summary && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-lg font-bold text-foreground">Relatório da Última Execução</h3>
            <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Concluído</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex flex-col">
              <span className="text-xs text-green-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sucessos
              </span>
              <p className="text-2xl font-black text-green-500 mt-1">{summary.sucessos}</p>
            </div>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col">
              <span className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Falhas
              </span>
              <p className="text-2xl font-black text-red-500 mt-1">{summary.falhas}</p>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex flex-col">
              <span className="text-xs text-yellow-400 font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Não Encontrados
              </span>
              <p className="text-2xl font-black text-yellow-500 mt-1">{summary.naoEncontrados}</p>
            </div>
            <div className="p-4 bg-muted border border-border rounded-xl flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Inválidos</span>
              <p className="text-2xl font-black text-foreground mt-1">{summary.invalidos}</p>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-input">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="p-3 font-semibold text-muted-foreground">Chassi</th>
                  <th className="p-3 font-semibold text-muted-foreground">Odômetro</th>
                  <th className="p-3 font-semibold text-muted-foreground">Veículo Identificado</th>
                  <th className="p-3 font-semibold text-muted-foreground text-center">Status</th>
                  <th className="p-3 font-semibold text-muted-foreground">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {summary.results.map((res, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition">
                    <td className="p-3 font-mono font-medium text-foreground">{res.chassi}</td>
                    <td className="p-3 font-mono text-blue-400">{Number(res.odometro).toLocaleString('pt-BR')} km</td>
                    <td className="p-3 text-muted-foreground">{res.vehicleInfo || "-"}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        res.status === "success"
                          ? "bg-green-500/15 text-green-400"
                          : res.status === "not_found"
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-red-500/15 text-red-400"
                      }`}>
                        {res.status === "success" ? "Ajustado" : res.status === "not_found" ? "Ñ Encontrado" : "Erro"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{res.error || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Progresso e Chat Logs */}
      <OdometerProgressModal
        open={openDialog}
        onClose={handleCloseDialog}
        isProcessing={isProcessing}
        executionStatus={executionStatus}
        progress={progress}
        log={log}
        summary={summary}
        showDetails={showDetails}
        setShowDetails={setShowDetails}
      />
    </div>
  );
}
