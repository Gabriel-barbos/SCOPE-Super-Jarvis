import axios from "axios";
import * as XLSX from "xlsx";
import proxyApi from "./proxyApi";

export type InputRow = { id?: string; vin?: string };
export type AnalysisRow = {
  idEnviado?: string;
  vinEnviado?: string;
  idEncontrado?: string | null;
  vinEncontrado?: string | null;
  description?: string | null;
  status: string;
  details?: string;
};


const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/", // configure VITE_API_BASE_URL
  timeout: 30000,
});

/**
 * Converte ISO utc para horário Brasil (string pt-BR)
 */
export function toBrazilDateTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

/**
 * Verifica se description contém "REMOVIDO" (case-insensitive)
 */
function isRemovedDescription(desc?: string | null) {
  if (!desc) return false;
  return desc.toLowerCase().includes("remov");
}

/**
 * Gera e baixa um arquivo XLSX do resultado
 */
export function downloadXlsx(rows: AnalysisRow[], filename = "analise_veiculos.xlsx") {
  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      "ID Enviado": r.idEnviado ?? "",
      "VIN Enviado": r.vinEnviado ?? "",
      "ID Encontrado": r.idEncontrado ?? "",
      "VIN Encontrado": r.vinEncontrado ?? "",
      "Description": r.description ?? "",
      "Status": r.status,
      "Detalhes": r.details ?? "",
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resultado");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Consulta a API para uma unidade por filtro (passar filter string já codificada)
 * Retorna o array value esperado pela API: response.data.value
 */
async function fetchVehiclesByFilter(filter: string) {
  // A API usa OData-style; envie o filter sem codificar o eq etc. encodeURIComponent o valor específico
  // Aqui filter deve ser como: unit_Description eq '868695060732631'
  const encoded = encodeURIComponent(filter);
  const url = `/Vehicles?$filter=${encoded}&$top=50`; // $top limit por segurança
  const res = await proxyApi.get(url);
  return res.data?.value ?? [];
}

/**
 * Lógica principal de análise.
 *
 * items: array de { id?, vin? }
 * options:
 *  - searchBy: 'id' | 'vin'
 *  - concurrency: number (paralelismo)
 * progressCb: (current, total, status) => void
 *
 * Retorna array AnalysisRow
 */
export async function analyzeVehicles(
  items: InputRow[],
  options: { searchBy: "id" | "vin"; concurrency?: number } = { searchBy: "id", concurrency: 5 },
  progressCb?: (current: number, total: number, status: string) => void
): Promise<AnalysisRow[]> {
  const total = items.length;
  let current = 0;
  const results: AnalysisRow[] = [];

  const concurrency = options.concurrency ?? 5;
  // Worker that processes one item
  async function processItem(item: InputRow) {
    try {
      const searchBy = options.searchBy;
      let filter = "";
      if (searchBy === "id") {
        const id = (item.id ?? "").trim();
        filter = `unit_Description eq '${id}'`;
      } else {
        const vin = (item.vin ?? "").trim();
        filter = `vin eq '${vin}'`;
      }

      if (!filter) {
        // nothing to search
        const row: AnalysisRow = {
          idEnviado: item.id,
          vinEnviado: item.vin,
          status: "Não informado",
          details: "linha sem id nem vin",
        };
        results.push(row);
        return;
      }

      progressCb?.(current + 1, total, `Consultando API (${searchBy})...`);
      const vehicles = await fetchVehiclesByFilter(filter);

      // increment to reflect that this item was processed
      // determine status per regras:
      // - Nenhum resultado => "Não encontrado / não reporta"
      if (!vehicles || vehicles.length === 0) {
        results.push({
          idEnviado: item.id,
          vinEnviado: item.vin,
          idEncontrado: null,
          vinEncontrado: null,
          description: null,
          status: "Não encontrado / não reporta",
        });
        return;
      }

      // Se houver resultados, analisar:
      // se buscar por id -> normalmente teremos 0..n resultados com esse unit_Description
      // se buscar por vin -> pode retornar múltiplos registros com mesmo vin
      // Regras prioritárias:
      // 1) Se algum registro possui description com "REMOVIDO" => REMOVIDO (marcar se TODOS estão removidos? usuário quer considerar se "um dos registros estiver removido, o status deve considerar isso" -> interpretamos como: se existe pelo menos um REMOVIDO, reportar REMOVIDO)
      // 2) Se existe registro cujo unit_Description === idEnviado AND vin === vinEnviado AND description não removido => OK
      // 3) Se existe registro(s) mas id/vin divergentes => "ID e chassi divergentes"
      // 4) Se existe registro com vin vazio => "Sem setup (VIN vazio)"
      // Observação: priorizamos REMOVIDO se encontrada.

      // normalize results
      const normalized = vehicles.map((v: any) => ({
        id: v.unit_Description ?? null,
        vin: v.vin ?? null,
        desc: v.description ?? null,
      }));

      // check any removed
      const anyRemoved = normalized.some((n) => isRemovedDescription(n.desc));
      if (anyRemoved) {
        results.push({
          idEnviado: item.id,
          vinEnviado: item.vin,
          idEncontrado: normalized[0]?.id ?? null,
          vinEncontrado: normalized[0]?.vin ?? null,
          description: normalized.map((n) => n.desc).join(" | "),
          status: "REMOVIDO",
          details: `Encontrados ${normalized.length} registros (pelo menos 1 com REMOVIDO)`,
        });
        return;
      }

      // check exact match OK (both id and vin equal)
      const exactMatch = normalized.find(
        (n) =>
          (item.id ? n.id === item.id : true) &&
          (item.vin ? (n.vin ?? "") === (item.vin ?? "") : true) &&
          !isRemovedDescription(n.desc)
      );
      if (exactMatch) {
        results.push({
          idEnviado: item.id,
          vinEnviado: item.vin,
          idEncontrado: exactMatch.id,
          vinEncontrado: exactMatch.vin,
          description: exactMatch.desc,
          status: "OK",
        });
        return;
      }

      // check vin empty
      const anyVinEmpty = normalized.some((n) => !n.vin || n.vin.toString().trim() === "");
      if (anyVinEmpty) {
        results.push({
          idEnviado: item.id,
          vinEnviado: item.vin,
          idEncontrado: normalized[0]?.id ?? null,
          vinEncontrado: normalized[0]?.vin ?? null,
          description: normalized.map((n) => n.desc).join(" | "),
          status: "Sem setup (VIN vazio)",
          details: `Um ou mais registros sem VIN`,
        });
        return;
      }

      // If there are results but no exact match -> divergente
      results.push({
        idEnviado: item.id,
        vinEnviado: item.vin,
        idEncontrado: normalized[0]?.id ?? null,
        vinEncontrado: normalized[0]?.vin ?? null,
        description: normalized.map((n) => n.desc).join(" | "),
        status: "ID e chassi divergentes",
        details: `Encontrados ${normalized.length} registros, nenhum com correspondência exata`,
      });
    } catch (err: any) {
      results.push({
        idEnviado: item.id,
        vinEnviado: item.vin,
        status: "Erro",
        details: err?.message ?? "Erro desconhecido",
      });
    } finally {
      current++;
      progressCb?.(current, total, `Processados ${current} de ${total}`);
    }
  }

  // Simple concurrency pool
  const queue = [...items];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    const worker = (async () => {
      while (queue.length) {
        const it = queue.shift();
        if (!it) break;
        // eslint-disable-next-line no-await-in-loop
        await processItem(it);
      }
    })();
    workers.push(worker);
  }
  await Promise.all(workers);

  return results;
}

/**
 * Função utilitária pronta para aceitar o arquivo XLSX/CSV lido no frontend (array de objetos)
 * e chamar analyzeVehicles e já baixar o resultado.
 */
export async function analyzeAndExport(
  parsedRows: InputRow[],
  options: { searchBy: "id" | "vin"; concurrency?: number },
  progressCb?: (current: number, total: number, status: string) => void
) {
  const rows = await analyzeVehicles(parsedRows, options, progressCb);
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  downloadXlsx(rows, `analise_veiculos_${stamp}.xlsx`);
  return rows;
}

export default {
  analyzeVehicles,
  analyzeAndExport,
  toBrazilDateTime,
  downloadXlsx,
};
