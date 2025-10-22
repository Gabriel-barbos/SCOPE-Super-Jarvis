import proxyApi from "./proxyApi";

interface VehicleGroup {
  id: string;
  description: string;
}

interface VehicleSearchResult {
  id: string;
  description: string;
  vin?: string;
}

type SearchType = "description" | "vin";
type OperationType = "add" | "remove";

function sanitizeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

async function listarVehicleGroups(): Promise<VehicleGroup[]> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: "/VehicleGroups?$select=id,description",
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.value || [];
  } catch (err: any) {
    console.error("❌ Erro ao listar grupos:", err.response?.data || err.message);
    return [];
  }
}

async function buscarVeiculo(identifier: string, type: SearchType): Promise<string | null> {
  try {
    const token = localStorage.getItem("token");
    const safeValue = sanitizeODataString(identifier);
    const filterField = type === "vin" ? "vin" : "description";

    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=${filterField} eq '${safeValue}'&$select=id,description,vin`,
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0].id : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo (${type}: ${identifier}):`, err.response?.data || err.message);
    return null;
  }
}

async function buscarVeiculosRemovidos(): Promise<VehicleSearchResult[]> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: "/Vehicles?$select=id,description,vin",
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const vehicles = res.data.value || [];
    return vehicles
      .filter((v: any) => v.description?.toLowerCase().includes("removido"))
      .map((v: any) => ({
        id: v.id,
        description: v.description,
        vin: v.vin,
      }));
  } catch (err: any) {
    console.error("❌ Erro ao buscar veículos removidos:", err.response?.data || err.message);
    return [];
  }
}

/**
 * Adiciona ou remove vários veículos de um grupo
 */
async function modifyVehiclesInGroup(
  operation: OperationType, // "add" ou "remove"
  groupDescription: string,
  vehicleIdentifiers: string[],
  identifierType: SearchType = "description"
): Promise<{
  success: boolean;
  addedOrRemoved: string[];
  notFound: string[];
  errors: string[];
}> {
  const result = {
    success: false,
    addedOrRemoved: [] as string[],
    notFound: [] as string[],
    errors: [] as string[],
  };

  try {
    const token = localStorage.getItem("token");
    const grupos = await listarVehicleGroups();
    const grupo = grupos.find((g) => g.description === groupDescription);

    if (!grupo) {
      result.errors.push(`Grupo "${groupDescription}" não encontrado.`);
      return result;
    }

    const vehicleIds: string[] = [];

    // Busca todos os veículos e armazena o feedback individual
    for (const identifier of vehicleIdentifiers) {
      const vehicleId = await buscarVeiculo(identifier, identifierType);
      if (!vehicleId) {
        result.notFound.push(identifier);
      } else {
        vehicleIds.push(vehicleId);
      }
    }

    if (vehicleIds.length === 0) {
      result.errors.push("Nenhum veículo válido encontrado.");
      return result;
    }

    const action = operation === "add" ? "_.addVehicles" : "_.removeVehicles";

    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/VehicleGroups(${grupo.id})/${action}`,
        method: "POST",
        body: { vehicleIds },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status === 204 || res.status === 200) {
      result.success = true;
      result.addedOrRemoved = vehicleIdentifiers.filter(id => !result.notFound.includes(id));
      console.log(`✅ ${vehicleIds.length} veículos ${operation === "add" ? "adicionados" : "removidos"} do grupo ${groupDescription}.`);
    } else {
      result.errors.push(`Falha ao ${operation === "add" ? "adicionar" : "remover"} veículos. (status ${res.status})`);
    }

    return result;
  } catch (err: any) {
    result.errors.push(err.response?.data || err.message);
    console.error(`❌ Erro ao ${operation === "add" ? "adicionar" : "remover"} veículos:`, err);
    return result;
  }
}

export {
  listarVehicleGroups,
  buscarVeiculo,
  buscarVeiculosRemovidos,
  modifyVehiclesInGroup,
};
