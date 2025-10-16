import axios from "axios";
import fs from "fs";
import pkg from "xlsx";
const { readFile, utils } = pkg;

const API_URL = "https://live.mzoneweb.net/mzone62.api";
const TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlDNTg1RjFFODkzM0Q4RDJDMkJGRjdEQkIxQkRFMjBGRTFCNjVDNUEiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJuRmhmSG9rejJOTEN2X2Zic2IzaUQtRzJYRm8ifQ.eyJuYmYiOjE3NTgwNzQzMzMsImV4cCI6MTc1ODA3NzkzMywiaXNzIjoiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQvcmVzb3VyY2VzIiwiZGktYXBpIiwibXo2LWFwaSJdLCJjbGllbnRfaWQiOiJtei1lcW1hcmFuaGFvIiwic3ViIjoiNTJjMDk5NGEtZmNiNi00MTBlLWIyZWYtMjNlYjMyZTQ0OTY2IiwiYXV0aF90aW1lIjoxNzU4MDc0MzMzLCJpZHAiOiJsb2NhbCIsIm16X3VzZXJuYW1lIjoiZXFwYXJhIiwibXpfdXNlcmdyb3VwX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwibXpfc2hhcmRfY29kZSI6IkJSQVpJTCIsInNjb3BlIjpbIm16X3VzZXJuYW1lIiwib3BlbmlkIiwiZGktYXBpLmFsbCIsIm16Ni1hcGkuYWxsIl0sImFtciI6WyJwd2QiXX0.TO_RmyJOcDBzdswLOiWxSP6NBSMF-EhCF5W_s08CFJ_D43AYjuRJi6gJ4BXTbs0AUOjv2JtzgJlkkQNqkYRKmUB4Yh0gkRIOSQtA0PWm-2rCsDXs0uMq0EXxwcHYKYkRG8urQ4yZ7hAsZ6vz18Ny9wtj_Bt4baCJYzs5j-YIlusiO0zPf4ltAID6oGBdib48GEJHYoDOakuH7DMuk_o3DyBBKJ035qcvhRFEjdm3uIRG-bTxjIWpcTiorpz8rnVjd-M3OC-ytUb75_Vfv0n1YyO9N8ELwFRo6FZ6bPeWmfHBF2Mel-F7BriVGt3UGNxNU5pGTKYz6SejiZeWPkgLUWhMd2Q-zdJ7qvjCSvg1wvwlspqxDAagx1gpFNDJXnjmxBnTJi_OCZ-I4ivo83f7lKha4SD-otoTeTeHn8_f3YCuNSjFSE_UgDRoK6CRTZBkB2BB9F-ggwQbif6WCKp3Krj7vKtncyxEVevnAgimS3tCfHC40lVwr4A3qDqN8SWgG0MRufo_SrRpiVzzg93RlMh_uZChFEhbZ8ESIKX37sIxiW6_tGi8Ra-DinT5LAMIsdycn_dMZj0ZMPyiJMhNTp741TlcGwvw4wDQM4ZVUz86FTliN7r3yebTdcujwMJ6VeJl7xy9_Mq11H6ieq834Gnm-_iM0dSH9mgNxxHuZoM";

const gruposSeguranca = JSON.parse(fs.readFileSync("gruposSeguranca.json", "utf-8"));
const workbook = readFile("CARROS.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// ✅ Normaliza as chaves para minúsculo
const carros = utils.sheet_to_json(sheet).map((row) => {
  const normalizado = {};
  for (const chave in row) {
    normalizado[chave.toLowerCase()] = row[chave];
  }
  return normalizado;
});

async function buscarVeiculoPorVIN(vin) {
  try {
    console.log(`🔎 Buscando veículo VIN: ${vin}`);
    const url = `${API_URL}/Vehicles?$filter=vin eq '${vin}'&$select=id,vin`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } });

    if (response.data.value?.length > 0) {
      console.log(`✅ Veículo encontrado: ${response.data.value[0].id}`);
      return response.data.value[0].id;
    } else {
      console.warn(`⚠️ Veículo não encontrado para VIN: ${vin}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar veículo VIN: ${vin}`);
    console.error(error.response?.data || error.message);
    return null;
  }
}

async function buscarGrupoPorDescricao(description) {
  try {
    console.log(`🔎 Buscando grupo "${description}"`);
    const url = `${API_URL}/VehicleGroups?$filter=description eq '${description}'&$select=id,description`;
    const response = await axios.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } });

    if (response.data.value?.length > 0) {
      console.log(`✅ Grupo encontrado: ${response.data.value[0].id}`);
      return response.data.value[0].id;
    }
    console.log(`⚠️ Grupo não encontrado, será criado: ${description}`);
    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar grupo: ${description}`);
    console.error(error.response?.data || error.message);
    return null;
  }
}

async function criarGrupo(description, securityGroupId) {
  try {
    console.log(`🆕 Criando grupo: ${description}`);
    const response = await axios.post(
      `${API_URL}/VehicleGroups`,
      {
        description,
        securityGroupIds: [securityGroupId],
      },
      { headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" } }
    );
    console.log(`✅ Grupo criado com ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error(`❌ Erro ao criar grupo: ${description}`);
    console.error(error.response?.data || error.message);
    return null;
  }
}

async function adicionarVeiculosAoGrupo(groupId, vehicleIds) {
  try {
    console.log(`📌 Adicionando ${vehicleIds.length} veículos ao grupo ${groupId}`);
    const url = `${API_URL}/VehicleGroups(${groupId})/_.addVehicles`;
    await axios.post(url, { vehicleIds }, { headers: { Authorization: `Bearer ${TOKEN}` } });
    console.log(`✅ Veículos adicionados com sucesso ao grupo ${groupId}`);
  } catch (error) {
    console.error(`❌ Erro ao adicionar veículos ao grupo ${groupId}`);
    console.error(error.response?.data || error.message);
  }
}

async function processar() {
  console.log("🚀 Iniciando processamento da planilha...");
  const gruposMap = {};

  for (const carro of carros) {
    const vin = carro.vin;
    const grupoNome = carro.grupo;

    console.log(`\n===========================`);
    console.log(`🚗 VIN: ${vin} | Grupo: ${grupoNome}`);
    console.log(`===========================`);

    const vehicleId = await buscarVeiculoPorVIN(vin);
    if (!vehicleId) continue;

    if (!gruposMap[grupoNome]) gruposMap[grupoNome] = [];
    gruposMap[grupoNome].push(vehicleId);
  }

  console.log("\n📊 Resumo de grupos encontrados:");
  console.log(gruposMap);

  for (const grupoNome of Object.keys(gruposMap)) {
    const securityGroup = gruposSeguranca.find((g) => g.nome === grupoNome);
    if (!securityGroup) {
      console.warn(`⚠️ Grupo de segurança não encontrado para: ${grupoNome}`);
      continue;
    }

    let grupoId = await buscarGrupoPorDescricao(grupoNome);
    if (!grupoId) grupoId = await criarGrupo(grupoNome, securityGroup.id);
    if (!grupoId) continue;

    await adicionarVeiculosAoGrupo(grupoId, gruposMap[grupoNome]);
  }

  console.log("\n✅ Processamento concluído!");
}

processar();
