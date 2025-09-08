import { useState } from "react";
import { Car } from "lucide-react";
import UnidasService from "../services/UnidasService";

export default function Rotinas() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);

  const handleBuscarVeiculos = async () => {
    setLoading(true);
    setVehicles([]);
    setProcessed(0);
    setTotal(0);

    const resultado = await UnidasService.buscarVeiculosSemGrupo(500, (processados, totalCount) => {
      setProcessed(processados);
      setTotal(totalCount || 0);
    });

    setVehicles(resultado);
    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Car className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Rotinas</h1>
        </div>
      </div>

      <div className="text-muted-foreground">
        <p>Rotina para Unidas</p>
      </div>

      {/* Botão de busca */}
      <button
        onClick={handleBuscarVeiculos}
        disabled={loading}
        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition"
      >
        {loading ? "Buscando..." : "Buscar veículos sem grupo do cliente"}
      </button>

      {/* Progresso */}
      {loading && (
        <p className="text-foreground mt-2">
          Processados: {processed} {total > 0 && `/ ${total}`}
        </p>
      )}

      {/* Tabela */}
      {vehicles.length > 0 && (
        <div className="overflow-x-auto mt-4">
          <table className="w-full border-collapse border border-border">
            <thead className="bg-muted">
              <tr>
                <th className="border px-2 py-1 text-left">ID</th>
                <th className="border px-2 py-1 text-left">Descrição</th>
                <th className="border px-2 py-1 text-left">Placa</th>
                <th className="border px-2 py-1 text-left">Grupos</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-muted/50">
                  <td className="border px-2 py-1">{v.id}</td>
                  <td className="border px-2 py-1">{v.description}</td>
                  <td className="border px-2 py-1">{v.registration}</td>
                  <td className="border px-2 py-1">
                    {v.vehicleGroups.map((g: any) => g.description).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
