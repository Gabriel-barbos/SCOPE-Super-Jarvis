import proxyApi from "./proxyApi";

interface VehicleGroup {
  id: string;
  description: string;
}

interface Vehicle {
  id: string;
  description: string;
  vin?: string;
  unit_Description?: string;
}

interface OperationResult {
  success: boolean;
  identifier: string;
  vehicleInfo?: string;
  error?: string;
}

interface ProgressCallback {
  (processed: number, total: number, currentResult: OperationResult): void;
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

//Buscar grupos de veículos

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
    console.error("Erro ao listar grupos:", err.response?.data || err.message);
    throw err;
  }
}

//Buscar veículo por identificação
async function buscarVeiculo(
  identifier: string,
  type: SearchType = "unit_Description"
): Promise<Vehicle | null> {
  try {
    const safeValue = sanitizeODataString(identifier);
    const filterField = type === "vin" ? "vin" : "unit_Description";

    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=${filterField} eq '${safeValue}'&$select=id,description,vin,unit_Description`,
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`Erro ao buscar veículo (${identifier}):`, err.response?.data || err.message);
    return null;
  }
}

//mudar descrição
async function marcarVeiculoComoRemovido(
  vehicleId: string,
  currentDescription: string
): Promise<boolean> {
  try {
    const novaDescricao = currentDescription.startsWith("REMOVIDO - ")
      ? currentDescription
      : `REMOVIDO - ${currentDescription}`;

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

    console.log(`Veículo ${vehicleId} marcado como REMOVIDO`);
    return true;
  } catch (err: any) {
    console.error(` Erro ao marcar veículo como removido:`, err.response?.data || err.message);
    return false;
  }
}

//Remover de todos os grupos - REFAZER  

async function removerDeTodosOsGrupos(vehicleId: string): Promise<boolean> {
  try {
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

    if (groupIds.length === 0) {
      console.log(`ℹ Veículo ${vehicleId} não pertence a nenhum grupo`);
      return true;
    }

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

    console.log(` Veículo ${vehicleId} removido de ${groupIds.length} grupo(s)`);
    return true;
  } catch (err: any) {
    console.error("❌ Erro ao remover de todos os grupos:", err.response?.data || err.message);
    return false;
  }
}

async function moverVeiculoParaGrupo(vehicleId: string, grupoId: string): Promise<boolean> {
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

    console.log(` Veículo ${vehicleId} movido para grupo ${grupoId}`);
    return true;
  } catch (err: any) {
    console.error(" Erro ao mover veículo para grupo:", err.response?.data || err.message);
    return false;
  }
}

// Processar remoção em lote

interface RemocaoOptions {
  removerDeGrupos?: boolean;
  moverParaGrupoId?: string;
}

async function processarRemocaoEmLote(
  identifiers: string[],
  searchType: SearchType,
  options: RemocaoOptions,
  onProgress?: ProgressCallback
): Promise<OperationResult[]> {
  const results: OperationResult[] = [];
  const total = identifiers.length;
  let processed = 0;

  for (const identifier of identifiers) {
    const vehicle = await buscarVeiculo(identifier, searchType);

    if (!vehicle) {
      const result: OperationResult = {
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
      // Atualiza descrição
      await marcarVeiculoComoRemovido(vehicle.id, vehicle.description);

      //Remove de grupos se solicitado
      if (options.removerDeGrupos) {
        await removerDeTodosOsGrupos(vehicle.id);
      }

      //Move para grupo se solicitado
      if (options.moverParaGrupoId) {
        await moverVeiculoParaGrupo(vehicle.id, options.moverParaGrupoId);
      }

      const result: OperationResult = {
        success: true,
        identifier,
        vehicleInfo: `${vehicle.description} (${vehicle.vin || "sem VIN"})`,
      };

      results.push(result);
      processed++;
      onProgress?.(processed, total, result);
    } catch (err: any) {
      const result: OperationResult = {
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

// Gerar relatório resumido

function gerarRelatorio(results: OperationResult[]): {
  total: number;
  sucessos: number;
  falhas: number;
  detalhes: { sucesso: OperationResult[]; falha: OperationResult[] };
} {
  const sucesso = results.filter((r) => r.success);
  const falha = results.filter((r) => !r.success);

  return {
    total: results.length,
    sucessos: sucesso.length,
    falhas: falha.length,
    detalhes: { sucesso, falha },
  };
}

export default {
  listarGrupos,
  buscarVeiculo,
  processarRemocaoEmLote,
  gerarRelatorio,
};

export type {
  Vehicle,
  VehicleGroup,
  OperationResult,
  ProgressCallback,
  SearchType,
  RemocaoOptions,
};