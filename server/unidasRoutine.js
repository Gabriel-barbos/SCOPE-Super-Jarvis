import fetch from "node-fetch";

class UnidasRoutineBackend {
  constructor() {
    this.token = null;
    this.baseURL = "https://live.mzoneweb.net/mzone62.api";
    this.timeout = 20000;
  }

  /**
   * Gera o token de acesso da Unidas
   */
  async loginUnidas() {
    console.log("➡️ [UnidasRoutine] Solicitando token da Unidas...");

    try {
      const response = await fetch(`${this.baseURL}/Auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "Unidasadm",
          password: "Unidasadm@1qaz",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Erro ao obter token: ${data.error || response.statusText}`);
      }

      this.token = data?.access_token;

      if (!this.token) {
        throw new Error("Token não retornado da API");
      }

      console.log("✅ [UnidasRoutine] Token recebido com sucesso:", this.token.slice(0, 10) + "...");
    } catch (err) {
      console.error("❌ [UnidasRoutine] Erro ao gerar token da Unidas:", err.message);
      throw err;
    }
  }

  /**
   * Busca veículos que possuem apenas 1 grupo "isAll=true"
   */
  async buscarVeiculosSemGrupo(lote = 500, onProgress = null) {
    if (!this.token) {
      throw new Error("Você precisa chamar loginUnidas() antes.");
    }

    console.log("➡️ [UnidasRoutine] Iniciando busca de veículos...");

    let skip = 0;
    let totalProcessados = 0;
    let total = 0;
    const resultado = [];
    let hasMore = true;

    try {
      while (hasMore) {
        const url = `${this.baseURL}/Vehicles?$expand=vehicleGroups&$top=${lote}&$skip=${skip}&$count=true`;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        if (!data?.value || data.value.length === 0) {
          console.warn("⚠️ [UnidasRoutine] Nenhum veículo retornado neste lote");
          break;
        }

        if (!total) total = data["@odata.count"] || 0;

        const filtrados = data.value.filter(
          (v) => v.vehicleGroups.length === 1 && v.vehicleGroups[0].isAll === true
        );

        resultado.push(...filtrados);
        skip += lote;
        totalProcessados += data.value.length;

        console.log(`📊 [UnidasRoutine] Processados: ${totalProcessados}/${total} (+${filtrados.length} filtrados)`);

        if (onProgress) {
          onProgress(totalProcessados, total, `+${filtrados.length} filtrados`);
        }

        hasMore = totalProcessados < total;

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`✅ [UnidasRoutine] Busca concluída: ${resultado.length} veículos encontrados`);
      return resultado;
    } catch (err) {
      console.error("❌ [UnidasRoutine] Erro ao buscar veículos:", err.message);
      throw err;
    }
  }

  /**
   * Adiciona veículos ao grupo "00 - Todos os Veículos - Livre"
   */
  async adicionarVeiculosAoGrupoTodos(veiculos) {
    if (!this.token) {
      throw new Error("Você precisa chamar loginUnidas() antes.");
    }

    if (!veiculos || veiculos.length === 0) {
      console.warn("⚠️ [UnidasRoutine] Nenhum veículo para adicionar.");
      return;
    }

    const groupId = "b521affb-8c7f-40c9-b78d-e3dbfaa20750"; // grupo "Todos os Veículos - Livre"
    const vehicleIds = veiculos.map(v => v.id);

    try {
      console.log(`➡️ [UnidasRoutine] Adicionando ${vehicleIds.length} veículos ao grupo...`);

      const response = await fetch(`${this.baseURL}/VehicleGroups(${groupId})/_.addVehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.token}`,
        },
        body: JSON.stringify({ vehicleIds }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro ao adicionar veículos: ${response.status} - ${errorData}`);
      }

      console.log(`✅ [UnidasRoutine] Veículos adicionados ao grupo com sucesso!`);
    } catch (err) {
      console.error(`❌ [UnidasRoutine] Erro ao adicionar veículos ao grupo:`, err.message);
      throw err;
    }
  }
}

/**
 * Executa a rotina completa da Unidas
 */
export async function runUnidasRoutine() {
  const inicio = new Date();
  console.log(`🚀 [UnidasRoutine] Iniciando rotina em ${inicio.toLocaleString('pt-BR')}`);
  
  const service = new UnidasRoutineBackend();
  
  try {
    // 1️⃣ Login
    await service.loginUnidas();

    // 2️⃣ Buscar veículos sem grupo
    const veiculos = await service.buscarVeiculosSemGrupo(500, (processados, total, desc) => {
      console.log(`📊 [UnidasRoutine] Progresso: ${processados}/${total} ${desc || ""}`);
    });

    // 3️⃣ Adicionar veículos ao grupo
    if (veiculos.length > 0) {
      await service.adicionarVeiculosAoGrupoTodos(veiculos);
    } else {
      console.log("⚠️ [UnidasRoutine] Nenhum veículo necessita ser adicionado ao grupo.");
    }

    const fim = new Date();
    const duracao = Math.round((fim - inicio) / 1000);
    
    console.log(`🎉 [UnidasRoutine] Rotina concluída em ${duracao}s - ${veiculos.length} veículos processados`);
    
    return { 
      sucesso: true, 
      total: veiculos.length,
      duracao: duracao,
      inicio: inicio.toISOString(),
      fim: fim.toISOString()
    };

  } catch (err) {
    const fim = new Date();
    const duracao = Math.round((fim - inicio) / 1000);
    
    console.error(`❌ [UnidasRoutine] Erro após ${duracao}s:`, err.message);
    
    return { 
      sucesso: false, 
      erro: err.message,
      duracao: duracao,
      inicio: inicio.toISOString(),
      fim: fim.toISOString()
    };
  }
}