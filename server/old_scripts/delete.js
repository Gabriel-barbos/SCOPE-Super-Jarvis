import axios from "axios";
import XLSX from "xlsx";

const API_URL = "https://live.mzoneweb.net/mzone62.api"; 
const TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlDNTg1RjFFODkzM0Q4RDJDMkJGRjdEQkIxQkRFMjBGRTFCNjVDNUEiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJuRmhmSG9rejJOTEN2X2Zic2IzaUQtRzJYRm8ifQ.eyJuYmYiOjE3NzMzMzM1NDUsImV4cCI6MTc3MzMzNzE0NSwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQvcmVzb3VyY2VzIiwiZGktYXBpIiwibXo2LWFwaSJdLCJjbGllbnRfaWQiOiJtei1lcW1hcmFuaGFvIiwic3ViIjoiM2RjMDRhNjEtMmMxMC00YjQyLWE5NDQtZWUzYzU2ZDAwN2FhIiwiYXV0aF90aW1lIjoxNzczMzMzNTQ1LCJpZHAiOiJsb2NhbCIsIm16X3VzZXJuYW1lIjoiZXFlY2hvIiwibXpfdXNlcmdyb3VwX2lkIjoiN2Y3NTczYmMtNTRjMS00ZDdmLTg0ODQtYzA2NWUyZjNjN2FhIiwibXpfc2hhcmRfY29kZSI6IkJSQVpJTCIsInNjb3BlIjpbIm16X3VzZXJuYW1lIiwib3BlbmlkIiwiZGktYXBpLmFsbCIsIm16Ni1hcGkuYWxsIl0sImFtciI6WyJwd2QiXX0.OXntTwkPV9neOH2xCk_hhvXrQaRvCKrFasBO-Du9k7b-pJv-AYfMQhF-MuOab0vL4rBflp2ZAHbdSoKQtecLGCNs94XBm2Erh706fhq9NQ5VXO1i-hVtdNflqQnOcqqJl6NWIBERer4lI4OWWSPuefXm6wCxAM8GiEOQqopMv2saw2tGk51yYVuprmEFBp2Ydy3fcZM9XRznDl_aRodSN8QRSMc_vmw25jBg0tbCwvkaaPdIBUWTZ9-Kxs1MU4A-i0msoVP3gtKETGD73gJiO2fho3LXHLLPk4YfgBtZGoy9t7akFRSTR1FalLML56oUTLiRV40gLlSGqsz7KRUQiqM67iYH2QSNAk093RpuPNNJdZ7aJKSxJrKtVIGME_wpwpI4GpEwVmRU0fT-sDi1S_nwOmDm9If7ZlRJkbj3aZyHjIF8zaUl7BCAIwHdqose1bawJ6ps5bQG4vRMifc65kccDokSwN0jlzfyxJ90RxkQWQji0vzX7gvEjU8RQsgArVkl4cIzWGmzBXCvy0F1TYUCdDgiJqzaxIJBfrFVjgn6iLaha4ICzzf0v_uXs3PF19yEfhxzYih7V3UTy8hLglgJgtrayA5wCbtLNJwrwOAz-_tsPmU54hECfjTlc3XBGss2iTe-w3Ue-add-S-ndL0NPT4YrnNW2GK0Pv8OLss"
const api = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function deleteDriversFromExcel(filePath) {
  // 1. Ler a planilha
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const total = data.length;
  let deletados = 0;

  for (let i = 0; i < total; i++) {
    const row = data[i];
    const description = row.description?.trim();
    if (!description) continue;

    try {
      // 2. Buscar motorista pelo description
      const res = await api.get(
        `/Drivers?$filter=description eq '${description}'`
      );
      const driver = res.data.value?.[0];

      if (!driver) {
        console.log(`❌ [${i + 1}/${total}] Não encontrado: ${description}`);
        continue;
      }

      const driverId = driver.id;

      // 3. Excluir motorista
      await api.delete(`/Drivers(${driverId})`);

      deletados++;
      console.log(
        `✅ [${i + 1}/${total}] Motorista "${description}" (id=${driverId}) deletado com sucesso`
      );
    } catch (err) {
      console.error(`⚠️ [${i + 1}/${total}] Erro para ${description}:`);
      console.error("➡️ Método:", err.config?.method?.toUpperCase());
      console.error("➡️ URL:", err.config?.url);
      console.error("➡️ Status:", err.response?.status);
      console.error("➡️ Resposta:", err.response?.data || err.message);
    }
  }

  console.log(`\n👉 Finalizado. ${deletados}/${total} motoristas deletados.`);
}

// Executar
deleteDriversFromExcel("./motoristas.xlsx");
