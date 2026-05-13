const axios = require('axios');
const readline = require('readline');

const API_URL = "https://live.mzoneweb.net/mzone62.api";

// Configurações do Token
const LOGIN = "Unidasadm"; // Preencha o login
const PASSWORD = "Unidasadm@1qaz"; // Preencha a senha
const CLIENT_ID = 'mz-eqmaranhao';
const CLIENT_SECRET = 'G8PcqkHikp%BUejsv.C!^wzr';
const TOKEN_LIFETIME_MS = 50 * 60 * 1000; // 50 minutos

class TokenManager {
  constructor({ login, password }) {
    this.login = login;
    this.password = password;
    this.token = null;
    this.createdAt = null;
    this.refreshCount = 0;
  }

  isExpired() {
    if (!this.token || !this.createdAt) return true;
    return Date.now() - this.createdAt > TOKEN_LIFETIME_MS;
  }

  async getToken() {
    if (this.isExpired()) {
      console.log(`\n[TokenManager] ${this.token ? 'Renovando' : 'Gerando'} token...`);

      const params = new URLSearchParams();
      params.append('client_id', CLIENT_ID);
      params.append('client_secret', CLIENT_SECRET);
      params.append('username', this.login);
      params.append('Password', this.password);
      params.append('grant_type', 'password');
      params.append('response_type', 'code id token');

      try {
        const response = await axios.post('https://login.mzoneweb.net/connect/token', params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        });

        this.token = response.data.access_token;
        this.createdAt = Date.now();

        if (this.refreshCount > 0) {
          console.log(`[TokenManager] Token renovado (refresh #${this.refreshCount})\n`);
        } else {
          console.log(`[TokenManager] Token gerado com sucesso.\n`);
        }
        this.refreshCount++;
      } catch (error) {
         throw new Error(`Erro ao gerar token para ${this.login}: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
      }
    }

    return this.token;
  }
}

const tokenManager = new TokenManager({ login: LOGIN, password: PASSWORD });

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar o token automaticamente em cada requisição
api.interceptors.request.use(async (config) => {
  const token = await tokenManager.getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Sanitiza strings para OData
function sanitizeODataString(str) {
  return str.replace(/'/g, "''");
}

// Busca veículo por VIN ou unit_description
async function buscarVeiculo(identifier, type = 'vin') {
  try {
    const safeValue = sanitizeODataString(identifier);
    const filterField = type === 'vin' ? 'vin' : 'unit_Description';
    
    const res = await api.get(
      `/Vehicles?$filter=${filterField} eq '${safeValue}'&$select=id,description,vin,unit_Description`
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err) {
    console.error(` Erro ao buscar veículo (${identifier}):`, err.response?.data || err.message);
    return null;
  }
}

// Ajusta o odômetro do veículo
async function ajustarOdometro(vehicleId, odometerValue, vin) {
  try {
    const payload = {
      vehicle_Id: vehicleId,
      startUtcTimestamp: null,
      decimalOdometer: 0,
      decimalOdometerAdjustment: parseFloat(odometerValue),
      decimalOdometerUserProvidedValue: parseFloat(odometerValue),
      decimalOdometerAdjustmentEventUtcTimestamp: new Date().toISOString()
    };

    await api.post('/DeviceOdometerAdjustments', payload);

    console.log(` Odômetro ajustado para veículo ${vin}`);
    console.log(`   Vehicle ID: ${vehicleId}`);
    console.log(`   Valor: ${odometerValue} km\n`);
    return true;
  } catch (err) {
    console.error(` Erro ao ajustar odômetro (${vin}):`, err.response?.data || err.message);
    return false;
  }
}

// Processa a lista de veículos
async function processarLista(veiculos) {
  console.log(`\n Iniciando ajuste de odômetro para ${veiculos.length} veículos...\n`);
  
  let sucessos = 0;
  let falhas = 0;
  let naoEncontrados = 0;

  for (const item of veiculos) {
    const { chassi, odometro } = item;
    
    if (!chassi || !odometro) {
      console.log(` Dados inválidos: chassi=${chassi}, odometro=${odometro}\n`);
      falhas++;
      continue;
    }

    console.log(` Processando: ${chassi} | Odômetro: ${odometro}`);
    
    // Tenta buscar por VIN primeiro
    let veiculo = await buscarVeiculo(chassi, 'vin');
    
    // Se não encontrar, tenta por unit_description
    if (!veiculo) {
      console.log(`   ℹ  Não encontrado por VIN, tentando por unit_description...`);
      veiculo = await buscarVeiculo(chassi, 'unit_description');
    }
    
    if (!veiculo) {
      console.log(` Veículo não encontrado: ${chassi}\n`);
      naoEncontrados++;
      continue;
    }

    const resultado = await ajustarOdometro(veiculo.id, odometro, chassi);
    
    if (resultado) {
      sucessos++;
    } else {
      falhas++;
    }

    // Delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n RESUMO:");
  console.log(`    Sucessos: ${sucessos}`);
  console.log(`    Falhas: ${falhas}`);
  console.log(`     Não encontrados: ${naoEncontrados}`);
  console.log(`    Total processado: ${veiculos.length}\n`);
}

// Entrada via terminal (formato: CHASSI,ODOMETRO)
async function lerDoTerminal() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n  Cole os dados do Excel no formato: CHASSI,ODOMETRO");
  console.log("   Exemplo: 3VVSS65N3RM113673,15000");
  console.log("   Cole várias linhas e pressione ENTER em uma linha vazia quando terminar.\n");

  const lines = [];
  
  rl.on('line', (line) => {
    if (line.trim() === '') {
      rl.close();
    } else {
      lines.push(line.trim());
    }
  });

  return new Promise((resolve) => {
    rl.on('close', () => {
      const veiculos = lines
        .map(line => {
          // Detecta separador: TAB, ponto e vírgula, vírgula ou múltiplos espaços
          let separator = ',';
          if (line.includes('\t')) separator = '\t';
          else if (line.includes(';')) separator = ';';
          else if (line.includes(',')) separator = ',';
          else separator = /\s+/; // Fallback para qualquer espaço branco

          const parts = line.split(separator).map(s => s.trim()).filter(Boolean);
          
          if (parts.length >= 2) {
            return { 
              chassi: parts[0], 
              odometro: parts[1].replace(/[^\d.]/g, '') // Remove caracteres não numéricos do odômetro
            };
          }
          return null;
        })
        .filter(v => v !== null);
        
      resolve(veiculos);
    });
  });
}

// Parser para formato Excel copiado (separado por TAB)
function parseExcelData(input) {
  return input
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      // Suporta tanto vírgula quanto TAB (Excel)
      const separator = line.includes('\t') ? '\t' : ',';
      const [chassi, odometro] = line.split(separator).map(s => s.trim());
      return { chassi, odometro };
    });
}

// Execução principal
async function main() {
  try {
    // OPÇÃO 1: Lista direto no código
    // const veiculos = [
    //   { chassi: "3VVSS65N3RM113673", odometro: "15000" },
    //   { chassi: "ABC123", odometro: "20000" },
    // ];

    // OPÇÃO 2: Ler do terminal
    const veiculos = await lerDoTerminal();

    if (veiculos.length === 0) {
      console.log("⚠️  Nenhum veículo fornecido!");
      return;
    }

    await processarLista(veiculos);
  } catch (err) {
    console.error(" Erro fatal:", err);
  }
}

main();