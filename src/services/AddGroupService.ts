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

function sanitizeODataString(value: string): string {
  return value.replace(/'/g, "''");
}

//Lista todos os grupos de veículos
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
    console.error(" Erro ao listar grupos:", err.response?.data || err.message);
    return [];
  }
}

//Busca veículo por descrição ou VIN
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
    console.error(` Erro ao buscar veículo (${type}: ${identifier}):`, err.response?.data || err.message);
    return null;
  }
}

// Busca todos os veículos com "removido" na descrição
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
    console.error(" Erro ao buscar veículos removidos:", err.response?.data || err.message);
    return [];
  }
}

//Adiciona vários veículos a um grupo
async function addVehiclesToGroup(
  groupDescription: string,
  vehicleIdentifiers: string[],
  identifierType: SearchType = "description"
): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    const grupos = await listarVehicleGroups();
    const grupo = grupos.find((g) => g.description === groupDescription);

    if (!grupo) {
      console.error(`❌ Grupo "${groupDescription}" não encontrado.`);
      return false;
    }

    // Busca todos os IDs dos veículos primeiro
    const vehicleIds: string[] = [];
    for (const identifier of vehicleIdentifiers) {
      const vehicleId = await buscarVeiculo(identifier, identifierType);
      if (!vehicleId) {
        console.warn(`⚠️ Veículo não encontrado: ${identifier}`);
        continue;
      }
      vehicleIds.push(vehicleId);
    }

    if (vehicleIds.length === 0) {
      console.error(" Nenhum veículo válido encontrado.");
      return false;
    }


    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/VehicleGroups(${grupo.id})/_.addVehicles`,
        method: "POST",
        body: { vehicleIds: vehicleIds },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.status === 204 || res.status === 200) {
      console.log(`✅ ${vehicleIds.length} veículos adicionados ao grupo ${groupDescription}.`);
      return true;
    } else {
      console.error(
        ` Falha ao adicionar veículos ao grupo ${groupDescription}. (status ${res.status})`
      );
      return false;
    }
  } catch (err: any) {
    console.error(
      " Erro ao adicionar veículos ao grupo:",
      err.response?.data || err.message
    );
    return false;
  }
}

export {
  listarVehicleGroups,
  buscarVeiculo,
  buscarVeiculosRemovidos,
  addVehiclesToGroup,
};  