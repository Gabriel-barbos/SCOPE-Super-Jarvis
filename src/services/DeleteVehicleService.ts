import proxyApi from "./proxyApi";


interface VehicleSearchResult {
  id: string;
  description: string;
  vin?: string;
}

interface DeleteResult {
  success: boolean;
  vehicleInfo: string;
  error?: string;
}

// Busca veículos "REMOVIDO" 
async function buscarVeiculosRemovidos(): Promise<VehicleSearchResult[]> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: "/Vehicles",
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Filtra apenas veículos com "REMOVIDO" 
    const veiculosRemovidos = res.data.filter((vehicle: any) =>
      vehicle.description?.toLowerCase().includes("REMOVIDO")
    );

    return veiculosRemovidos.map((vehicle: any) => ({
      id: vehicle.id,
      description: vehicle.description,
      vin: vehicle.vin,
    }));
  } catch (err: any) {
    console.error("❌ Erro ao buscar veículos removidos:", err.response?.data || err.message);
    throw err;
  }
}

// Busca um veículo específico por descrição ou VIN
async function buscarVeiculoPorDescricaoOuVin(searchTerm: string): Promise<VehicleSearchResult | null> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: "/Vehicles",
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Busca por descrição ou VIN (case insensitive)
    const vehicle = res.data.find((v: any) =>
      v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vin?.toLowerCase() === searchTerm.toLowerCase()
    );

    if (vehicle) {
      return {
        id: vehicle.id,
        description: vehicle.description,
        vin: vehicle.vin,
      };
    }

    return null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo ${searchTerm}:`, err.response?.data || err.message);
    throw err;
  }
}

// Exclui um veículo pelo ID
async function excluirVeiculoPorId(vehicleId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles/${vehicleId}`,
        method: "DELETE",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return true;
  } catch (err: any) {
    console.error(`❌ Erro ao excluir veículo ID ${vehicleId}:`, err.response?.data || err.message);
    return false;
  }
}

// Exclui veículos em lotes sequenciais com base numa lista de descrições/VINs
async function excluirVeiculosEmLote(
  searchTerms: string[],
  lote = 3,
  onProgress?: (processed: number, total: number, vehicleInfo?: string, success?: boolean) => void
): Promise<DeleteResult[]> {
  const total = searchTerms.length;
  let processed = 0;
  const results: DeleteResult[] = [];

  for (let i = 0; i < total; i += lote) {
    const chunk = searchTerms.slice(i, i + lote);

    // Processamento sequencial dentro do lote
    for (let j = 0; j < chunk.length; j++) {
      const searchTerm = chunk[j].trim();
      console.log("🔍 Buscando veículo:", searchTerm);

      try {
        // Primeiro busca o veículo para obter o ID
        const vehicle = await buscarVeiculoPorDescricaoOuVin(searchTerm);

        if (!vehicle) {
          const result: DeleteResult = {
            success: false,
            vehicleInfo: searchTerm,
            error: "Veículo não encontrado"
          };
          results.push(result);
          console.log("⚠️ Veículo não encontrado:", searchTerm);
        } else {
          console.log("✅ Veículo encontrado:", vehicle);
          
          // Agora exclui o veículo usando o ID
          const deleted = await excluirVeiculoPorId(vehicle.id);
          
          const result: DeleteResult = {
            success: deleted,
            vehicleInfo: `${vehicle.description} (ID: ${vehicle.id})`,
            error: deleted ? undefined : "Erro ao excluir veículo"
          };
          results.push(result);

          if (deleted) {
            console.log("🗑️ Veículo excluído com sucesso:", vehicle.description);
          } else {
            console.log("❌ Falha ao excluir veículo:", vehicle.description);
          }
        }
      } catch (err: any) {
        const result: DeleteResult = {
          success: false,
          vehicleInfo: searchTerm,
          error: err.response?.data?.message || err.message || "Erro desconhecido"
        };
        results.push(result);
        console.error(`❌ Erro ao processar ${searchTerm}:`, err.response?.data || err.message);
      }

      processed++;
      if (onProgress) {
        const lastResult = results[results.length - 1];
        onProgress(processed, total, lastResult.vehicleInfo, lastResult.success);
      }
    }
  }

  return results;
}

// Exclui todos os veículos marcados  "REMOVIDO"
async function excluirTodosVeiculosRemovidos(
  lote = 3,
  onProgress?: (processed: number, total: number, vehicleInfo?: string, success?: boolean) => void
): Promise<DeleteResult[]> {
  console.log("🔍 Buscando veículos com 'REMOVIDO' na descrição...");
  
  try {
    const veiculosRemovidos = await buscarVeiculosRemovidos();
    console.log(`📋 Encontrados ${veiculosRemovidos.length} veículos para exclusão`);

    if (veiculosRemovidos.length === 0) {
      return [];
    }

    const total = veiculosRemovidos.length;
    let processed = 0;
    const results: DeleteResult[] = [];

    for (let i = 0; i < total; i += lote) {
      const chunk = veiculosRemovidos.slice(i, i + lote);

      for (let j = 0; j < chunk.length; j++) {  
        const vehicle = chunk[j];
        console.log("🗑️ Excluindo veículo:", vehicle.description);

        try {
          const deleted = await excluirVeiculoPorId(vehicle.id);
          
          const result: DeleteResult = {
            success: deleted,
            vehicleInfo: `${vehicle.description} (ID: ${vehicle.id})`,
            error: deleted ? undefined : "Erro ao excluir veículo"
          };
          results.push(result);

          if (deleted) {
            console.log("✅ Veículo excluído:", vehicle.description);
          } else {
            console.log("❌ Falha ao excluir:", vehicle.description);
          }
        } catch (err: any) {
          const result: DeleteResult = {
            success: false,
            vehicleInfo: `${vehicle.description} (ID: ${vehicle.id})`,
            error: err.response?.data?.message || err.message || "Erro desconhecido"
          };
          results.push(result);
          console.error(`❌ Erro ao excluir ${vehicle.description}:`, err.response?.data || err.message);
        }

        processed++;
        if (onProgress) {
          const lastResult = results[results.length - 1];
          onProgress(processed, total, lastResult.vehicleInfo, lastResult.success);
        }
      }
    }

    return results;
  } catch (err: any) {
    console.error("❌ Erro ao buscar veículos removidos:", err.response?.data || err.message);
    throw err;
  }
}

export default {
  buscarVeiculosRemovidos,
  buscarVeiculoPorDescricaoOuVin,
  excluirVeiculoPorId,
  excluirVeiculosEmLote,
  excluirTodosVeiculosRemovidos,
};

export type { VehicleSearchResult, DeleteResult };