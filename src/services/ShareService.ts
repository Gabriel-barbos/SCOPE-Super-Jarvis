import proxyApi from "./proxyApi";

interface UserGroup {
  id: string;
  description: string;
}

interface Vehicle {
  id: string;
  description: string;
}

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
  descriptions: string[],
  userGroupId: string,
  onProgress?: (sent: number, total: number, description?: string, success?: number, error?: string) => void
) {
  const total = descriptions.length;
  let sent = 0;
  let success = 0;

  for (const description of descriptions) {
    const descriptionTrimmed = description.toString().trim();
    if (!descriptionTrimmed) continue;

    console.log(`🔎 Processando veículo: ${descriptionTrimmed}`);

    const vehicleId = await buscarVeiculoPorDescription(descriptionTrimmed);
    if (!vehicleId) {
      const errorMsg = `Veículo não encontrado: ${descriptionTrimmed}`;
      console.log(`❌ ${errorMsg}`);
      sent++;
      if (onProgress) onProgress(sent, total, descriptionTrimmed, success, errorMsg);
      continue;
    }

    const sucesso = await compartilharVeiculo(vehicleId, userGroupId);
    if (sucesso) {
      success++;
      console.log(`✅ Veículo ${descriptionTrimmed} compartilhado!`);
    } else {
      const errorMsg = `Erro ao compartilhar: ${descriptionTrimmed}`;
      if (onProgress) onProgress(sent + 1, total, descriptionTrimmed, success, errorMsg);
    }

    sent++;
    if (onProgress) onProgress(sent, total, descriptionTrimmed, success);
  }
}

export default {
  listarUserGroups,
  compartilharVeiculosEmLote,
};