import proxyApi from "./proxyApi";
import * as XLSX from "xlsx";

//types
interface LastKnownSimInformation {
  iccid?: string;
}

interface Vehicle {
  id?: string;
  vin?: string;
  description?: string;
  unit_Description?: string;
  registration?: string;
  odometer?: number;
  lastKnownEventUtcTimestamp?: string;
  utcStartDate?: string;
  lastKnownSimInformation?: LastKnownSimInformation | null;
}

interface ProgressCallback {
  (current: number, total: number, status: string): void;
}

interface ExportResult {
  success: boolean;
  message: string;
  total: number;
}

type CampoKey = keyof typeof CAMPOS;

//setup constantes
const CAMPOS = {
  chassi: { key: 'vin', label: 'Chassi', width: 20 },
  descricao: { key: 'description', label: 'Descrição', width: 50 },
  unidade: { key: 'unit_Description', label: 'Unidade', width: 20 },
  placa: { key: 'registration', label: 'Placa', width: 15 },
  odometro: { key: 'odometer', label: 'Odômetro', width: 15 },
  ultimoReport: { key: 'lastKnownEventUtcTimestamp', label: 'Último Report', width: 22 },
  dataInicio: { key: 'utcStartDate', label: 'Data de Início', width: 22 },
  iccid: { key: 'iccid', label: 'Nº SIM (ICCID)', width: 25 }
} as const;

const CAMPOS_PADRAO: CampoKey[] = ['chassi', 'descricao', 'unidade', 'placa'];

// Mapeamento frontend -> backend
const CAMPO_MAP: Record<string, CampoKey> = {
  'vin': 'chassi',
  'description': 'descricao',
  'unit_Description': 'unidade',
  'registration': 'placa',
  'odometer': 'odometro',
  'lastKnownEventUtcTimestamp': 'ultimoReport',
  'utcStartDate': 'dataInicio',
  'iccid': 'iccid'
};

const API_SELECT: Partial<Record<CampoKey, string>> = {
  chassi: 'vin',
  descricao: 'description',
  unidade: 'unit_Description',
  placa: 'registration',
  odometro: 'odometer',
  ultimoReport: 'lastKnownEventUtcTimestamp',
  dataInicio: 'utcStartDate',
};

const CONFIG = {
  PAGE_SIZE: 10000,
  REQUEST_DELAY: 300,
  TIMEZONE_OFFSET: -3 // UTC-3 para São Paulo
} as const;


//aux functions

/**
 * Converte data UTC para número serial do Excel (data real) ajustado para UTC-3 (São Paulo).
 * O Excel armazena datas como número de dias desde 1900-01-01.
 * Retornar um número em vez de string faz o Excel reconhecer a célula como data,
 * permitindo filtros, ordenação e formatação de data nativamente.
 * @param utcDate - Data no formato ISO 8601 UTC
 * @returns Número serial do Excel ou string vazia se inválido
 */
function utcParaSerialExcel(utcDate: string | undefined | null): number | '' {
  if (!utcDate) return '';

  try {
    const date = new Date(utcDate);
    if (isNaN(date.getTime())) return '';

    // Ajusta para UTC-3 (São Paulo)
    const localMs = date.getTime() + CONFIG.TIMEZONE_OFFSET * 60 * 60 * 1000;

    // Époco do Excel: 1900-01-01 (com ajuste do bug do ano bissexto 1900)
    const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30); // 30/12/1899
    const serialDias = (localMs - EXCEL_EPOCH_MS) / (24 * 60 * 60 * 1000);

    return serialDias;
  } catch (error) {
    console.error('Erro ao converter data para serial Excel:', error);
    return '';
  }
}

function gerarNomeArquivo(prefixo: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, -5);
  return `${prefixo}_${timestamp}.xlsx`;
}


 //Aguarda um tempo determinado
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function montarQueryOData(campos?: CampoKey[], filtrarAtivos = false): string {
  if (!campos?.length) return '';

  const selectFields = campos
    .map(campo => API_SELECT[campo])
    .filter((field): field is string => Boolean(field));

  if (filtrarAtivos && !selectFields.includes('description')) {
    selectFields.push('description');
  }

  const params: string[] = [];

  if (selectFields.length > 0) {
    params.push(`$select=${selectFields.join(',')}`);
  }

  if (campos.includes('iccid')) {
    params.push('$expand=lastKnownSimInformation($select=iccid)');
  }

  return params.length ? `&${params.join('&')}` : '';
}

function obterValorCampo(veiculo: Vehicle, campo: CampoKey): unknown {
  if (campo === 'iccid') {
    return veiculo.lastKnownSimInformation?.iccid;
  }

  const config = CAMPOS[campo];
  return (veiculo as Record<string, unknown>)[config.key];
}

//API CALLS
async function buscarTodosVeiculos(
  onProgress?: ProgressCallback,
  filtrarAtivos = false,
  campos?: CampoKey[]
): Promise<Vehicle[]> {
  const veiculos: Vehicle[] = [];
  const token = localStorage.getItem("token");
  let skip = 0;

  while (true) {
    onProgress?.(
      veiculos.length,
      veiculos.length + CONFIG.PAGE_SIZE,
      `Buscando veículos... (${veiculos.length} obtidos)`
    );

    const response = await proxyApi.post(
      "/proxy",
      {
        path: `/Vehicles?$top=${CONFIG.PAGE_SIZE}&$skip=${skip}${montarQueryOData(campos, filtrarAtivos)}`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const dados: Vehicle[] = response.data.value || [];
    const pagina = filtrarAtivos
      ? dados.filter(v => !v.description?.trim().toUpperCase().startsWith("REMOVIDO"))
      : dados;

    veiculos.push(...pagina);

    if (dados.length < CONFIG.PAGE_SIZE) break;

    skip += CONFIG.PAGE_SIZE;
    await delay(CONFIG.REQUEST_DELAY);
  }

  return veiculos;
}

// DATA FORMATTING

function formatarValorCampo(campo: CampoKey, valor: any): any {
  // Campos de data: retorna número serial do Excel para que o Excel reconheça como data real
  if (campo === 'ultimoReport' || campo === 'dataInicio') {
    return utcParaSerialExcel(valor);
  }

  // Retorna valor padrão ou vazio
  return valor !== undefined && valor !== null ? valor : '';
}

/**
 * Formata dados dos veículos conforme campos selecionados
 */
function formatarDados(
  veiculos: Vehicle[],
  campos: CampoKey[]
): Record<string, any>[] {
  return veiculos.map(veiculo => {
    const linha: Record<string, any> = {};

    campos.forEach(campo => {
      const config = CAMPOS[campo];
      if (!config) return;

      const valor = obterValorCampo(veiculo, campo);
      linha[config.label] = formatarValorCampo(campo, valor);
    });

    return linha;
  });
}

// EXCEL GENERATION

/** Formato de exibição de data/hora no Excel (padrão brasileiro) */
const EXCEL_DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';

function gerarExcel(
  dados: Record<string, any>[],
  campos: CampoKey[],
  nomeArquivo: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(dados);

  // Define larguras das colunas
  worksheet["!cols"] = campos.map(campo => ({
    wch: CAMPOS[campo]?.width || 20
  }));

  // Aplica formato de data nas colunas de data para que o Excel exiba corretamente
  // e permita filtros/ordenação por data
  const campoDatas: CampoKey[] = ['ultimoReport', 'dataInicio'];
  const headers = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 })[0] as string[];

  if (headers && dados.length > 0) {
    campoDatas.forEach(campoDt => {
      if (!campos.includes(campoDt)) return;
      const label = CAMPOS[campoDt].label;
      const colIdx = headers.indexOf(label);
      if (colIdx === -1) return;

      const colLetter = XLSX.utils.encode_col(colIdx);

      // Aplica o formato de célula de data em todas as linhas de dados (começa na linha 2)
      for (let rowIdx = 1; rowIdx <= dados.length; rowIdx++) {
        const cellAddress = `${colLetter}${rowIdx + 1}`;
        const cell = worksheet[cellAddress];
        if (cell && cell.v !== '' && cell.v !== undefined) {
          cell.t = 'n'; // tipo numérico (serial de data)
          cell.z = EXCEL_DATE_FORMAT; // formato de exibição
        }
      }
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Veículos");
  XLSX.writeFile(workbook, nomeArquivo);
}


//Exported functions
async function exportarVeiculos(
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  try {
    const nomeArquivo = gerarNomeArquivo('Lista_Veiculos');

    onProgress?.(0, 0, "Iniciando exportação de veículos...");
    const veiculos = await buscarTodosVeiculos(onProgress);

    onProgress?.(
      veiculos.length,
      veiculos.length,
      "Formatando dados para Excel..."
    );
    const dados = formatarDados(veiculos, CAMPOS_PADRAO);

    onProgress?.(
      veiculos.length,
      veiculos.length,
      "Gerando arquivo Excel..."
    );
    gerarExcel(dados, CAMPOS_PADRAO, nomeArquivo);

    onProgress?.(
      veiculos.length,
      veiculos.length,
      `Relatório gerado com sucesso! (${veiculos.length} veículos)`
    );

    return {
      success: true,
      message: `Relatório exportado com sucesso: ${nomeArquivo}`,
      total: veiculos.length,
    };
  } catch (error: any) {
    console.error('Erro ao exportar veículos:', error);
    onProgress?.(0, 0, "Erro ao exportar veículos");
    
    return {
      success: false,
      message: error.message || "Erro ao exportar veículos",
      total: 0,
    };
  }
}

/**
 * Gera relatório personalizado com campos selecionados
 */
async function gerarRelatorioPersonalizado(
  camposSelecionadosFrontend: string[],
  onProgress?: ProgressCallback,
  filtrarAtivos = false
): Promise<ExportResult> {
  try {
    const camposSelecionados = camposSelecionadosFrontend
      .map(campo => CAMPO_MAP[campo])
      .filter((campo): campo is CampoKey => Boolean(campo));

    if (camposSelecionados.length === 0) {
      return {
        success: false,
        message: "Nenhum campo válido selecionado",
        total: 0,
      };
    }

    const nomeArquivo = gerarNomeArquivo('Relatorio_Personalizado');

    onProgress?.(0, 0, "Iniciando exportação personalizada...");
    const veiculos = await buscarTodosVeiculos(onProgress, filtrarAtivos, camposSelecionados);

    onProgress?.(veiculos.length, veiculos.length, "Formatando dados...");
    const dados = formatarDados(veiculos, camposSelecionados);

    onProgress?.(veiculos.length, veiculos.length, "Gerando arquivo Excel...");
    gerarExcel(dados, camposSelecionados, nomeArquivo);

    onProgress?.(
      veiculos.length,
      veiculos.length,
      `Relatório personalizado gerado! (${veiculos.length} veículos)`
    );

    return {
      success: true,
      message: `Relatório exportado: ${nomeArquivo}`,
      total: veiculos.length,
    };
  } catch (error: any) {
    console.error('Erro ao gerar relatório personalizado:', error);
    onProgress?.(0, 0, "Erro ao gerar relatório personalizado");

    return {
      success: false,
      message: error.message || "Erro ao gerar relatório",
      total: 0,
    };
  }
}


export default {
  exportarVeiculos,
  gerarRelatorioPersonalizado,
  CAMPOS,
  CAMPO_MAP,
};

export type { Vehicle, ProgressCallback, ExportResult, CampoKey };