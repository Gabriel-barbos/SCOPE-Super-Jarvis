import { CheckCircle2, XCircle, AlertCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { OperationResult } from "@/services/VehicleGroupService";

interface SetupSummary {
  total: number;
  sucessos: number;
  falhas: number;
  detalhes: {
    sucesso: OperationResult[];
    falha: OperationResult[];
  };
}

interface SetupResultProps {
  result: SetupSummary;
  title?: string;
}

export default function SetupResultComponent({
  result,
  title = "Resultado da Operação",
}: SetupResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyFailedIds = async () => {
    const failedIds = result.detalhes.falha
      .map((r) => r.identifier)
      .join("\n");

    try {
      await navigator.clipboard.writeText(failedIds);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar:", err);
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-md bg-background">
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-md bg-muted/50 border border-border">
          <div className="text-2xl font-bold text-foreground">{result.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">{result.sucessos}</div>
          <div className="text-xs text-green-600/70">Sucessos</div>
        </div>
        <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <div className="text-2xl font-bold text-red-600">{result.falhas}</div>
          <div className="text-xs text-red-600/70">Falhas</div>
        </div>
      </div>

      {result.sucessos > 0 && (
        <div className="p-3 rounded-md bg-green-500/5 border border-green-500/20">
          <p className="text-sm text-green-700">
            ✓ {result.sucessos} item{result.sucessos !== 1 ? "s" : ""} processado{result.sucessos !== 1 ? "s" : ""} com sucesso
          </p>
        </div>
      )}

      {result.detalhes.falha.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              Itens não processados ({result.falhas})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyFailedIds}
              className="h-7 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar IDs
                </>
              )}
            </Button>
          </div>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {result.detalhes.falha.map((r, idx) => (
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

      {result.detalhes.sucesso.length > 0 && (
        <details className="space-y-2">
          <summary className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2 hover:text-primary">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Ver itens processados ({result.sucessos})
          </summary>
          <div className="max-h-[200px] overflow-y-auto space-y-1 mt-2">
            {result.detalhes.sucesso.map((r, idx) => (
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