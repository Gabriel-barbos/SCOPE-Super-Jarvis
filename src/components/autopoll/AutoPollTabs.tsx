import {
  Activity,
  Wrench,
  RotateCcw,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { PollExecution, PollVehicle } from "@/services/PollService";
import { StatusBadge, fmtDate, fmtDuration, fmtNumber } from "./AutoPollHelpers";

// ── Props ─────────────────────────────────────────────────────────────────────

interface AutoPollTabsProps {
  // shared loading
  loadingExec: boolean;
  loadingMaint: boolean;
  // data
  executions: PollExecution[];
  maintenanceCount: number;
  // maintenance tab state (lifted up so parent can persist between tab changes)
  maintSearch: string;
  setMaintSearch: (v: string) => void;
  maintPage: number;
  setMaintPage: React.Dispatch<React.SetStateAction<number>>;
  maintPageItems: PollVehicle[];
  filteredMaintCount: number;
  maintTotalPages: number;
  // reset dialog
  resetTarget: PollVehicle | null;
  setResetTarget: (v: PollVehicle | null) => void;
  resetting: boolean;
  onConfirmReset: () => void;
}

// ── Component 

export function AutoPollTabs({
  loadingExec,
  loadingMaint,
  executions,
  maintenanceCount,
  maintSearch,
  setMaintSearch,
  maintPage,
  setMaintPage,
  maintPageItems,
  filteredMaintCount,
  maintTotalPages,
  resetTarget,
  setResetTarget,
  resetting,
  onConfirmReset,
}: AutoPollTabsProps) {
  return (
    <>
      <Tabs
        defaultValue="history"
        className="space-y-4 rounded-xl border border-border bg-card p-4"
      >
        <TabsList className="border-b border-border rounded-none justify-start h-auto pb-0 bg-transparent gap-0">
          <TabsTrigger
            value="history"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3"
          >
            <Activity className="w-4 h-4" />
            Histórico de Execuções
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3"
          >
            <Wrench className="w-4 h-4" />
            Veículos em Manutenção
            {maintenanceCount > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold">
                {maintenanceCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── History ── */}
        <TabsContent value="history">
          <HistoryTab
            loading={loadingExec}
            executions={executions}
          />
        </TabsContent>

        {/* ── Maintenance ── */}
        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceTab
            loading={loadingMaint}
            maintSearch={maintSearch}
            setMaintSearch={setMaintSearch}
            maintPage={maintPage}
            setMaintPage={setMaintPage}
            maintPageItems={maintPageItems}
            filteredMaintCount={filteredMaintCount}
            maintTotalPages={maintTotalPages}
            onResetClick={setResetTarget}
          />
        </TabsContent>
      </Tabs>

      {/* ── Reset Dialog ── */}
      <ResetDialog
        target={resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={onConfirmReset}
        resetting={resetting}
      />
    </>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab({
  loading,
  executions,
}: {
  loading: boolean;
  executions: PollExecution[];
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        Carregando histórico…
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
        <Activity className="w-8 h-8 opacity-30" />
        <p className="text-sm">Nenhuma execução encontrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {["Data / Hora", "Trigger", "Escaneados", "Polled", "Manutenção", "Recuperados", "Duração", "Status"].map(
              (h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide ${
                    i >= 2 && i <= 6 ? "text-right" : i === 7 ? "text-center" : "text-left"
                  }`}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {executions.map((ex, i) => (
            <tr
              key={ex._id}
              className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
                i % 2 !== 0 ? "bg-muted/10" : ""
              }`}
            >
              <td className="px-4 py-3 font-medium whitespace-nowrap">{fmtDate(ex.startedAt)}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="text-xs">
                  {ex.trigger}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{fmtNumber(ex.totalScanned)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-blue-400">{fmtNumber(ex.totalPolled)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-orange-400">{fmtNumber(ex.totalNewMaintenance)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-green-400">{fmtNumber(ex.totalRecovered)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                {fmtDuration(ex.startedAt, ex.finishedAt)}
              </td>
              <td className="px-4 py-3 text-center">
                <StatusBadge status={ex.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Maintenance Tab ───────────────────────────────────────────────────────────

interface MaintenanceTabProps {
  loading: boolean;
  maintSearch: string;
  setMaintSearch: (v: string) => void;
  maintPage: number;
  setMaintPage: React.Dispatch<React.SetStateAction<number>>;
  maintPageItems: PollVehicle[];
  filteredMaintCount: number;
  maintTotalPages: number;
  onResetClick: (v: PollVehicle) => void;
}

function MaintenanceTab({
  loading,
  maintSearch,
  setMaintSearch,
  maintPage,
  setMaintPage,
  maintPageItems,
  filteredMaintCount,
  maintTotalPages,
  onResetClick,
}: MaintenanceTabProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por VIN ou descrição…"
          value={maintSearch}
          onChange={(e) => {
            setMaintSearch(e.target.value);
            setMaintPage(1);
          }}
          className="pl-9 pr-9 bg-background"
        />
        {maintSearch && (
          <button
            onClick={() => setMaintSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando veículos…
        </div>
      ) : filteredMaintCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Wrench className="w-8 h-8 opacity-30" />
          <p className="text-sm">
            {maintSearch
              ? "Nenhum veículo encontrado para essa busca."
              : "Nenhum veículo em manutenção. :)"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filteredMaintCount} veículo{filteredMaintCount !== 1 ? "s" : ""} encontrado
            {filteredMaintCount !== 1 ? "s" : ""}
          </p>

          <div className="space-y-2">
            {maintPageItems.map((v) => (
              <VehicleCard key={v._id} vehicle={v} onReset={onResetClick} />
            ))}
          </div>

          {maintTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Página {maintPage} de {maintTotalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMaintPage((p) => Math.max(1, p - 1))}
                  disabled={maintPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMaintPage((p) => Math.min(maintTotalPages, p + 1))}
                  disabled={maintPage === maintTotalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────

function VehicleCard({
  vehicle: v,
  onReset,
}: {
  vehicle: PollVehicle;
  onReset: (v: PollVehicle) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-orange-500/30 transition-all duration-200">
      <div className="flex items-start gap-3 min-w-0">
        {/* Icon — color only on the icon itself, not the whole container */}
        <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 mt-0.5">
          <Wrench className="w-4 h-4 text-orange-400" />
        </div>

        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-foreground">{v.vin}</p>
          <p className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">{v.description}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {v.totalAttempts} tentativa{v.totalAttempts !== 1 ? "s" : ""}
            </span>
            {v.flaggedAt && (
              <span className="text-xs text-muted-foreground/70">
                Flagged: {fmtDate(v.flaggedAt)}
              </span>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onReset(v)}
        className="shrink-0 gap-1.5 text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/50"
      >
        <RotateCcw className="w-3 h-3" />
        Resetar
      </Button>
    </div>
  );
}

// ── Reset Dialog ──────────────────────────────────────────────────────────────

function ResetDialog({
  target,
  onClose,
  onConfirm,
  resetting,
}: {
  target: PollVehicle | null;
  onClose: () => void;
  onConfirm: () => void;
  resetting: boolean;
}) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-orange-400" />
            Resetar veículo
          </DialogTitle>
          <DialogDescription>
            Deseja remover{" "}
            <strong className="text-foreground font-mono">{target?.vin}</strong>{" "}
            da lista de manutenção? Isso zerará o histórico de tentativas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={resetting}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {resetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Resetando…
              </>
            ) : (
              "Confirmar Reset"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
