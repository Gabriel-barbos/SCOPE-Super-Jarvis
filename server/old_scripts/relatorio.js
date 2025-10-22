const axios = require('axios');
const XLSX = require('xlsx');

const API_CONFIG = {
  baseUrl: 'https://live.mzoneweb.net/mzone62.api',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjlDNTg1RjFFODkzM0Q4RDJDMkJGRjdEQkIxQkRFMjBGRTFCNjVDNUEiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJuRmhmSG9rejJOTEN2X2Zic2IzaUQtRzJYRm8ifQ.eyJuYmYiOjE3NjExNDQwMjEsImV4cCI6MTc2MTE0NzYyMSwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQvcmVzb3VyY2VzIiwiZGktYXBpIiwibXo2LWFwaSJdLCJjbGllbnRfaWQiOiJtei1lcW1hcmFuaGFvIiwic3ViIjoiYmQ3OTM0MGQtNGNlNS00YWM4LTkwOGUtM2Q1NmJlM2UxZGM2IiwiYXV0aF90aW1lIjoxNzYxMTQ0MDIxLCJpZHAiOiJsb2NhbCIsIm16X3VzZXJuYW1lIjoiYnJhemlsLXN1cHBvcnRAc2NvcGV0ZWNobm9sb2d5LmNvbSIsIm16X3VzZXJncm91cF9pZCI6ImM1NTk3Y2NhLTRiM2MtNDk0MS05MGE1LTI1NWY2OTA4ODYyNyIsIm16X3NoYXJkX2NvZGUiOiJCUkFaSUwiLCJzY29wZSI6WyJtel91c2VybmFtZSIsIm9wZW5pZCIsImRpLWFwaS5hbGwiLCJtejYtYXBpLmFsbCJdLCJhbXIiOlsicHdkIl19.P-ZLim2G4vP3Azp28EDnADv4NN_E924XcBS3_PELxeuyiQQ0zTFb5oAtle7HHEW-rJZ_s--nEqmNwKmCrcetNHu9-mMJnkw5jHRQOhNpi3YRUxqspbyMxRJPnWkeb7mWhk2LkHUuldM5j-Bdy5VvuCn34QXitWTVPu6BV9KtOXHm3lQARTp7xBo-43_eLJTGH0KqvPk4C0RbuEsw41916bHwDuZgUIEoGwNVq9CHbp1LmX5UZE8Y4ou0qwslKm6iR3eQkLA_GQKhttc_6n0gQFuaCmpF7cY_0T0AEvD80UyDRTI-dZjIfzrO7v8hncxXPv93M9qrbWGZwY2fro8Dz_pOmi_KOsbjQyXYkBHPjy-WyjEYUgU7mEr7Kl6piaFSv9aa-7lr0BxUM0zZra7Ibhhx4oQG67u57N2I-JI41aZSjtevztA-5bPGmRdkB7mGVr-EVbLJ83vnDzcqew1BOPrVwJVBDqfxgia7-A0ZtqS0s2NnWnWDhyAhhha3LtyPoyrstzP8QsfM2qbj4MRTelHiTJTFG_4vY6n-_9SBMtq89q9wfMcwm9wQ2a-JwU4RA8srpHeAye_grhtTkaGPPI5XoHHcQ3oWnwi5QbrERgbySKg2F-2ty2pZ0GjMGSNIBQwwofx6Td-a712qff9W5KsV-r_7OBxqO7dQzjSjIT8', 
    'Content-Type': 'application/json'
  }
};

// Função para buscar todos os veículos com paginação
async function buscarTodosVeiculos() {
  console.log('Iniciando busca de veículos...');
  let todosVeiculos = [];
  let skip = 0;
  const top = 10000; 
  let temMaisDados = true;

  while (temMaisDados) {
    try {
      const url = `${API_CONFIG.baseUrl}/Vehicles?$top=${top}&$skip=${skip}`;
      console.log(`Buscando veículos: skip=${skip}, top=${top}`);
      
      const response = await axios.get(url, { headers: API_CONFIG.headers });
      
      const veiculos = response.data.value || [];
      todosVeiculos = todosVeiculos.concat(veiculos);
      
      console.log(`Recebidos: ${veiculos.length} veículos. Total acumulado: ${todosVeiculos.length}`);
      
      // Se recebeu menos, não há mais dados
      if (veiculos.length < top) {
        temMaisDados = false;
      } else {
        skip += top;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Erro ao buscar veículos (skip=${skip}):`, error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Dados:', error.response.data);
      }
      throw error;
    }
  }
  
  console.log(`\nTotal de veículos obtidos: ${todosVeiculos.length}`);
  return todosVeiculos;
}

//formatar dados para o Excel
function formatarDadosParaExcel(veiculos) {
  console.log('\nFormatando dados para o relatório...');
  
  const dadosFormatados = veiculos.map(veiculo => ({
    'VIN (Chassi)': veiculo.vin || '',
    'Descrição': veiculo.description || '',
    'Unidade': veiculo.unit_Description || '',
    'Placa': veiculo.registration || ''
  }));
  
  console.log(`Total de registros formatados: ${dadosFormatados.length}`);
  return dadosFormatados;
}

// Função para gerar Excel
function gerarExcel(dados, caminhoSaida) {
  console.log(`\nGerando arquivo Excel: ${caminhoSaida}`);
  
  const worksheet = XLSX.utils.json_to_sheet(dados);
  
  const maxWidth = 50;
  const colWidths = [
    { wch: 20 }, 
    { wch: maxWidth }, 
    { wch: 20 }, 
    { wch: 15 }  
  ];
  worksheet['!cols'] = colWidths;
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos');
  
  XLSX.writeFile(workbook, caminhoSaida);
  console.log('Arquivo Excel gerado com sucesso!');
}

// Função principal
async function main() {
  try {
    const dataHora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const nomeArquivo = `relatorio_veiculos_${dataHora}.xlsx`;
    
    console.log('=== INICIANDO EXPORTAÇÃO DE VEÍCULOS ===\n');
    
    const veiculos = await buscarTodosVeiculos();
    
    const dadosFormatados = formatarDadosParaExcel(veiculos);
    
    gerarExcel(dadosFormatados, nomeArquivo);
    
    console.log('\n=== RELATÓRIO GERADO COM SUCESSO ===');
    console.log(`Arquivo: ${nomeArquivo}`);
    console.log(`Total de veículos: ${dadosFormatados.length}`);
    
  } catch (error) {
    console.error('\n=== ERRO NO PROCESSO ===');
    console.error(error);
    process.exit(1);
  }
}

main();