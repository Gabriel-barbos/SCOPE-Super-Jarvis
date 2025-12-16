import proxyApi from "./proxyApi";

interface VehicleGroup {
  id: string;
  description: string;
}

interface Vehicle {
  id: string;
  description: string;
  vin?: string;
  vehicleGroupIds?: string[];
}

interface OperationResult {
  success: boolean;
  identifier: string;
  vehicleInfo?: string;
  error?: string;
}

interface ProgressCallback {
  (
    processed: number,
    total: number,
    currentResult: OperationResult
  ): void;
}

type SearchType = "unit_Description" | "vin";

function sanitizeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

function getToken(): string {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
}



async function listarGrupos(): Promise<VehicleGroup[]> {
  try {
    const res = await proxyApi.post(
      "/proxy",
      {
        path: "/VehicleGroups?$select=id,description",
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    return res.data.value || [];
  } catch (err: any) {
    console.error("❌ Erro ao listar grupos:", err.response?.data || err.message);
    throw err;
  }
}

async function buscarVeiculo(identifier: string, type: SearchType = "unit_Description"): Promise<Vehicle | null> {
  try {
    const safeValue = sanitizeODataString(identifier);
    const filterField = type === "vin" ? "vin" : "unit_Description";

    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=${filterField} eq '${safeValue}'&$select=id,unit_Description,vin`,
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    const vehicles = res.data.value || [];
    return vehicles.length ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo (${identifier}):`, err.response?.data || err.message);
    return null;
  }
}


//mudar descrição
async function marcarVeiculoComoRemovido(vehicleId: string, currentDesc: string) {
  const novaDescricao =
    currentDesc.startsWith("REMOVIDO - ")
      ? currentDesc
      : `REMOVIDO - ${currentDesc}`;

  try {
    await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles(${vehicleId})`,
        method: "PATCH",
        body: { description: novaDescricao },
      },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("❌ Erro ao atualizar descrição:", err.response?.data || err.message);
    throw err;
  }
}


//adicionar ao grupo removido
async function moverVeiculoParaGrupo(vehicleId: string, grupoId: string) {
  try {
    await proxyApi.post(
      "/proxy",
      {
        path: `/VehicleGroups(${grupoId})/_.addVehicles`,
        method: "POST",
        body: { vehicleIds: [vehicleId] },
      },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    console.error("❌ Erro ao mover veículo para grupo:", err.response?.data || err.message);
    throw err;
  }
}


//remover todos os grupos
async function removerDeTodosOsGrupos(vehicleId: string) {
  try {
    // 1. Buscar o veículo com seus grupos
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles(${vehicleId})?$expand=vehicleGroupIds`,
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    const vehicle = res.data;
    const groupIds = vehicle?.vehicleGroupIds || [];

    // 2. Se não tiver grupos, não há nada a fazer
    if (groupIds.length === 0) {
      console.log(`ℹ️ Veículo ${vehicleId} não pertence a nenhum grupo`);
      return;
    }

    // 3. Remover o veículo de todos os grupos
    await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles(${vehicleId})/_.removeVehicleGroups`,
        method: "POST",
        body: { vehicleGroupIds: groupIds },
      },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Veículo ${vehicleId} removido de ${groupIds.length} grupo(s)`);
  } catch (err: any) {
    console.error("❌ Erro ao remover de todos os grupos:", err.response?.data || err.message);
    throw err;
  }
}


//fluxo principal de remoção em lote
interface RemocaoOptions {
  moverParaGrupoId?: string; // opcional
  removerDeGrupos?: boolean; // opcional
}

async function processarRemocaoEmLote(
  identifiers: string[],
  identifierType: SearchType,
  options: RemocaoOptions,
  onProgress?: ProgressCallback
): Promise<OperationResult[]> {
  
  const results: OperationResult[] = [];
  const total = identifiers.length;
  let processed = 0;

  for (const identifier of identifiers) {
    const vehicle = await buscarVeiculo(identifier, identifierType);

    if (!vehicle) {
      const result = {
        success: false,
        identifier,
        error: "Veículo não encontrado",
      };
      results.push(result);
      processed++;
      onProgress?.(processed, total, result);
      continue;
    }

    try {
      //Atualiza descrição
      await marcarVeiculoComoRemovido(vehicle.id, vehicle.description);

      //Remove de grupos se selecionado (fazer ANTES de mover para novo grupo)
      if (options.removerDeGrupos) {
        await removerDeTodosOsGrupos(vehicle.id);
      }

      //Move para grupo opcional
      if (options.moverParaGrupoId) {
        await moverVeiculoParaGrupo(vehicle.id, options.moverParaGrupoId);
      }

      const result = {
        success: true,
        identifier,
        vehicleInfo: `${vehicle.description} (${vehicle.vin || "sem VIN"})`,
      };

      results.push(result);
      processed++;
      onProgress?.(processed, total, result);

    } catch (err: any) {
      const result = {
        success: false,
        identifier,
        vehicleInfo: vehicle.description,
        error: err.message || "Erro no processamento",
      };

      results.push(result);
      processed++;
      onProgress?.(processed, total, result);
    }
  }

  return results;
}


export default {
  listarGrupos,
  buscarVeiculo,
  processarRemocaoEmLote,
};

export type {
  Vehicle,
  VehicleGroup,
  OperationResult,
  ProgressCallback,
  SearchType,
  RemocaoOptions,
};