const axios = require('axios');
const readline = require('readline');

const API_URL = "https://live.mzoneweb.net/mzone62.api";
const TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlDNTg1RjFFODkzM0Q4RDJDMkJGRjdEQkIxQkRFMjBGRTFCNjVDNUEiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJuRmhmSG9rejJOTEN2X2Zic2IzaUQtRzJYRm8ifQ.eyJuYmYiOjE3NzgxNzI4MDgsImV4cCI6MTc3ODE3NjQwOCwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQvcmVzb3VyY2VzIiwiZGktYXBpIiwibXo2LWFwaSJdLCJjbGllbnRfaWQiOiJtei1lcW1hcmFuaGFvIiwic3ViIjoiYTMxNTljZmEtZjFmZi00ZDM1LWIzNjQtZDQ0NWYyYzU5Yjc4IiwiYXV0aF90aW1lIjoxNzc4MTcyODA4LCJpZHAiOiJsb2NhbCIsIm16X3VzZXJuYW1lIjoiczRmdGVtcGFkbSIsIm16X3VzZXJncm91cF9pZCI6ImNiYTM4Yjg5LTc3MjctNDM1NC04NGM5LTA1MDY2MWJjODIzOSIsIm16X3NoYXJkX2NvZGUiOiJFTUVBIiwic2NvcGUiOlsibXpfdXNlcm5hbWUiLCJvcGVuaWQiLCJkaS1hcGkuYWxsIiwibXo2LWFwaS5hbGwiXSwiYW1yIjpbInB3ZCJdfQ.XVzSDPtmLTyxJumnALH8ZHvxIU25CHsjFd-3oE2DXejVw7utF-HmmFI_a5IOAn2H_JuOyfaemJlOL2fp4VSXNrUWoogWMp5j2NNYKk0jjfVtpDylDAn0H7vVdtKKQnKBeok0cv0rSvffxAEvyTilLG591fwPNjHB7GL4-lmICE0cn2IDlRFhUg0UDYtknwxVH5zpjX_EljBQztWIFY1GHLdCmPF_5T0CMnQkG0WfHEtHtrLgLGP5-CvD6k05VkCsb2sK1xjRYPjQBWfAHYj5DJdvM4779F59bMiOTaYhWDql4RSSRmsXCHTvkrj5Po0OlLn9hHgD663TkfTaXeaVLfCTWqhGi15InuwJ3vX0uueutk19YhgRlNYP2RWSfwgaEGD1NXnj4pwSqoUy7FgupegRcE2n2nrObrJN4MGwUkz2vtQhHxg0PTAjRkLk1mGQBUUT-x5R0tkzu8lY6B60-mP6MzkbhWu4K2w2XCF1SLQpGg0W_m9D6-QJr41S-iXEH5SQXeucgIDtrCUuWyYo_Y-omQtLRfLZN0donawAHkrNNREa8SFvhCvYb4saRwd8FS4T9J1IXPyqUPVTTmxTY_b1ZYqbDWwi5Pazl798BYPKz4p9zJPvcxocs2DcmFBfW0uqqvwsxm4OOpYm1sEukkNiWcRD-WPMpS30mKRY7BA"
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

// Busca veículo por unit_description
async function buscarVeiculo(unitDescription) {
  try {
    const safeValue = sanitizeODataString(unitDescription);
    
    const res = await api.get(
      `/Vehicles?$filter=unit_Description eq '${safeValue}'&$select=id,description,vin,unit_Description`
    );

    const vehicles = res.data.value || [];
    return vehicles.length > 0 ? vehicles[0] : null;
  } catch (err) {
    console.error(`❌ Erro ao buscar veículo (${unitDescription}):`, err.response?.data || err.message);
    return null;
  }
}

// Atualiza a tag do veículo
async function atualizarTag(vehicleId, currentDescription) {
  try {
    let novaDescricao = currentDescription;

    // Remove "DESATIVAÇÃO V " se existir
    if (currentDescription.startsWith("DESATIVAÇÃO V ")) {
      novaDescricao = currentDescription.replace(/^DESATIVAÇÃO V /, "");
    }

    // Adiciona "CANCELADO V " se ainda não tiver
    if (!novaDescricao.startsWith("CANCELADO V ")) {
      novaDescricao = `CANCELADO V ${novaDescricao}`;
    }

    // Se não houve mudança, pula
    if (novaDescricao === currentDescription) {
      console.log(`⏭️  Veículo ${vehicleId} já está com a tag correta`);
      return true;
    }

    await api.patch(`/Vehicles(${vehicleId})`, {
      description: novaDescricao,
    });

    console.log(`✅ Veículo ${vehicleId} atualizado`);
    console.log(`   DE: ${currentDescription}`);
    console.log(`   PARA: ${novaDescricao}\n`);
    return true;
  } catch (err) {
    console.error(`❌ Erro ao atualizar veículo ${vehicleId}:`, err.response?.data || err.message);
    return false;
  }
}

// Processa a lista de unit_descriptions
async function processarLista(unitDescriptions) {
  console.log(`\n🚗 Iniciando processamento de ${unitDescriptions.length} veículos...\n`);
  
  let sucessos = 0;
  let falhas = 0;
  let naoEncontrados = 0;

  for (const unitDesc of unitDescriptions) {
    const unitDescTrimmed = unitDesc.trim();
    
    if (!unitDescTrimmed) continue;

    console.log(`🔍 Buscando: ${unitDescTrimmed}`);
    
    const veiculo = await buscarVeiculo(unitDescTrimmed);
    
    if (!veiculo) {
      console.log(`⚠️  Veículo não encontrado: ${unitDescTrimmed}\n`);
      naoEncontrados++;
      continue;
    }

    const resultado = await atualizarTag(veiculo.id, veiculo.description);
    
    if (resultado) {
      sucessos++;
    } else {
      falhas++;
    }

    // Delay para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\n📊 RESUMO:");
  console.log(`   ✅ Sucessos: ${sucessos}`);
  console.log(`   ❌ Falhas: ${falhas}`);
  console.log(`   ⚠️  Não encontrados: ${naoEncontrados}`);
  console.log(`   📝 Total processado: ${unitDescriptions.length}\n`);
}

// Entrada via terminal
async function lerDoTerminal() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("\n📋 Cole a lista de unit_descriptions (um por linha).");
  console.log("   Quando terminar, pressione ENTER em uma linha vazia.\n");

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
      resolve(lines);
    });
  });
}

// Execução principal
async function main() {
  try {
    // OPÇÃO 1: Lista direto no código (descomente e adicione os valores)
    // const unitDescriptions = [
    //   "ABC123",
    //   "XYZ789",
    // ];

    // OPÇÃO 2: Ler do terminal
    const unitDescriptions = await lerDoTerminal();

    if (unitDescriptions.length === 0) {
      console.log("⚠️  Nenhum unit_description fornecido!");
      return;
    }

    await processarLista(unitDescriptions);
  } catch (err) {
    console.error("❌ Erro fatal:", err);
  }
}

main();