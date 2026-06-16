import { useState } from "react";
import {
  Activity,
  Wrench,
  RotateCcw,
  Search,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  History,
  EyeOff,
  ScanSearch,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  MaintenanceRevalidateResult,
  PollExecution,
  PollVehicle,
} from "@/services/PollService";
import { StatusBadge, fmtDate, fmtDuration, fmtNumber } from "./AutoPollHelpers";

const VEHICLE_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "recovered", label: "Recuperado" },
  { value: "maintenance", label: "Manutenção" },
  { value: "ignored", label: "Ignorado" },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface AutoPollTabsProps {
  loadingExec: boolean;
  loadingMaint: boolean;
  loadingVehicleHistory: boolean;
  executions: PollExecution[];
  maintenanceCount: number;
  maintSearch: string;
  setMaintSearch: (v: string) => void;
  maintPage: number;
  setMaintPage: React.Dispatch<React.SetStateAction<number>>;
  maintPageItems: PollVehicle[];
  filteredMaintCount: number;
  maintTotalPages: number;
  vehicleHistory: PollVehicle[];
  vehicleHistoryTotal: number;
  vehicleHistoryPage: number;
  vehicleHistoryTotalPages: number;
  vehicleHistoryStatus: string;
  setVehicleHistoryStatus: (v: string) => void;
  vehicleHistoryAccount: string;
  setVehicleHistoryAccount: (v: string) => void;
  setVehicleHistoryPage: React.Dispatch<React.SetStateAction<number>>;
  revalidating: boolean;
  revalidatePreview: MaintenanceRevalidateResult | null;
  setRevalidatePreview: (v: MaintenanceRevalidateResult | null) => void;
  revalidateAccount: string;
  setRevalidateAccount: (v: string) => void;
  onRevalidateConfirm: (account: string) => void;
  resetTarget: PollVehicle | null;
  setResetTarget: (v: PollVehicle | null) => void;
  resetting: boolean;
  onConfirmReset: () => void;
}

// ── Component 

export function AutoPollTabs({
  loadingExec,
  loadingMaint,
  loadingVehicleHistory,
  executions,
  maintenanceCount,
  maintSearch,
  setMaintSearch,
  maintPage,
  setMaintPage,
  maintPageItems,
  filteredMaintCount,
  maintTotalPages,
  vehicleHistory,
  vehicleHistoryTotal,
  vehicleHistoryPage,
  vehicleHistoryTotalPages,
  vehicleHistoryStatus,
  setVehicleHistoryStatus,
  vehicleHistoryAccount,
  setVehicleHistoryAccount,
  setVehicleHistoryPage,
  revalidating,
  revalidatePreview,
  setRevalidatePreview,
  revalidateAccount,
  setRevalidateAccount,
  onRevalidateConfirm,
  resetTarget,
  setResetTarget,
  resetting,
  onConfirmReset,
}: AutoPollTabsProps) {
  const [detailVehicle, setDetailVehicle] = useState<PollVehicle | null>(null);
  const [confirmRevalidateOpen, setConfirmRevalidateOpen] = useState(false);

  return (
    <>
      <Tabs
        defaultValue="executions"
        className="space-y-4 rounded-xl border border-border bg-card p-4"
      >
        <TabsList className="border-b border-border rounded-none justify-start h-auto pb-0 bg-transparent gap-0 flex-wrap">
          <TabsTrigger
            value="executions"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3"
          >
            <Activity className="w-4 h-4" />
            Execuções
          </TabsTrigger>
          <TabsTrigger
            value="vehicles"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3"
          >
            <History className="w-4 h-4" />
            Histórico de Veículos
          </TabsTrigger>
          <TabsTrigger
            value="maintenance"
            className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3"
          >
            <Wrench className="w-4 h-4" />
            Manutenção
            {maintenanceCount > 0 && (
              <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold">
                {maintenanceCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executions">
          <ExecutionsTab loading={loadingExec} executions={executions} />
        </TabsContent>

        <TabsContent value="vehicles">
          <VehicleHistoryTab
            loading={loadingVehicleHistory}
            items={vehicleHistory}
            total={vehicleHistoryTotal}
            page={vehicleHistoryPage}
            totalPages={vehicleHistoryTotalPages}
            statusFilter={vehicleHistoryStatus}
            onStatusChange={(v) => {
              setVehicleHistoryStatus(v);
              setVehicleHistoryPage(1);
            }}
            accountFilter={vehicleHistoryAccount}
            onAccountChange={(v) => {
              setVehicleHistoryAccount(v);
              setVehicleHistoryPage(1);
            }}
            onPageChange={setVehicleHistoryPage}
            onSelectVehicle={setDetailVehicle}
          />
        </TabsContent>

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
            revalidating={revalidating}
            revalidateAccount={revalidateAccount}
            setRevalidateAccount={setRevalidateAccount}
            onRevalidateClick={() => setConfirmRevalidateOpen(true)}
          />
        </TabsContent>
      </Tabs>

      <VehicleDetailDialog
        vehicle={detailVehicle}
        onClose={() => setDetailVehicle(null)}
      />

      <RevalidatePreviewDialog
        preview={revalidatePreview}
        onClose={() => setRevalidatePreview(null)}
      />

      <AlertDialog open={confirmRevalidateOpen} onOpenChange={setConfirmRevalidateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar revalidação</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá alterar o banco de dados, movendo veículos desativados/removidos de
              manutenção para o status <strong>Ignorado</strong> {revalidateAccount !== "all" ? `da conta ${revalidateAccount.toUpperCase()}` : "de todas as contas"}. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmRevalidateOpen(false);
                onRevalidateConfirm(revalidateAccount);
              }}
              disabled={revalidating}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Sim, executar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

// ── Executions Tab ────────────────────────────────────────────────────────────

function ExecutionsTab({
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
            {[
              "Data / Hora",
              "Trigger",
              "Escaneados",
              "Polled",
              "Manutenção",
              "Recuperados",
              "Ignorados",
              "Duração",
              "Status",
            ].map((h, i) => (
              <th
                key={h}
                className={`px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide ${
                  i >= 2 && i <= 7 ? "text-right" : i === 8 ? "text-center" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
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
              <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                {fmtNumber(ex.totalIgnored)}
              </td>
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

// ── Vehicle History Tab ─────────────────────────────────────────────────────────

function VehicleHistoryTab({
  loading,
  items,
  total,
  page,
  totalPages,
  statusFilter,
  onStatusChange,
  accountFilter,
  onAccountChange,
  onPageChange,
  onSelectVehicle,
}: {
  loading: boolean;
  items: PollVehicle[];
  total: number;
  page: number;
  totalPages: number;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  accountFilter: string;
  onAccountChange: (v: string) => void;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
  onSelectVehicle: (v: PollVehicle) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Status:</span>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground shrink-0">Conta:</span>
            <Select value={accountFilter} onValueChange={onAccountChange}>
              <SelectTrigger className="w-[150px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="brasil">Brasil</SelectItem>
                <SelectItem value="leaseplan">Leaseplan</SelectItem>
                <SelectItem value="ald">ALD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          {total} veículo{total !== 1 ? "s" : ""} no total
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Carregando histórico…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <History className="w-8 h-8 opacity-30" />
          <p className="text-sm">Nenhum veículo encontrado para este filtro.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {items.map((v) => (
              <button
                key={v._id}
                type="button"
                onClick={() => onSelectVehicle(v)}
                className="w-full flex items-start justify-between gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 mt-0.5">
                    {v.status === "ignored" ? (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    ) : (
                      <History className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-foreground">{v.vin}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                      {v.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <StatusBadge status={v.status} />
                      {v.accountName && (
                        <Badge variant="outline" className="text-[10px] h-5 bg-muted/50 font-medium">
                          {v.accountName}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {v.totalAttempts} tentativa{v.totalAttempts !== 1 ? "s" : ""}
                      </span>
                      {v.status === "ignored" && v.ignoredAt && (
                        <span className="text-xs text-muted-foreground/70">
                          Ignorado: {fmtDate(v.ignoredAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
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
  revalidating: boolean;
  revalidateAccount: string;
  setRevalidateAccount: (v: string) => void;
  onRevalidateClick: () => void;
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
  revalidating,
  revalidateAccount,
  setRevalidateAccount,
  onRevalidateClick,
}: MaintenanceTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-3">
        <div className="flex-1">
          <p className="text-sm font-medium">Revalidar manutenções</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Corrige veículos removidos/desativados marcados como manutenção por engano.
            Revalida diretamente o estado no banco de dados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={revalidateAccount} onValueChange={setRevalidateAccount}>
            <SelectTrigger className="w-[140px] h-9 bg-background">
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Contas</SelectItem>
              <SelectItem value="brasil">Brasil</SelectItem>
              <SelectItem value="leaseplan">Leaseplan</SelectItem>
              <SelectItem value="ald">ALD</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={onRevalidateClick}
            disabled={revalidating}
            className="shrink-0 h-9 gap-2 border-slate-500/30"
          >
            {revalidating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ScanSearch className="w-4 h-4" />
            )}
            Revalidar manutenções
          </Button>
        </div>
      </div>

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
            {v.accountName && (
              <Badge variant="outline" className="text-[10px] h-5 bg-muted/50 font-medium">
                {v.accountName}
              </Badge>
            )}
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

// ── Vehicle Detail Dialog ─────────────────────────────────────────────────────

function VehicleDetailDialog({
  vehicle,
  onClose,
}: {
  vehicle: PollVehicle | null;
  onClose: () => void;
}) {
  if (!vehicle) return null;

  return (
    <Dialog open={!!vehicle} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            {vehicle.status === "ignored" ? (
              <EyeOff className="w-5 h-5 text-slate-400" />
            ) : (
              <History className="w-5 h-5 text-muted-foreground" />
            )}
            {vehicle.vin}
          </DialogTitle>
          <DialogDescription>{vehicle.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <StatusBadge status={vehicle.status} />
          </div>
          {vehicle.accountName && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Conta:</span>
              <Badge variant="outline" className="text-xs bg-muted/50 font-medium">
                {vehicle.accountName} ({vehicle.account})
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Tentativas:</span>
            <span className="font-medium">{vehicle.totalAttempts}</span>
          </div>
          {vehicle.flaggedAt && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Manutenção desde:</span>
              <span>{fmtDate(vehicle.flaggedAt)}</span>
            </div>
          )}
          {vehicle.lastPollDate && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Último poll:</span>
              <span>{fmtDate(vehicle.lastPollDate)}</span>
            </div>
          )}
          {vehicle.status === "ignored" && (
            <>
              {vehicle.ignoredAt && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">Ignorado em:</span>
                  <span>{fmtDate(vehicle.ignoredAt)}</span>
                </div>
              )}
              {vehicle.ignoredReason && (
                <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Motivo</p>
                  <p className="text-sm">{vehicle.ignoredReason}</p>
                </div>
              )}
              {vehicle.lastMaintenanceRevalidatedAt && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Revalidado em:</span>
                  <span>{fmtDate(vehicle.lastMaintenanceRevalidatedAt)}</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Revalidate Preview Dialog ───────────────────────────────────────────────────

function RevalidatePreviewDialog({
  preview,
  onClose,
}: {
  preview: MaintenanceRevalidateResult | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!preview} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-slate-400" />
            Revalidação Concluída
          </DialogTitle>
          <DialogDescription>
            As alterações de revalidação foram aplicadas no banco de dados.
          </DialogDescription>
        </DialogHeader>

        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Total Verificados</p>
                <p className="text-lg font-semibold tabular-nums">
                  {fmtNumber(preview.totalChecked ?? preview.checked ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 p-3">
                <p className="text-xs text-muted-foreground">→ Total Ignorados</p>
                <p className="text-lg font-semibold tabular-nums text-slate-400">
                  {fmtNumber(preview.totalIgnored ?? preview.ignored ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                <p className="text-xs text-muted-foreground">Total Em Manutenção</p>
                <p className="text-lg font-semibold tabular-nums text-orange-400">
                  {fmtNumber(preview.totalStillMaintenance ?? preview.stillMaintenance ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs text-muted-foreground">Total Erro / Não Encontrado</p>
                <p className="text-lg font-semibold tabular-nums text-red-400">
                  {fmtNumber(preview.totalNotFoundOrError ?? preview.notFoundOrError ?? 0)}
                </p>
              </div>
            </div>

            {preview.accounts && preview.accounts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalhamento por Conta
                </p>
                <div className="overflow-x-auto rounded-lg border border-border bg-card">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Conta</th>
                        <th className="px-2 py-2 text-right font-medium text-muted-foreground">Verif.</th>
                        <th className="px-2 py-2 text-right font-medium text-muted-foreground">Ignor.</th>
                        <th className="px-2 py-2 text-right font-medium text-muted-foreground">Manut.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.accounts.map((ac) => (
                        <tr key={ac.account} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{ac.accountName}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{fmtNumber(ac.checked)}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-slate-400">{fmtNumber(ac.ignored)}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-orange-400">{fmtNumber(ac.stillMaintenance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
