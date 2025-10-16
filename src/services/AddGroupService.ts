import proxyApi from "./proxyApi";

interface VehicleGroup {
  id: string;
  description: string;
}

type ShareType = "description" | "vin";

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
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data.value || [];
  } catch (err: any) {
    console.error("❌ Erro ao listar grupos:", err.response?.data || err.message);
    return [];
  }
}

async function buscarVeiculoPorDescription(description: string): Promise<string | null> {
  try {
    const token = localStorage.getItem("token");
    const safeDescription = sanitizeODataString(description);
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=description eq '${safeDescription}'&$select=id,description`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0].id : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo ${description}:`, err.response?.data || err.message);
    return null;
  }
}

async function buscarVeiculoPorVin(vin: string): Promise<string | null> {
  try {
    const token = localStorage.getItem("token");
    const safeVin = sanitizeODataString(vin);
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=vin eq '${safeVin}'&$select=id,vin`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0].id : null;
  } catch (err: any) {
    console.error(`❌ Erro ao buscar veículo por VIN ${vin}:`, err.response?.data || err.message);
    return null;
  }
}

async function buscarVeiculo(identifier: string, type: ShareType): Promise<string | null> {
  return type === "vin"
    ? await buscarVeiculoPorVin(identifier)
    : await buscarVeiculoPorDescription(identifier);
}

async function addVehiclesToGroup(
  groupDescription: string,
  vehicleIdentifier: string,
  identifierType: ShareType = "description"
): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    const grupos = await listarVehicleGroups();
    const grupo = grupos.find((g) => g.description === groupDescription);
    if (!grupo) {
      console.error(`❌ Grupo "${groupDescription}" não encontrado.`);
      return false;
    }
    
    const vehicleId = await buscarVeiculo(vehicleIdentifier, identifierType);
    if (!vehicleId) {
      console.error(`❌ Veículo "${vehicleIdentifier}" não encontrado.`);
      return false;
    }

    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/VehicleGroups(${grupo.id})/_.addVehicles`,
        method: "POST",
        body: { vehicleIds: [vehicleId] },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log(`✅ Veículo ${vehicleIdentifier} adicionado ao grupo ${groupDescription}.`);
    return true;
  } catch (err: any) {
    console.error("❌ Erro ao adicionar veículo ao grupo:", err.response?.data || err.message);
    return false;
  }
}

export {
  listarVehicleGroups,
  buscarVeiculo,
  buscarVeiculoPorVin,
  buscarVeiculoPorDescription,
  addVehiclesToGroup,
};
