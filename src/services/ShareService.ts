import proxyApi from "./proxyApi";

interface UserGroup {
  id: string;
  description: string;
}

interface Vehicle {
  id: string;
  description: string;
  vin?: string;
}

type ShareType = "description" | "vin";

// Lista todos os grupos de usuários
async function listarUserGroups(): Promise<UserGroup[]> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: "/UserGroups?$select=id,description",
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

// Busca veículo por description
async function buscarVeiculoPorDescription(description: string): Promise<string | null> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=description eq '${description}'&$select=id,description`,
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

// Busca veículo por VIN
async function buscarVeiculoPorVin(vin: string): Promise<string | null> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=vin eq '${vin}'&$select=id,vin`,
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

async function buscarVeiculo(
  identifier: string, 
  type: ShareType
): Promise<string | null> {
  if (type === "vin") {
    return await buscarVeiculoPorVin(identifier);
  } else {
    return await buscarVeiculoPorDescription(identifier);
  }
}

// Compartilha um veículo com o grupo
async function compartilharVeiculo(vehicleId: string, userGroupId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    await proxyApi.post(
      "/proxy",
      {
        path: `/VehicleShareManagement(${vehicleId})/_.share`,
        method: "POST",
        body: {
          userGroupId,
          shareInMiddleGroups: true,
          shareVehicleTypes: true,
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return true;
  } catch (err: any) {
    console.error(`❌ Erro ao compartilhar veículo ${vehicleId}:`, err.response?.data || err.message);
    return false;
  }
}

// Compartilha veículos sequencialmente
async function compartilharVeiculosEmLote(
  identifiers: string[],
  userGroupId: string,
  onProgress?: (sent: number, total: number, identifier?: string, success?: number, error?: string) => void,
  shareType: ShareType = "description"
) {
  const total = identifiers.length;
  let sent = 0;
  let success = 0;

  const typeLabel = shareType === "vin" ? "VIN" : "Descrição";

  for (const identifier of identifiers) {
    const identifierTrimmed = identifier.toString().trim();
    if (!identifierTrimmed) continue;

    console.log(`🔎 Processando veículo (${typeLabel}): ${identifierTrimmed}`);

    const vehicleId = await buscarVeiculo(identifierTrimmed, shareType);
    if (!vehicleId) {
      const errorMsg = `Veículo não encontrado (${typeLabel}): ${identifierTrimmed}`;
      console.log(`❌ ${errorMsg}`);
      sent++;
      if (onProgress) onProgress(sent, total, identifierTrimmed, success, errorMsg);
      continue;
    }

    const sucesso = await compartilharVeiculo(vehicleId, userGroupId);
    if (sucesso) {
      success++;
      console.log(`✅ Veículo ${identifierTrimmed} compartilhado!`);
    } else {
      const errorMsg = `Erro ao compartilhar (${typeLabel}): ${identifierTrimmed}`;
      if (onProgress) onProgress(sent + 1, total, identifierTrimmed, success, errorMsg);
    }

    sent++;
    if (onProgress) onProgress(sent, total, identifierTrimmed, success);
  }
}

export default {
  listarUserGroups,
  compartilharVeiculosEmLote,
};