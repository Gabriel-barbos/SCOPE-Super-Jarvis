import proxyApi from "./proxyApi";
import * as XLSX from "xlsx";

interface Vehicle {
  vin?: string;
  description?: string;
  unit_Description?: string;
  registration?: string;
}

interface FormattedVehicle {
  Chassi: string;
  Descrição: string;
  Unidade: string;
  Placa: string;
}

interface ProgressCallback {
  (current: number, total: number, status: string): void;
}

// Busca veículos com paginação
async function buscarTodosVeiculos(
  onProgress?: ProgressCallback
): Promise<Vehicle[]> {
  const todosVeiculos: Vehicle[] = [];
  let skip = 0;
  const top = 10000;
  let temMaisDados = true;

  while (temMaisDados) {
    try {
      const token = localStorage.getItem("token");

      if (onProgress) {
        onProgress(
          todosVeiculos.length,
          todosVeiculos.length + top,
          `Buscando veículos... (${todosVeiculos.length} obtidos)`
        );
      }

      const response = await proxyApi.post(
        "/proxy",
        {
          path: `/Vehicles?$top=${top}&$skip=${skip}`,
          method: "GET",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const veiculos = response.data.value || [];
      todosVeiculos.push(...veiculos);

      if (veiculos.length < top) {
        temMaisDados = false;
      } else {
        skip += top;
      }

      // Delay para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`Erro ao buscar veículos (skip=${skip}):`, error.message);
      throw new Error(
        `Falha ao buscar veículos: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  return todosVeiculos;
}

// Formata dados para o Excel
function formatarDadosParaExcel(veiculos: Vehicle[]): FormattedVehicle[] {
  return veiculos.map((veiculo) => ({
    Chassi: veiculo.vin || "",
    Descrição: veiculo.description || "",
    Unidade: veiculo.unit_Description || "",
    Placa: veiculo.registration || "",
  }));
}

// Gera arquivo Excel e faz download
function gerarEBaixarExcel(
  dados: FormattedVehicle[],
  nomeArquivo: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(dados);

  // Define largura das colunas
  worksheet["!cols"] = [
    { wch: 20 }, // VIN
    { wch: 50 }, // Descrição
    { wch: 20 }, // Unidade
    { wch: 15 }, // Placa
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Veículos");

  // Gera arquivo e faz download
  XLSX.writeFile(workbook, nomeArquivo);
}

// Função principal de exportação
async function exportarVeiculos(
  onProgress?: ProgressCallback
): Promise<{ success: boolean; message: string; total: number }> {
  try {
    // Gera nome do arquivo com data/hora
    const dataHora = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const nomeArquivo = `Lista_Veiculos_${dataHora}.xlsx`;

    // Atualiza status inicial
    if (onProgress) {
      onProgress(0, 0, "Iniciando exportação de veículos...");
    }

    // Busca todos os veículos
    const veiculos = await buscarTodosVeiculos(onProgress);

    // Atualiza status de formatação
    if (onProgress) {
      onProgress(
        veiculos.length,
        veiculos.length,
        "Formatando dados para Excel..."
      );
    }

    // Formata os dados
    const dadosFormatados = formatarDadosParaExcel(veiculos);

    // Atualiza status de geração
    if (onProgress) {
      onProgress(veiculos.length, veiculos.length, "Gerando arquivo Excel...");
    }

    // Gera e baixa o arquivo
    gerarEBaixarExcel(dadosFormatados, nomeArquivo);

    // Retorna sucesso
    if (onProgress) {
      onProgress(
        veiculos.length,
        veiculos.length,
        `Relatório gerado com sucesso! (${veiculos.length} veículos)`
      );
    }

    return {
      success: true,
      message: `Relatório exportado com sucesso: ${nomeArquivo}`,
      total: veiculos.length,
    };
  } catch (error: any) {
    console.error("Erro ao exportar veículos:", error);

    if (onProgress) {
      onProgress(0, 0, "Erro ao exportar veículos");
    }

    return {
      success: false,
      message: error.message || "Erro desconhecido ao exportar veículos",
      total: 0,
    };
  }
}

export default {
  exportarVeiculos,
};
