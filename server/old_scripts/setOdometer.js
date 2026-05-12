const axios = require('axios');
const readline = require('readline');

const API_URL = "https://live.mzoneweb.net/mzone62.api";
const TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlDNTg1RjFFODkzM0Q4RDJDMkJGRjdEQkIxQkRFMjBGRTFCNjVDNUEiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJuRmhmSG9rejJOTEN2X2Zic2IzaUQtRzJYRm8ifQ.eyJuYmYiOjE3NzgyNjgyODIsImV4cCI6MTc3ODI3MTg4MiwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQvcmVzb3VyY2VzIiwiZGktYXBpIiwibXo2LWFwaSJdLCJjbGllbnRfaWQiOiJtei1lcW1hcmFuaGFvIiwic3ViIjoiZjAwYWVjNjEtMzE2Zi00MTU1LWExZWUtOWQzYzAzM2JiYWYyIiwiYXV0aF90aW1lIjoxNzc4MjY4MjgyLCJpZHAiOiJsb2NhbCIsIm16X3VzZXJuYW1lIjoiVW5pZGFzYWRtIiwibXpfdXNlcmdyb3VwX2lkIjoiYTA4ZDMyOTctODQ5Yi00MzEzLTg0MDktNWUxODQwODZkMDIyIiwibXpfc2hhcmRfY29kZSI6IkJSQVpJTCIsInNjb3BlIjpbIm16X3VzZXJuYW1lIiwib3BlbmlkIiwiZGktYXBpLmFsbCIsIm16Ni1hcGkuYWxsIl0sImFtciI6WyJwd2QiXX0.iCX_bs2VnJuZpIddkIWcCpxBPsgq_fp4e2NwjHnxkmDvs2fBJNCjzPqKagXq9ebnAb5uGG8wsfuSzMt9S0ijwvGugvRQMXk-iAW1_xeDuLKDF2cinmpxSxZrL14KCQunEaNaGWzV-o_NRVdLb04_cbmF3VIlbsT-gtNB5r8Sqy8fsdUbaKGhxhFctkSnG8q_YfYl1_Ype5TnrrsvLgGpd7GyzXs5BQvgQJgmbLcJ5n7JDciv5sPDQQMx7r5PujrqUh5pQXct1W2fdDJyhGb55KQqUAE6hglv-tGEhV3WWJ1agsT61FuXZXqy_qgKMmq2vOwDTfKEhPXQvRbNQnqGMKBwEc-4ewvtQd6G-YwAZ_CMRcv4VjCzj2pYWpsMH3gj-eX0Gs50-fgPiW0wZDzMRQhvtFMNDAcH8oVR-MAFquYUiTtYhyVodYO7DLacddYGUEG5tF7ZMqBzbwXbS3xYsexAq31fqs5cEAE34R9w3Pel3A6bWLi21-f61A3ENGdLgvY9bN30KtvUvq36fMu3KtAR3eq2wxQeGpqoyZsLyuwzmSwbvjJfRQLYu_Lw4YV76ivZMvvgaUw94CRUnD7jo9tf_ZTAwOwUpGQE0jqNi7oIV3TbVamD6wyv0zICxmFKFuUJPb9sHRoc9n39ymej8Ufa-M7prbQ8PFoRN5N_FDw"
const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
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