import proxyApi from "./proxyApi";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OdometerInput {
  /** Chassi (VIN) ou unit_description do veículo */
  chassi: string;
  /** Valor do odômetro em km */
  odometro: string | number;
  /** Data da medição (opcional). Quando presente, substitui a data atual no ajuste */
  dataAjuste?: string;
}

export interface VehicleSearchResult {
  id: string;
  description: string;
  vin?: string;
  unit_Description?: string;
}

export type OdometerResultStatus = "success" | "not_found" | "error" | "invalid";

export interface OdometerResult {
  chassi: string;
  odometro: string | number;
  status: OdometerResultStatus;
  vehicleInfo?: string;
  vehicleId?: string;
  error?: string;
}

export interface OdometerSummary {
  total: number;
  sucessos: number;
  falhas: number;
  naoEncontrados: number;
  invalidos: number;
  results: OdometerResult[];
}

export type OdometerProgressCallback = (
  processed: number,
  total: number,
  current?: { chassi: string; status: OdometerResultStatus; vehicleInfo?: string }
) => void;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitiza strings para uso em filtros OData (escapa aspas simples) */
function sanitizeOData(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * Tenta interpretar uma string de data nos formatos mais comuns do Excel brasileiro
 * (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY) e retorna um ISO string UTC.
 * Retorna null se não conseguir interpretar.
 */
function parseExcelDate(raw: string): string | null {
  const s = raw.trim();

  // Formato DD/MM/YYYY ou DD/MM/YYYY HH:mm:ss
  const brMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[\s T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (brMatch) {
    const [, d, m, y, hh = "00", mm = "00", ss = "00"] = brMatch;
    const dt = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${hh}:${mm}:${ss}Z`);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }

  // Formato ISO YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString();
  }

  return null;
}

/**
 * Parser de lista colada da planilha — suporta TAB, ponto-e-vírgula, vírgula e espaços.
 * Aceita 2 ou 3 colunas: CHASSI | ODOMETRO | DATA (opcional).
 * @param usarData  Quando true, tenta ler a 3ª coluna como data de medição
 */
export function parsePastedList(raw: string, usarData = false): OdometerInput[] {
  return raw
    .split("\n")
    .map((line) => line.replace(/\r/g, "").trim())
    .filter(Boolean)
    .map((line) => {
      let separator: string | RegExp = ",";
      if (line.includes("\t")) separator = "\t";
      else if (line.includes(";")) separator = ";";
      else if (line.includes(",")) separator = ",";
      else separator = /\s+/;

      const parts = line.split(separator).map((s) => s.trim()).filter(Boolean);

      if (parts.length >= 2) {
        const dataAjuste = usarData && parts[2] ? parseExcelDate(parts[2]) ?? undefined : undefined;
        return {
          chassi: parts[0],
          // Remove caracteres não numéricos (pontos, vírgulas como separador de milhar etc.)
          odometro: parts[1].replace(/[^\d.]/g, ""),
          ...(dataAjuste ? { dataAjuste } : {}),
        };
      }
      return null;
    })
    .filter((v): v is OdometerInput => v !== null && Boolean(v.chassi) && Boolean(v.odometro));
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/** Busca veículo por VIN */
async function buscarVeiculoPorVin(vin: string): Promise<VehicleSearchResult | null> {
  try {
    const token = localStorage.getItem("token");
    const safe = sanitizeOData(vin);
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=vin eq '${safe}'&$select=id,description,vin,unit_Description`,
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const vehicles: VehicleSearchResult[] = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`[VIN Search Error] (${vin}):`, err.response?.data || err.message);
    return null;
  }
}

/** Busca veículo por unit_Description */
async function buscarVeiculoPorUnitDescription(unitDesc: string): Promise<VehicleSearchResult | null> {
  try {
    const token = localStorage.getItem("token");
    const safe = sanitizeOData(unitDesc);
    const res = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$filter=unit_Description eq '${safe}'&$select=id,description,vin,unit_Description`,
        method: "GET",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const vehicles: VehicleSearchResult[] = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err: any) {
    console.error(`[Unit Description Search Error] (${unitDesc}):`, err.response?.data || err.message);
    return null;
  }
}

/**
 * Busca inteligente: tenta VIN primeiro, depois unit_Description.
 * Espelha exatamente a lógica do script CLI original.
 */
async function buscarVeiculo(chassi: string): Promise<VehicleSearchResult | null> {
  let veiculo = await buscarVeiculoPorVin(chassi);
  if (!veiculo) {
    console.log(`   [OdometerService] Nao encontrado por VIN, tentando unit_Description: ${chassi}`);
    veiculo = await buscarVeiculoPorUnitDescription(chassi);
  }
  return veiculo;
}

/**
 * Realiza o ajuste de odômetro via DeviceOdometerAdjustments.
 * @param adjustmentDate  Data ISO do ajuste. Se omitida, usa a data/hora atual.
 */
async function ajustarOdometro(
  vehicleId: string,
  odometerValue: string | number,
  adjustmentDate?: string
): Promise<boolean> {
  try {
    const token = localStorage.getItem("token");
    const valor = parseFloat(String(odometerValue));
    const eventTimestamp = adjustmentDate ?? new Date().toISOString();

    const payload = {
      vehicle_Id: vehicleId,
      startUtcTimestamp: null,
      decimalOdometer: 0,
      decimalOdometerAdjustment: valor,
      decimalOdometerUserProvidedValue: valor,
      decimalOdometerAdjustmentEventUtcTimestamp: eventTimestamp,
    };

    await proxyApi.post(
      "/proxy",
      {
        path: `/DeviceOdometerAdjustments`,
        method: "POST",
        body: payload,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return true;
  } catch (err: any) {
    console.error(`[Odometer Adjustment Error] (vehicleId=${vehicleId}):`, err.response?.data || err.message);
    return false;
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Processa uma lista de veículos e ajusta o odômetro de cada um.
 *
 * - Busca primeiro por VIN; se não encontrar, tenta unit_Description.
 * - Delay de 500ms entre itens para evitar rate limiting (igual ao script original).
 * - Chama `onProgress` após cada item processado.
 *
 * @param veiculos   Lista de { chassi, odometro }
 * @param onProgress Callback opcional de progresso
 * @returns          Sumário com results detalhados e totalizadores
 */
async function ajustarOdometroEmLote(
  veiculos: OdometerInput[],
  onProgress?: OdometerProgressCallback
): Promise<OdometerSummary> {
  const total = veiculos.length;
  const results: OdometerResult[] = [];

  let sucessos = 0;
  let falhas = 0;
  let naoEncontrados = 0;
  let invalidos = 0;

  console.log(`[OdometerService] Iniciando ajuste de odometro para ${total} veiculos...`);

  for (let i = 0; i < total; i++) {
    const { chassi, odometro, dataAjuste } = veiculos[i];

    // Validação dos dados
    if (!chassi || !odometro) {
      const result: OdometerResult = {
        chassi: chassi || "(vazio)",
        odometro: odometro || 0,
        status: "invalid",
        error: "Chassi ou odometro ausente",
      };
      results.push(result);
      invalidos++;
      console.log(`[${i + 1}/${total}] Dados invalidos: chassi=${chassi}, odometro=${odometro}`);
      onProgress?.(i + 1, total, { chassi: result.chassi, status: "invalid" });
      continue;
    }

    console.log(`[${i + 1}/${total}] Processando: ${chassi} | Odometro: ${odometro} km`);

    try {
      const veiculo = await buscarVeiculo(chassi);

      if (!veiculo) {
        const result: OdometerResult = {
          chassi,
          odometro,
          status: "not_found",
          error: "Veiculo nao encontrado (VIN e unit_Description)",
        };
        results.push(result);
        naoEncontrados++;
        console.log(`[${i + 1}/${total}] Veiculo nao encontrado: ${chassi}`);
        onProgress?.(i + 1, total, { chassi, status: "not_found" });
      } else {
        console.log(`[${i + 1}/${total}] Encontrado: ${veiculo.description} (ID: ${veiculo.id})`);
        if (dataAjuste) {
          console.log(`[${i + 1}/${total}] Usando data de ajuste: ${dataAjuste}`);
        }

        const ok = await ajustarOdometro(veiculo.id, odometro, dataAjuste);

        const result: OdometerResult = {
          chassi,
          odometro,
          vehicleId: veiculo.id,
          vehicleInfo: `${veiculo.description} (ID: ${veiculo.id})`,
          status: ok ? "success" : "error",
          error: ok ? undefined : "Falha ao chamar DeviceOdometerAdjustments",
        };
        results.push(result);

        if (ok) {
          sucessos++;
          console.log(`[${i + 1}/${total}] Odometro ajustado: ${chassi} -> ${odometro} km`);
        } else {
          falhas++;
          console.log(`[${i + 1}/${total}] Falha ao ajustar: ${chassi}`);
        }

        onProgress?.(i + 1, total, {
          chassi,
          status: result.status,
          vehicleInfo: result.vehicleInfo,
        });
      }
    } catch (err: any) {
      const result: OdometerResult = {
        chassi,
        odometro,
        status: "error",
        error: err?.response?.data?.message || err?.message || "Erro desconhecido",
      };
      results.push(result);
      falhas++;
      console.error(`[Odometer Error] [${i + 1}/${total}] Erro inesperado (${chassi}):`, err.response?.data || err.message);
      onProgress?.(i + 1, total, { chassi, status: "error" });
    }

    // Delay entre requisições para não sobrecarregar a API (150ms)
    if (i < total - 1) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  const summary: OdometerSummary = {
    total,
    sucessos,
    falhas,
    naoEncontrados,
    invalidos,
    results,
  };

  console.log("\n[OdometerService] RESUMO:");
  console.log(`   Sucessos:         ${sucessos}`);
  console.log(`   Falhas:           ${falhas}`);
  console.log(`   Não encontrados: ${naoEncontrados}`);
  console.log(`   Inválidos:        ${invalidos}`);
  console.log(`   Total:            ${total}`);

  return summary;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export default {
  parsePastedList,
  buscarVeiculo,
  buscarVeiculoPorVin,
  buscarVeiculoPorUnitDescription,
  ajustarOdometro,
  ajustarOdometroEmLote,
};

export type { VehicleSearchResult as OdometerVehicleSearchResult };
