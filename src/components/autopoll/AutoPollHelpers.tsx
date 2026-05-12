import type { PollStatus, PollExecution } from "@/services/PollService";

// ── Formatters ────────────────────────────────────────────────────────────────

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function fmtDuration(start?: string, end?: string) {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  if (min === 0) return `${sec}s`;
  return `${min}min ${sec}s`;
}

export function fmtNumber(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR");
}

// ── MetricCard ────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  /** Lucide icon element — will receive the accent color via className */
  icon: React.ReactNode;
  /** Tailwind text-color class for the icon, e.g. "text-blue-400" */
  iconColor: string;
  sub?: string;
}

export function MetricCard({ label, value, icon, iconColor, sub }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 hover:border-border/70 transition-all duration-200 group">
      <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-muted">
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground leading-none tabular-nums">
          {typeof value === "number" ? fmtNumber(value) : value}
        </p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Concluída",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  running: {
    label: "Executando",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  failed: {
    label: "Falhou",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  pending: {
    label: "Pendente",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  maintenance: {
    label: "Manutenção",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  recovered: {
    label: "Recuperado",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ── InfoRow ───────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

export function InfoRow({ icon, label, children }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

// ── RunningDot ────────────────────────────────────────────────────────────────

export function RunningDot({ running }: { running: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
        running
          ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
          : "bg-green-500/10 border-green-500/30 text-green-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${running ? "bg-blue-400 animate-pulse" : "bg-green-400"}`}
      />
      {running ? "Processando" : "Online"}
    </div>
  );
}

// ── Derived types re-export ───────────────────────────────────────────────────

export type { PollStatus, PollExecution };
