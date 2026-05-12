import { useState, useEffect, useCallback } from "react";
import {
  Radio,
  Play,
  Square,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Clock,
  Car,
  Zap,
  TrendingUp,
  RefreshCw,
  Loader2,
  CalendarClock,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

import {
  pollService,
  type PollStatus,
  type PollVehicle,
} from "@/services/PollService";

import {
  MetricCard,
  InfoRow,
  RunningDot,
  StatusBadge,
  fmtDate,
  fmtDuration,
} from "@/components/autopoll/AutoPollHelpers";
import { AutoPollTabs } from "@/components/autopoll/AutoPollTabs";


const MAINT_PER_PAGE = 8;


export default function AutoPoll() {
  const { toast } = useToast();


  const [status, setStatus] = useState<PollStatus | null>(null);
  const [executions, setExecutions] = useState<import("@/services/PollService").PollExecution[]>([]);
  const [maintenance, setMaintenance] = useState<PollVehicle[]>([]);
  const [maintenanceCount, setMaintenanceCount] = useState(0);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingExec, setLoadingExec] = useState(true);
  const [loadingMaint, setLoadingMaint] = useState(true);
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);

  const [maintSearch, setMaintSearch] = useState("");
  const [maintPage, setMaintPage] = useState(1);
  const [resetTarget, setResetTarget] = useState<PollVehicle | null>(null);
  const [resetting, setResetting] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportBytes, setExportBytes] = useState(0);

  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);

  const [tick, setTick] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await pollService.getStatus();
      setStatus(data);
    } catch {
      /* silent */
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchExecutions = useCallback(async () => {
    try {
      const data = await pollService.getExecutions();
      setExecutions(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: "Erro ao carregar execuções", variant: "destructive" });
    } finally {
      setLoadingExec(false);
    }
  }, [toast]);

  const fetchMaintenance = useCallback(async () => {
    try {
      const data = await pollService.getMaintenance();
      setMaintenance(data.items ?? []);
      setMaintenanceCount(data.count ?? 0);
    } catch {
      toast({ title: "Erro ao carregar manutenções", variant: "destructive" });
    } finally {
      setLoadingMaint(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStatus();
    fetchExecutions();
    fetchMaintenance();
  }, [fetchStatus, fetchExecutions, fetchMaintenance, tick]);

  // Auto-refresh every 30 s while running
  useEffect(() => {
    if (!status?.isRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [status?.isRunning]);

  // ── Actions 
  async function handleRun() {
    setRunning(true);
    setIsRunDialogOpen(false);
    try {
      await pollService.run();
      toast({
        title: "Execução iniciada",
        description: "O processo rodará em background. Vai demorar aproximadamente 5 horas.",
      });
      setTimeout(() => setTick((t) => t + 1), 1500);
    } catch (err: unknown) {
      const httpStatus = (err as { response?: { status?: number } })?.response?.status;
      if (httpStatus === 409) {
        toast({
          title: "Já em andamento",
          description: "Há uma execução ativa no momento.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Erro ao iniciar execução", variant: "destructive" });
      }
    } finally {
      setRunning(false);
    }
  }

  async function handleStop() {
    setStopping(true);
    try {
      await pollService.stop();
      toast({
        title: "Parada solicitada",
        description: "O processo irá parar de forma segura no próximo ponto de verificação.",
      });
      setTimeout(() => setTick((t) => t + 1), 1000);
    } catch {
      toast({ title: "Erro ao parar execução", variant: "destructive" });
    } finally {
      setStopping(false);
    }
  }

  async function handleReset() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await pollService.reset(resetTarget.vehicleId);
      toast({ title: `Veículo ${resetTarget.vin} resetado com sucesso` });
      setResetTarget(null);
      fetchMaintenance();
    } catch {
      toast({ title: "Erro ao resetar veículo", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  }

  function handleRefresh() {
    setLoadingStatus(true);
    setLoadingExec(true);
    setLoadingMaint(true);
    setTick((t) => t + 1);
  }

  async function handleExport() {
    setExporting(true);
    setExportProgress(0);
    setExportBytes(0);
    try {
      const blob = await pollService.exportReport(undefined, (progressEvent) => {
        if (progressEvent.total) {
          setExportProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        } else {
          setExportBytes(progressEvent.loaded);
        }
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_poll_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: "Relatório exportado com sucesso" });
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      toast({ title: "Erro ao exportar planilha", variant: "destructive" });
    } finally {
      setExporting(false);
      setExportProgress(0);
      setExportBytes(0);
    }
  }

  // ── Derived values 
  const last = status?.lastExecution;
  const isRunning = status?.isRunning ?? false;

  const filteredMaint = maintenance.filter(
    (v) =>
      (v.vin?.toLowerCase() || "").includes(maintSearch.toLowerCase()) ||
      (v.description?.toLowerCase() || "").includes(maintSearch.toLowerCase())
  );
  const maintTotalPages = Math.max(1, Math.ceil(filteredMaint.length / MAINT_PER_PAGE));
  const maintPageItems = filteredMaint.slice(
    (maintPage - 1) * MAINT_PER_PAGE,
    maintPage * MAINT_PER_PAGE
  );

  // ── Render 
  return (
    <div className="space-y-6 p-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Auto Poll Mzone</h1>
            <p className="text-sm text-muted-foreground">
              Envio automatico de comandos Poll para veículos
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="gap-2 text-muted-foreground"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exportar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loadingStatus}
              className="gap-2 text-muted-foreground"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatus ? "animate-spin" : ""}`} />
              Atualizar
            </Button>

            <Button
              onClick={() => setIsRunDialogOpen(true)}
              disabled={running || isRunning}
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {running || isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRunning ? "Executando…" : "Iniciando…"}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Executar Agora
                </>
              )}
            </Button>

            {isRunning && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStop}
                disabled={stopping || status?.stopRequested}
                className="gap-2"
              >
                {stopping || status?.stopRequested ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Parando...
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Parar
                  </>
                )}
              </Button>
            )}
          </div>
          {isRunning && last?.message && (
             <div className="w-full flex justify-end">
               <Badge variant="secondary" className="px-3 py-1.5 flex items-center gap-2 bg-blue-500/10 text-blue-600 border-blue-500/20 font-medium">
                 <Activity className="w-3 h-3 animate-pulse" />
                 Status: {last.message}
               </Badge>
             </div>
          )}
          {exporting && (
             <div className="w-full flex flex-col gap-1">
               <Progress value={exportProgress > 0 ? exportProgress : undefined} className="h-1.5" />
               <span className="text-[10px] text-muted-foreground text-right">
                 {exportProgress > 0 
                   ? `${exportProgress}% concluído` 
                   : exportBytes > 0 
                     ? `Baixando... (${(exportBytes / 1024 / 1024).toFixed(2)} MB)` 
                     : "Gerando arquivo..."}
               </span>
             </div>
          )}
        </div>
      </div>

      {/* ── Status + Last Execution row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* System status card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Status do Sistema
            </span>
            <RunningDot running={isRunning} />
          </div>

          <div className="space-y-2.5">
            <InfoRow icon={<CalendarClock className="w-4 h-4" />} label="Cron:">
              Terças e Sextas às 08:00
            </InfoRow>
            <InfoRow icon={<Activity className="w-4 h-4" />} label="Total execuções:">
              {executions.length}
            </InfoRow>
            <InfoRow icon={<Wrench className="w-4 h-4" />} label="Veículos para manutenção:">
              <span className="text-orange-400">{maintenanceCount}</span>
            </InfoRow>
          </div>
        </div>

        {/* Last execution card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Última Execução
            </span>
            {last && <StatusBadge status={last.status} />}
          </div>

          {loadingStatus ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando…
            </div>
          ) : !last ? (
            <p className="text-sm text-muted-foreground">Nenhuma execução registrada ainda.</p>
          ) : (
            <div className="space-y-2.5">
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Início:">
                {fmtDate(last.startedAt)}
              </InfoRow>
              <InfoRow icon={<TrendingUp className="w-4 h-4" />} label="Duração:">
                {fmtDuration(last.startedAt, last.finishedAt)}
              </InfoRow>
              <InfoRow icon={<Zap className="w-4 h-4" />} label="Trigger:">
                <Badge variant="outline" className="text-xs h-5">
                  {last.trigger}
                </Badge>
              </InfoRow>
            </div>
          )}
        </div>
      </div>

      {/* ── Metrics row ── */}
      {last && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Veículos Analisados"
            value={last.totalScanned}
            icon={<Car className="w-5 h-5" />}
            iconColor="text-slate-400"
          />
          <MetricCard
            label="Polls Enviados"
            value={last.totalPolled}
            icon={<Radio className="w-5 h-5" />}
            iconColor="text-blue-400"
          />
          <MetricCard
            label="Necessário Manutenção"
            value={last.totalNewMaintenance}
            icon={<Wrench className="w-5 h-5" />}
            iconColor="text-orange-400"
          />
          <MetricCard
            label="Recuperados"
            value={last.totalRecovered}
            icon={<CheckCircle2 className="w-5 h-5" />}
            iconColor="text-green-400"
          />
          <MetricCard
            label="Erros"
            value={last.totalErrors}
            icon={<AlertTriangle className="w-5 h-5" />}
            iconColor="text-red-400"
          />
        </div>
      )}

      {/* ── Tabs ── */}
      <AutoPollTabs
        loadingExec={loadingExec}
        loadingMaint={loadingMaint}
        executions={executions}
        maintenanceCount={maintenanceCount}
        maintSearch={maintSearch}
        setMaintSearch={setMaintSearch}
        maintPage={maintPage}
        setMaintPage={setMaintPage}
        maintPageItems={maintPageItems}
        filteredMaintCount={filteredMaint.length}
        maintTotalPages={maintTotalPages}
        resetTarget={resetTarget}
        setResetTarget={setResetTarget}
        resetting={resetting}
        onConfirmReset={handleReset}
      />

      {/* ── Run Confirmation Dialog ── */}
      <AlertDialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-500" />
              Confirmar Execução
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja executar o Auto Poll agora? 
              Isso levará aproximadamente <strong>5 horas</strong> e rodará em background sem bloquear o sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRun}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Sim, Executar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
