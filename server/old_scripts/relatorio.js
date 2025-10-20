const axios = require('axios');
const XLSX = require('xlsx');

const API_CONFIG = {
  baseUrl: 'https://live.mzoneweb.net/mzone62.api',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjlDNTg1RjFFODkzM0Q4RDJDMkJGRjdEQkIxQkRFMjBGRTFCNjVDNUEiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJuRmhmSG9rejJOTEN2X2Zic2IzaUQtRzJYRm8ifQ.eyJuYmYiOjE3NjA5ODcwNDUsImV4cCI6MTc2MDk5MDY0NSwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQvcmVzb3VyY2VzIiwiZGktYXBpIiwibXo2LWFwaSJdLCJjbGllbnRfaWQiOiJtei1lcW1hcmFuaGFvIiwic3ViIjoiMTY3YThhODEtNjYwMy00OGRmLTg3MDEtZTk5Njg0MTc5ZmYyIiwiYXV0aF90aW1lIjoxNzYwOTg3MDQ1LCJpZHAiOiJsb2NhbCIsIm16X3VzZXJuYW1lIjoibG1mYWRtc2NvcGUiLCJtel91c2VyZ3JvdXBfaWQiOiJkZGZiMzY0YS01NTU0LTQyYWYtYjgyZC1kYTlmZGE0ZWM1ZjciLCJtel9zaGFyZF9jb2RlIjoiQlJBWklMIiwic2NvcGUiOlsibXpfdXNlcm5hbWUiLCJvcGVuaWQiLCJkaS1hcGkuYWxsIiwibXo2LWFwaS5hbGwiXSwiYW1yIjpbInB3ZCJdfQ.HRtqee2BN04VK1ZK2Tn3a09w3OFc0JLVIkZf8Bf8RVh0_gDCcZLB5ClbGQYAXEv0TQvIiPGS5P0CXjE0BY_W0t4tzprGgPLCCllOu5RU5PsYT6Mp-3ws_NPMTmWx9xF7GjX123HnQN7dNLgjRq_T-O13BcfA4FSjYAN5ITAvSvBP3Rm-8DD8AfKSXqtVlPCyw5kkU1KTwLvW33fN-vhNFXOD2l0PQkGHmiNiFFi2Z2zaeksbnXG1GnibiM9r8BX5Fq8Ax_RonnwSVKurn11DGWH1UPZneoXYSkuot1PKPQeYkVxrIYfTWNF4ApCtsZTz6WEak4vnIjH9ZjY-mjslFWrxbVTkl6krjXdyYUJItCMCi1GtCH84qFWGYBbf6-SJXsrHNm9w3pQjvcb0nxiCPWJ8Td-447y2LAx0r1EmC7L1ypfu8li2-PlS4rOPrPcicHb-MkblXlrADikW4k6fQR5zd_Yad30fatCCAanrmT-vpZBTIvh_vwwr-gIKR5g_qwBFQUN0S7ZR64LD3uhy8dFZEPVXKniq-eWg1SWGEPVWssYcsOKFwruFljHwA0LE8P95rcqJH0E816cZtd2IARIyK1afQ2TbfitaSnpbvO08ZtbpnK83WSLt_pTcz6zaiZdw5sGnPJSEtClajrwDfmIR16747VEi8yebYjH5uHE', 
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