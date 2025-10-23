import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OperationResult } from "@/services/VehicleGroupService";

interface ReportSummary {
  total: number;
  sucessos: number;
  falhas: number;
  detalhes: {
    sucesso: OperationResult[];
    falha: OperationResult[];
  };
}

interface OperationReportProps {
  report: ReportSummary;
  onReset?: () => void;
  groupName?: string;
  actionType?: "add" | "remove";
}

export default function OperationReport({
  report,
  onReset,
  groupName,
  actionType = "add",
}: OperationReportProps) {
  const actionText = actionType === "add" ? "movimentado ao" : "removidos do";

  return (
    <div className="space-y-4 p-4 border border-border rounded-md bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Relatório da Operação</h3>
          {groupName && (
            <p className="text-sm text-muted-foreground">
              Grupo: <span className="font-medium">{groupName}</span>
            </p>
          )}
        </div>
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}>
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-md bg-muted/50 border border-border">
          <div className="text-2xl font-bold text-foreground">{report.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">{report.sucessos}</div>
          <div className="text-xs text-green-600/70">Sucessos</div>
        </div>
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <div className="text-2xl font-bold text-red-600">{report.falhas}</div>
          <div className="text-xs text-red-600/70">Falhas</div>
        </div>
      </div>

      {report.sucessos > 0 && (
        <div className="p-3 rounded-md bg-green-500/5 border border-green-500/20">
          <p className="text-sm text-green-700">
            ✓ {report.sucessos} veículo{report.sucessos !== 1 ? "s" : ""} {actionText} grupo com sucesso
          </p>
        </div>
      )}

      {report.detalhes.falha.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            Veículos não processados ({report.falhas})
          </h4>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {report.detalhes.falha.map((r, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-md bg-red-500/5 border border-red-500/10"
              >
                <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {r.identifier}
                  </p>
                  <p className="text-xs text-red-600/70">{r.error}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.detalhes.sucesso.length > 0 && (
        <details className="space-y-2">
          <summary className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2 hover:text-primary">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Ver veículos processados ({report.sucessos})
          </summary>
          <div className="max-h-[200px] overflow-y-auto space-y-1 mt-2">
            {report.detalhes.sucesso.map((r, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-md bg-green-500/5 border border-green-500/10"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{r.vehicleInfo}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}