import proxyApi from "./proxyApi";

interface VehicleSearchResult {
  id: string;
  description: string;
  vin?: string;
  unit_Description?: string;
}

interface DeleteResult {
  success: boolean;
  vehicleInfo: string;
  error?: string;
}



// Busca veículo por description (exata)
async function buscarVeiculoPorDescription(description: string): Promise<VehicleSearchResult | null> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=description eq '${description}'&$select=id,description,vin,unit_Description`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo ${description}:`, err.response?.data || err.message);
    return null;
  }
}

// Busca veículo por unit_Description 
async function buscarVeiculoPorUnitDescription(unitDescription: string): Promise<VehicleSearchResult | null> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=unit_Description eq '${unitDescription}'&$select=id,description,vin,unit_Description`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo por unit_description ${unitDescription}:`, err.response?.data || err.message);
    return null;
  }
}

// Busca veículo por VIN 
async function buscarVeiculoPorVin(vin: string): Promise<VehicleSearchResult | null> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=vin eq '${vin}'&$select=id,description,vin,unit_Description`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo por VIN ${vin}:`, err.response?.data || err.message);
    return null;
  }
}

// Busca veículo por description (parcial - contains)
async function buscarVeiculoPorDescriptionParcial(searchTerm: string): Promise<VehicleSearchResult | null> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=contains(tolower(description), '${searchTerm.toLowerCase()}')&$select=id,description,vin,unit_Description`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo ${searchTerm}:`, err.response?.data || err.message);
    return null;
  }
}

// Busca veículos "REMOVIDO" (com OData filter)
async function buscarVeiculosRemovidos(): Promise<VehicleSearchResult[]> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=contains(tolower(description), 'removido')&$select=id,description,vin,unit_Description`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return res.data.value || [];
  } catch (err: any) {
    console.error("❌ Erro ao buscar veículos removidos:", err.response?.data || err.message);
    throw err;
  }
}

// Busca inteligente: tenta VIN exato, depois description parcial
async function buscarVeiculoInteligente(searchTerm: string): Promise<VehicleSearchResult | null> {
  // 1. Tenta buscar por VIN (exato)
  let vehicle = await buscarVeiculoPorVin(searchTerm);
  if (vehicle) {
    console.log("✅ Veículo encontrado por VIN");
    return vehicle;
  }

  // 2. Tenta buscar por description (exato)
  vehicle = await buscarVeiculoPorDescription(searchTerm);
  if (vehicle) {
    console.log("✅ Veículo encontrado por description (exato)");
    return vehicle;
  }

  // 3. Tenta buscar por unit_Description (exato)
  vehicle = await buscarVeiculoPorUnitDescription(searchTerm);
  if (vehicle) {
    console.log("✅ Veículo encontrado por unit_Description");
    return vehicle;
  }

  // 4. Tenta buscar por description (parcial)
  vehicle = await buscarVeiculoPorDescriptionParcial(searchTerm);
  if (vehicle) {
    console.log("✅ Veículo encontrado por description (parcial)");
    return vehicle;
  }

  console.log("⚠️ Veículo não encontrado");
  return null;
}


// Exclui um veículo pelo ID
async function excluirVeiculoPorId(vehicleId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles(${vehicleId})`,
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

// Exclui veículos em lote (processamento sequencial)
async function excluirVeiculosEmLote(
  searchTerms: string[],
  lote = 3,
  onProgress?: (processed: number, total: number, vehicleInfo?: string, success?: boolean) => void
): Promise<DeleteResult[]> {
  const total = searchTerms.length;
  const results: DeleteResult[] = [];

  console.log(`🚀 Iniciando exclusão de ${total} veículos...`);

  for (let i = 0; i < total; i++) {
    const searchTerm = searchTerms[i].trim();
    console.log(`🔎 [${i + 1}/${total}] Buscando: ${searchTerm}`);

    try {
      // Busca inteligente (tenta VIN, description exato, unit_description, description parcial)
      const vehicle = await buscarVeiculoInteligente(searchTerm);

      if (!vehicle) {
        const result: DeleteResult = {
          success: false,
          vehicleInfo: searchTerm,
          error: "Veículo não encontrado",
        };
        results.push(result);
        console.log(`⚠️ Veículo não encontrado: ${searchTerm}`);
      } else {
        console.log(`🎯 Veículo encontrado: ${vehicle.description} (ID: ${vehicle.id})`);

        // Exclui o veículo
        const deleted = await excluirVeiculoPorId(vehicle.id);

        const result: DeleteResult = {
          success: deleted,
          vehicleInfo: `${vehicle.description} (ID: ${vehicle.id})`,
          error: deleted ? undefined : "Erro ao excluir veículo",
        };
        results.push(result);

        if (deleted) {
          console.log(`✅ Veículo excluído com sucesso: ${vehicle.description}`);
        } else {
          console.log(`❌ Falha ao excluir veículo: ${vehicle.description}`);
        }
      }

      // Chama onProgress apenas se foi fornecido
      if (onProgress) {
        const lastResult = results[results.length - 1];
        onProgress(i + 1, total, lastResult.vehicleInfo, lastResult.success);
      }
    } catch (err: any) {
      const result: DeleteResult = {
        success: false,
        vehicleInfo: searchTerm,
        error: err.response?.data?.message || err.message || "Erro desconhecido",
      };
      results.push(result);
      console.error(`❌ Erro ao processar ${searchTerm}:`, err.response?.data || err.message);

      // Chama onProgress apenas se foi fornecido
      if (onProgress) {
        onProgress(i + 1, total, searchTerm, false);
      }
    }
  }

  console.log(`✅ Processo concluído: ${results.filter(r => r.success).length}/${total} veículos excluídos`);
  return results;
}

// Exclui todos os veículos marcados "REMOVIDO"
async function excluirTodosVeiculosRemovidos(
  lote = 3,
  onProgress?: (processed: number, total: number, vehicleInfo?: string, success?: boolean) => void
): Promise<DeleteResult[]> {
  console.log("🔍 Buscando veículos com 'REMOVIDO' na descrição...");

  try {
    const veiculosRemovidos = await buscarVeiculosRemovidos();
    const total = veiculosRemovidos.length;

    console.log(`📋 Encontrados ${total} veículos para exclusão`);

    if (total === 0) {
      return [];
    }

    const results: DeleteResult[] = [];

    for (let i = 0; i < total; i++) {
      const vehicle = veiculosRemovidos[i];
      console.log(`🗑️ [${i + 1}/${total}] Excluindo: ${vehicle.description}`);

      try {
        const deleted = await excluirVeiculoPorId(vehicle.id);

        const result: DeleteResult = {
          success: deleted,
          vehicleInfo: `${vehicle.description} (ID: ${vehicle.id})`,
          error: deleted ? undefined : "Erro ao excluir veículo",
        };
        results.push(result);

        if (deleted) {
          console.log(`✅ Veículo excluído: ${vehicle.description}`);
        } else {
          console.log(`❌ Falha ao excluir: ${vehicle.description}`);
        }
      } catch (err: any) {
        const result: DeleteResult = {
          success: false,
          vehicleInfo: `${vehicle.description} (ID: ${vehicle.id})`,
          error: err.response?.data?.message || err.message || "Erro desconhecido",
        };
        results.push(result);
        console.error(`❌ Erro ao excluir ${vehicle.description}:`, err.response?.data || err.message);
      }

      // Chama onProgress apenas se foi fornecido
      if (onProgress) {
        const lastResult = results[results.length - 1];
        onProgress(i + 1, total, lastResult.vehicleInfo, lastResult.success);
      }
    }

    console.log(`✅ Processo concluído: ${results.filter(r => r.success).length}/${total} veículos excluídos`);
    return results;
  } catch (err: any) {
    console.error("❌ Erro ao buscar veículos removidos:", err.response?.data || err.message);
    throw err;
  }
}



export default {
  // Buscas
  buscarVeiculoPorDescription,
  buscarVeiculoPorUnitDescription,
  buscarVeiculoPorVin,
  buscarVeiculoPorDescriptionParcial,
  buscarVeiculosRemovidos,
  buscarVeiculoInteligente,
  // Exclusões
  excluirVeiculoPorId,
  excluirVeiculosEmLote,
  excluirTodosVeiculosRemovidos,
};

export type { VehicleSearchResult, DeleteResult };