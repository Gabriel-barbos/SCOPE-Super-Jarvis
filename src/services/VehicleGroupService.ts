import proxyApi from "./proxyApi";

interface VehicleGroup {
  id: string;
  description: string;
}

interface Vehicle {
  id: string;
  description: string;
  vin?: string;
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

type SearchType = "description" | "vin";

function sanitizeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

function getToken(): string {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
}

// ========== BUSCA ==========

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

async function buscarVeiculo(identifier: string, type: SearchType = "description"): Promise<Vehicle | null> {
  try {
    const safeValue = sanitizeODataString(identifier);
    const filterField = type === "vin" ? "vin" : "description";

    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=${filterField} eq '${safeValue}'&$select=id,description,vin`,
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo (${type}: ${identifier}):`, err.response?.data || err.message);
    return null;
  }
}

async function buscarVeiculosRemovidos(): Promise<Vehicle[]> {
  try {
    const res = await proxyApi.post(
      "/proxy",
      {
        path: "/Vehicles?$select=id,description,vin",
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );

    const vehicles = res.data.value || [];
    return vehicles.filter((v: any) => v.description?.toLowerCase().includes("removido"));
  } catch (err: any) {
    console.error("❌ Erro ao buscar veículos removidos:", err.response?.data || err.message);
    throw err;
  }
}

// ========== ADICIONAR ==========

async function adicionarVeiculosAoGrupo(
  groupDescription: string,
  identifiers: string[],
  identifierType: SearchType = "description",
  onProgress?: ProgressCallback
): Promise<OperationResult[]> {
  const results: OperationResult[] = [];
  const total = identifiers.length;
  let processed = 0;

  try {
    const grupos = await listarGrupos();
    const grupo = grupos.find((g) => g.description === groupDescription);

    if (!grupo) {
      throw new Error(`Grupo "${groupDescription}" não encontrado`);
    }

    // Busca e valida veículos
    const vehicleIds: string[] = [];
    for (const identifier of identifiers) {
      const vehicle = await buscarVeiculo(identifier, identifierType);

      const result: OperationResult = vehicle
        ? {
            success: true,
            identifier,
            vehicleInfo: `${vehicle.description} (${vehicle.vin || "sem VIN"})`,
          }
        : {
            success: false,
            identifier,
            error: "Veículo não encontrado",
          };

      results.push(result);
      processed++;

      if (vehicle) vehicleIds.push(vehicle.id);
      if (onProgress) onProgress(processed, total, result);
    }

    if (vehicleIds.length === 0) {
      console.warn("⚠️ Nenhum veículo válido encontrado");
      return results;
    }

    // Adiciona ao grupo
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/VehicleGroups(${grupo.id})/_.addVehicles`,
        method: "POST",
        body: { vehicleIds },
      },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status !== 204 && res.status !== 200) {
      throw new Error(`Falha ao adicionar ao grupo (status ${res.status})`);
    }

    console.log(`✅ ${vehicleIds.length} veículos adicionados ao grupo ${groupDescription}`);
    return results;
  } catch (err: any) {
    console.error("❌ Erro ao adicionar veículos ao grupo:", err.response?.data || err.message);
    throw err;
  }
}

// ========== REMOVER DO GRUPO ==========

async function removerVeiculosDoGrupo(
  groupDescription: string,
  identifiers: string[],
  identifierType: SearchType = "description",
  onProgress?: ProgressCallback
): Promise<OperationResult[]> {
  const results: OperationResult[] = [];
  const total = identifiers.length;
  let processed = 0;

  try {
    const grupos = await listarGrupos();
    const grupo = grupos.find((g) => g.description === groupDescription);

    if (!grupo) {
      throw new Error(`Grupo "${groupDescription}" não encontrado`);
    }

    // Busca e valida veículos
    const vehicleIds: string[] = [];
    for (const identifier of identifiers) {
      const vehicle = await buscarVeiculo(identifier, identifierType);

      const result: OperationResult = vehicle
        ? {
            success: true,
            identifier,
            vehicleInfo: `${vehicle.description} (${vehicle.vin || "sem VIN"})`,
          }
        : {
            success: false,
            identifier,
            error: "Veículo não encontrado",
          };

      results.push(result);
      processed++;

      if (vehicle) vehicleIds.push(vehicle.id);
      if (onProgress) onProgress(processed, total, result);
    }

    if (vehicleIds.length === 0) {
      console.warn("⚠️ Nenhum veículo válido encontrado");
      return results;
    }

    // Remove do grupo
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/VehicleGroups(${grupo.id})/_.removeVehicles`,
        method: "POST",
        body: { vehicleIds },
      },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status !== 204 && res.status !== 200) {
      throw new Error(`Falha ao remover do grupo (status ${res.status})`);
    }

    console.log(`✅ ${vehicleIds.length} veículos removidos do grupo ${groupDescription}`);
    return results;
  } catch (err: any) {
    console.error("❌ Erro ao remover veículos do grupo:", err.response?.data || err.message);
    throw err;
  }
}


// ========== RELATÓRIOS ==========

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
  buscarVeiculosRemovidos,
  adicionarVeiculosAoGrupo,
  removerVeiculosDoGrupo,
  gerarRelatorio,
};

export type { Vehicle, VehicleGroup, OperationResult, ProgressCallback, SearchType };