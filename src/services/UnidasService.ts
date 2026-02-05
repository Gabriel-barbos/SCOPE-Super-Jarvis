import axios, { AxiosInstance } from "axios";

export interface Veiculo {
  id: string;
  vin: string;
  vehicleGroups: { isAll: boolean; id: string }[];
}

class UnidasService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: "https://scopeserver.onrender.com",
      timeout: 20000,
    });
  }

  /**
   * Gera o token de acesso da Unidas
   */
  async loginUnidas(): Promise<void> {
    console.log(" Solicitando token da Unidas...");

    try {
      const res = await axios.post("https://scopeserver.onrender.com/api/jarvis/get-token", {
        username: "Unidasadm",
        password: "Unidasadm@1qaz",
      });

      this.token = res.data?.access_token;

      if (!this.token) {
        console.error(" Token não retornado da API");
        throw new Error("Não foi possível obter o token da Unidas");
      }

      console.log(" Token recebido com sucesso:", this.token.slice(0, 10) + "...");
    } catch (err: any) {
      console.error(" Erro ao gerar token da Unidas:", err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * Busca veículos que possuem apenas 1 grupo "isAll=true"
   */
  async buscarVeiculosSemGrupo(
    lote = 10000,
    onProgress?: (processados: number, total: number, descricao?: string) => void
  ): Promise<Veiculo[]> {
    if (!this.token) {
      throw new Error(" Você precisa chamar loginUnidas() antes.");
    }

    console.log(" Iniciando busca de veículos usando token da Unidas...");

    let skip = 0;
    let totalProcessados = 0;
    let total = 0;
    const resultado: Veiculo[] = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const res = await this.api.post("/proxy", {
          path: `/Vehicles?$expand=vehicleGroups&$top=${lote}&$skip=${skip}&$count=true`,
          method: "GET",
          token: this.token,
        });

        const data = res.data;

        if (!data?.value || data.value.length === 0) {
          console.warn(" Nenhum veículo retornado neste lote");
          break;
        }

        if (!total) total = data["@odata.count"] || 0;

        const filtrados = data.value.filter(
          (v: Veiculo) =>
            v.vehicleGroups.length === 1 && v.vehicleGroups[0].isAll === true
        );

        resultado.push(...filtrados);
        skip += lote;
        totalProcessados += data.value.length;

        console.log(`📊 Processados: ${totalProcessados}/${total} (+${filtrados.length} filtrados)`);

        if (onProgress) {
          onProgress(totalProcessados, total, `+${filtrados.length} filtrados`);
        }

        hasMore = totalProcessados < total;
      }

      console.log(" Busca de veículos concluída");
      return resultado;
    } catch (err: any) {
      console.error(" Erro ao consultar /Vehicles:", err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * Adiciona veículos ao grupo "00 - Todos os Veículos - Livre"
   * Recebe a lista diretamente do resultado de buscarVeiculosSemGrupo
   */
  async adicionarVeiculosAoGrupoTodos(veiculos: Veiculo[]): Promise<void> {
    if (!this.token) {
      throw new Error(" Você precisa chamar loginUnidas() antes.");
    }

    if (!veiculos || veiculos.length === 0) {
      console.warn(" Nenhum veículo para adicionar.");
      return;
    }

    const groupId = "b521affb-8c7f-40c9-b78d-e3dbfaa20750"; // grupo "Todos os Veículos - Livre"
    const vehicleIds = veiculos.map(v => v.id);

    try {
      console.log(` Adicionando ${vehicleIds.length} veículos ao grupo "${groupId}"...`);

      await this.api.post("/proxy", {
        path: `/VehicleGroups(${groupId})/_.addVehicles`,
        method: "POST",
        token: this.token,
        body: { vehicleIds },
      });

      console.log(` Veículos adicionados ao grupo com sucesso!`);
    } catch (err: any) {
      console.error(` Erro ao adicionar veículos ao grupo:`, err.response?.data || err.message);
      throw err;
    }
  }
}

export default new UnidasService();
