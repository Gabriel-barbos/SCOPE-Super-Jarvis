
import proxyApi from "./proxyApi";

interface VehicleGroup {
  id: string;
  description: string;
}

interface Vehicle {
  id: string;
  description: string;
  unit_Description: string;
  vin?: string;
  registration?: string;
  odometer?: number;
  vehicleGroupIds?: string[];
}

interface SetupData {
  id: string;
  vin: string;
  model: string;
  plate?: string;
  vehicle_group?: string;
  odometer?: number;
  isSecondarySetup?: boolean;
}

interface SetupResult {
  success: boolean;
  identifier: string;
  vehicleInfo?: string;
  error?: string;
}

interface ProgressCallback {
  (processed: number, total: number, currentResult: SetupResult): void;
}

function getToken(): string {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token não encontrado");
  return token;
}

// Busca grupos de veículos
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
    console.error(" Erro ao listar grupos:", err.response?.data || err.message);
    throw err;
  }
}

function sanitizeODataString(value: string): string {
  return value.replace(/'/g, "''");
}
// Busca veículo pelo ID do dispositivo
async function buscarVeiculoPorId(unitId: string): Promise<Vehicle | null> {
  try {
    const safeValue = sanitizeODataString(unitId);

    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=unit_Description eq '${safeValue}'&$select=id,description,unit_Description,vin,registration,odometer`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      }
    );

    const vehicles = res.data?.value ?? [];
    return vehicles.length ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`Erro ao buscar veículo ${unitId}:`, err.response?.data || err.message);
    return null;
  }
}

// monta a descrição do veículo
function construirDescription(
  model: string,
  vin: string,
  plate?: string,
  isSecondarySetup?: boolean
): string {
  let description = "";
  
  if (plate && plate.trim()) {
    description = `${plate.trim()} - ${model.trim()} - ${vin.trim()}`;
  } else {
    description = `${model.trim()} - ${vin.trim()}`;
  }
  
  if (isSecondarySetup) {
    description += " II";
  }
  
  return description;
}

// Encontra grupo pelo nome
function encontrarGrupoSemelhante(
  nomeGrupo: string,
  grupos: VehicleGroup[]
): VehicleGroup | null {
  if (!nomeGrupo || !grupos.length) return null;
  
  const nomeBusca = nomeGrupo.toLowerCase().trim();
  
  // Busca exata
  let melhorGrupo = grupos.find(
    g => g.description.toLowerCase().trim() === nomeBusca
  );
  
  if (melhorGrupo) return melhorGrupo;
  
  // Busca por includes
  melhorGrupo = grupos.find(
    g => g.description.toLowerCase().includes(nomeBusca)
  );
  
  if (melhorGrupo) return melhorGrupo;
  
  // Busca invertida
  melhorGrupo = grupos.find(
    g => nomeBusca.includes(g.description.toLowerCase())
  );
  
  return melhorGrupo || null;
}

// Atualiza o veículo com os novos dados
async function atualizarVeiculo(
  vehicleId: string,
  updateData: Partial<Vehicle>
): Promise<boolean> {
  try {
    await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles(${vehicleId})`,
        method: "PATCH",
        body: updateData,
      },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    return true;
  } catch (err: any) {
    console.error(` Erro ao atualizar veículo ${vehicleId}:`, err.response?.data || err.message);
    return false;
  }
}

// Processa setup em lote
async function processarSetupEmLote(
  items: SetupData[],
  onProgress?: ProgressCallback
): Promise<SetupResult[]> {
  const results: SetupResult[] = [];
  const total = items.length;
  let processed = 0;
  
  // Busca grupos uma vez
  const grupos = await listarGrupos();
  
  for (const item of items) {
    try {
      //Busca o veículo pelo ID
      const vehicle = await buscarVeiculoPorId(item.id);
      
      if (!vehicle) {
        const result: SetupResult = {
          success: false,
          identifier: item.id,
          error: "Veículo não encontrado",
        };
        results.push(result);
        processed++;
        onProgress?.(processed, total, result);
        continue;
      }
      
      //Constrói a description
      const description = construirDescription(
        item.model,
        item.vin,
        item.plate,
        item.isSecondarySetup
      );
      
      //Prepara dados para atualização
      const updateData: Partial<Vehicle> = {
        description,
        vin: item.vin,
      };
      
      // Adiciona placa se fornecida
      if (item.plate && item.plate.trim()) {
        updateData.registration = item.plate.trim();
      }
      
      // Adiciona odômetro se fornecido
      if (item.odometer !== undefined && item.odometer !== null) {
        updateData.odometer = Number(item.odometer);
      }
      
      //  Procura e adiciona grupo se fornecido
      if (item.vehicle_group && item.vehicle_group.trim()) {
        const grupoEncontrado = encontrarGrupoSemelhante(item.vehicle_group, grupos);
        
        if (grupoEncontrado) {
          // Adiciona aos grupos existentes
          const gruposAtuais = vehicle.vehicleGroupIds || [];
          
          // Evita duplicatas
          if (!gruposAtuais.includes(grupoEncontrado.id)) {
            updateData.vehicleGroupIds = [...gruposAtuais, grupoEncontrado.id];
          }
        }
      }
      
      //Atualiza o veículo
      const sucesso = await atualizarVeiculo(vehicle.id, updateData);
      
      const result: SetupResult = {
        success: sucesso,
        identifier: item.id,
        vehicleInfo: description,
        error: sucesso ? undefined : "Erro ao atualizar veículo",
      };
      
      results.push(result);
      processed++;
      onProgress?.(processed, total, result);
      
    } catch (err: any) {
      const result: SetupResult = {
        success: false,
        identifier: item.id,
        error: err.message || "Erro desconhecido",
      };
      
      results.push(result);
      processed++;
      onProgress?.(processed, total, result);
    }
  }
  
  return results;
}

// Gera relatório dos resultados
function gerarRelatorio(results: SetupResult[]): {
  total: number;
  sucessos: number;
  falhas: number;
  detalhes: { sucesso: SetupResult[]; falha: SetupResult[] };
} {
  const sucesso = results.filter(r => r.success);
  const falha = results.filter(r => !r.success);
  
  return {
    total: results.length,
    sucessos: sucesso.length,
    falhas: falha.length,
    detalhes: { sucesso, falha },
  };
}

export default {
  listarGrupos,
  buscarVeiculoPorId,
  processarSetupEmLote,
  gerarRelatorio,
};

export type { SetupData, SetupResult, ProgressCallback, Vehicle, VehicleGroup };