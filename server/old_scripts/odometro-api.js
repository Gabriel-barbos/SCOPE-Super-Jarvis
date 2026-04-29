
const axios    = require('axios');
const readline = require('readline');

// Configuração da API

const API_BASE_URL = "https://live.mzoneweb.net/mzone62.api";
const TOKEN        = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlDNTg1RjFFODkzM0Q4RDJDMkJGRjdEQkIxQkRFMjBGRTFCNjVDNUEiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJuRmhmSG9rejJOTEN2X2Zic2IzaUQtRzJYRm8ifQ.eyJuYmYiOjE3NzY5NjI4NjMsImV4cCI6MTc3Njk2NjQ2MywiaXNzIjoiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQvcmVzb3VyY2VzIiwiZGktYXBpIiwibXo2LWFwaSJdLCJjbGllbnRfaWQiOiJtei1lcW1hcmFuaGFvIiwic3ViIjoiYmQ3OTM0MGQtNGNlNS00YWM4LTkwOGUtM2Q1NmJlM2UxZGM2IiwiYXV0aF90aW1lIjoxNzc2OTYyODYzLCJpZHAiOiJsb2NhbCIsIm16X3VzZXJuYW1lIjoiYnJhemlsLXN1cHBvcnRAc2NvcGV0ZWNobm9sb2d5LmNvbSIsIm16X3VzZXJncm91cF9pZCI6ImM1NTk3Y2NhLTRiM2MtNDk0MS05MGE1LTI1NWY2OTA4ODYyNyIsIm16X3NoYXJkX2NvZGUiOiJCUkFaSUwiLCJzY29wZSI6WyJtel91c2VybmFtZSIsIm9wZW5pZCIsImRpLWFwaS5hbGwiLCJtejYtYXBpLmFsbCJdLCJhbXIiOlsicHdkIl19.WXQPBoLxcf4IVVO6xvSpQW7X2mo7lyi87hY2-w1ie8I7GZR-YLpEASVcDT5NrNPmqvQ5EaYJjzK_4Dg-taKaGmKxOqkgQVTgGN4oxv5Pebcoml4gRTYyw22rvBrJtFfoMT7CY3vmXlANZ54Da6E5LV8-FiEvQrb6lXp3_bSvRHbXeFSJnayI_bTJIBLjpdBCFjxH3lSyQsH0II6KolYRaQ6W46YveplKVvHfyPXrfaz9PnlgHH9435rPpV9MWJHibU3KWUTEv6EtfaZ5YWskStcjXVTs3rygTbwO2lFl34AFhHXfBQZ3wuR5VZOJi7nxDEw4XinTgBj-jJdBvp-TW8E89LWiBDeuO2XusYWyJjwFs_UI4gbRWvS8GTFaJQAD_BvnfewCm5af9SJEMOWYlU9bUJtIpfY-ZiroD0c_3OClo7zFlAfuygekgnYX4YxyoMBH6W31FuVNeJI-iRJCcEEGKGOhyZnN2b6HjipoVNAcP1PSiVBsRNgUuga8kp8sTc09AxbqZzveEBCFdjl_pZ4b52OIfRUeEULrScIi7TShpHhhfRpGxBSUEkvIfSOXpJeBUklUQ8F0Yf9WAA-7TUypwyUZCH6RnmPITavIPPzHzQ3wMTut1lCL1ms43eNwOSvL8DbTt5AINfHm8SEBlsD2sLE3OQyiBo7yTo3xNz8"

//instância Axios pré-configurada para não repetir
// o header de autenticação em cada chamada.
const api = axios.create({
  baseURL : API_BASE_URL,
  headers : {
    "Authorization" : `Bearer ${TOKEN}`,
    "Content-Type"  : "application/json",
  },
});


//padronizar para Odata
//
// A API usa OData para filtros. Aspas simples dentro de strings
// precisam ser escapadas como '' para não quebrar
// a sintaxe do filtro.

function sanitizeOData(str) {
  return str.replace(/'/g, "''");
}


//Buscar veículo 


// Query string (OData):
//   $filter  → filtra pelo campo escolhido com o valor informado
//   $select  → retorna apenas os campos necessários
//
// Campos de busca disponíveis:
//   vin: chassi do veículo
//   registration: placa do veículo

async function buscarVeiculo(identificador, campo = 'vin') {
  const safeValue = sanitizeOData(identificador);

  const response = await api.get('/Vehicles', {
    params: {
      '$filter' : `${campo} eq '${safeValue}'`,
      '$select' : 'id,description,vin,registration'
    }
  });

  const veiculos = response.data.value || [];
  return veiculos.length > 0 ? veiculos[0] : null;
}

//tenta por VIN primeiro; se não achar, tenta por placa.
async function localizarVeiculo(chassi) {
  let veiculo = await buscarVeiculo(chassi, 'vin');
  if (!veiculo) {
    console.log(`Não encontrado por chassi. Tentando pela placa (registration)...`);
    veiculo = await buscarVeiculo(chassi, 'registration');
  }
  return veiculo;
}


//Ajustar odômetro 
// Endpoint : POST /DeviceOdometerAdjustments
//Registrar um novo valor de odômetro para o veículo.
//
// Body (JSON) — campos obrigatórios:
//
//   vehicle_Id
//     Tipo    : int
//     O ID interno do veículo, obtido via GET /Vehicles.
//
//   decimalOdometerAdjustment
//     Tipo    : float
//     O valor do ajuste em km. É o delta que será somado ao odômetro atual.
//
//   decimalOdometerUserProvidedValue
//     Tipo    : float
//     O valor informado pelo usuário/operador — geralmente igual ao ajuste.
//     Fica gravado para fins de auditoria.
//
//   decimalOdometer
//     Tipo    : float
//     Odômetro atual lido no dispositivo. Passar 0 deixa a API
//     calcular o delta automaticamente.
//
//   startUtcTimestamp
//     Tipo    : string ISO 8601 | null
//     Quando o ajuste deve entrar em vigor. null = imediato.
//
//   decimalOdometerAdjustmentEventUtcTimestamp
//     Tipo    : string ISO 8601
//     Data/hora do evento de ajuste. Sempre em UTC.
//     Formato: "2025-01-15T14:30:00.000Z"
//
async function ajustarOdometro(vehicleId, odometroKm, chassi) {
  const payload = {
    vehicle_Id                                  : vehicleId,
    startUtcTimestamp                           : null,
    decimalOdometer                             : 0,
    decimalOdometerAdjustment                   : parseFloat(odometroKm),
    decimalOdometerUserProvidedValue            : parseFloat(odometroKm),
    decimalOdometerAdjustmentEventUtcTimestamp  : new Date().toISOString()
  };

  await api.post('/DeviceOdometerAdjustments', payload);

  console.log(`    Odômetro ajustado — ${chassi} | ${odometroKm} km`);
  return true;
}


// Processamento em lote
//
// Para cada veículo da lista:

//   3. Aguarda 500ms para evitar rate limiting
//
async function processarLote(veiculos) {
  const totais = { sucesso: 0, falha: 0, naoEncontrado: 0 };

  console.log(`\n Iniciando lote: ${veiculos.length} veículo(s)\n`);

  for (const { chassi, odometro } of veiculos) {
    if (!chassi || !odometro) {
      console.log(`  Linha inválida — chassi: ${chassi}, odometro: ${odometro}`);
      totais.falha++;
      continue;
    }

    console.log(`\n Processando: ${chassi} → ${odometro} km`);

    try {
      const veiculo = await localizarVeiculo(chassi);

      if (!veiculo) {
        console.log(`    Veículo não encontrado: ${chassi}`);
        totais.naoEncontrado++;
        continue;
      }

      await ajustarOdometro(veiculo.id, odometro, chassi);
      totais.sucesso++;

    } catch (err) {
      // err.response?.data traz o corpo do erro retornado pela API
      console.error(`    Erro: ${err.response?.data?.message || err.message}`);
      totais.falha++;
    }

    // Delay entre chamadas para respeitar o rate limit da API
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n─────────────────────────────");
  console.log("      RESUMO");
  console.log(`    Sucesso         : ${totais.sucesso}`);
  console.log(`    Falhas          : ${totais.falha}`);
  console.log(`    Não encontrados : ${totais.naoEncontrado}`);
  console.log(`    Total           : ${veiculos.length}\n`);
}


// Entrada de dados via terminal
//
async function lerDoTerminal() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log("\nCole os dados no formato: CHASSI,ODOMETRO");
  console.log("   Exemplo: 3VVSS65N3RM113673,15000");
  console.log("   Pressione ENTER em uma linha vazia para confirmar.\n");

  const linhas = [];

  rl.on('line', (linha) => {
    if (linha.trim() === '') {
      rl.close();
    } else {
      linhas.push(linha.trim());
    }
  });

  return new Promise((resolve) => {
    rl.on('close', () => {
      const veiculos = linhas
        .filter(l => l.includes(',') || l.includes('\t'))
        .map(l => {
          const sep = l.includes('\t') ? '\t' : ',';
          const [chassi, odometro] = l.split(sep).map(s => s.trim());
          return { chassi, odometro };
        });
      resolve(veiculos);
    });
  });
}


//  Entry point 
async function main() {

  const veiculos = await lerDoTerminal();

  if (veiculos.length === 0) {
    console.log("  Nenhum veículo fornecido. Encerrando.");
    return;
  }

  await processarLote(veiculos);
}

main().catch(err => console.error(" Erro fatal:", err));