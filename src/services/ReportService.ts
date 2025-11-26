import proxyApi from "./proxyApi";
import * as XLSX from "xlsx";

//types
interface Vehicle {
  id?: string;
  vin?: string;
  description?: string;
  unit_Description?: string;
  registration?: string;
  odometer?: number;
  lastKnownEventUtcTimestamp?: string;
  utcStartDate?: string;
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
  dataInicio: { key: 'utcStartDate', label: 'Data de Início', width: 22 }
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
  'utcStartDate': 'dataInicio'
};

const CONFIG = {
  PAGE_SIZE: 10000,
  REQUEST_DELAY: 300,
  TIMEZONE_OFFSET: -3 // UTC-3 para São Paulo
} as const;


//aux functions

/**
 * Formata data UTC para formato brasileiro com hora
 * @param utcDate - Data no formato ISO 8601 UTC
 * @returns String formatada como "DD/MM/YYYY HH:mm:ss" no fuso de São Paulo
 */
function formatarDataHora(utcDate: string | undefined | null): string {
  if (!utcDate) return '';
  
  try {
    const date = new Date(utcDate);
    
    const localDate = new Date(date.getTime() + CONFIG.TIMEZONE_OFFSET * 60 * 60 * 1000);
    const dia = localDate.getUTCDate().toString().padStart(2, '0');
    const mes = (localDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const ano = localDate.getUTCFullYear();
    const hora = localDate.getUTCHours().toString().padStart(2, '0');
    const minuto = localDate.getUTCMinutes().toString().padStart(2, '0');
    const segundo = localDate.getUTCSeconds().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
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



//API CALLS
async function buscarTodosVeiculos(onProgress?: ProgressCallback): Promise<Vehicle[]> {
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
        path: `/Vehicles?$top=${CONFIG.PAGE_SIZE}&$skip=${skip}`,
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const dados = response.data.value || [];
    veiculos.push(...dados);

    if (dados.length < CONFIG.PAGE_SIZE) break;

    skip += CONFIG.PAGE_SIZE;
    await delay(CONFIG.REQUEST_DELAY);
  }

  return veiculos;
}

// DATA FORMATTING

function formatarValorCampo(campo: CampoKey, valor: any): any {
  // Campos de data precisam de formatação especial
  if (campo === 'ultimoReport' || campo === 'dataInicio') {
    return formatarDataHora(valor);
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

      const valor = (veiculo as any)[config.key];
      linha[config.label] = formatarValorCampo(campo, valor);
    });

    return linha;
  });
}

// EXCEL GENERATION
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
  onProgress?: ProgressCallback
): Promise<ExportResult> {
  try {
    // Mapeia campos do frontend para o backend
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
    const veiculos = await buscarTodosVeiculos(onProgress);

    onProgress?.(
      veiculos.length,
      veiculos.length,
      "Formatando dados..."
    );
    const dados = formatarDados(veiculos, camposSelecionados);

    onProgress?.(
      veiculos.length,
      veiculos.length,
      "Gerando arquivo Excel..."
    );
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