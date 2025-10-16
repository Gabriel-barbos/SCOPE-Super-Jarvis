import axios from "axios";
import XLSX from "xlsx";

const API_URL = "https://live.mzoneweb.net/mzone62.api"; 
const TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlDNTg1RjFFODkzM0Q4RDJDMkJGRjdEQkIxQkRFMjBGRTFCNjVDNUEiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJuRmhmSG9rejJOTEN2X2Zic2IzaUQtRzJYRm8ifQ.eyJuYmYiOjE3NTc2MTI1ODQsImV4cCI6MTc1NzYxNjE4NCwiaXNzIjoiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9sb2dpbi5tem9uZXdlYi5uZXQvcmVzb3VyY2VzIiwiZGktYXBpIiwibXo2LWFwaSJdLCJjbGllbnRfaWQiOiJtei1lcW1hcmFuaGFvIiwic3ViIjoiMGRlYzE5MTUtZmU3ZC00MGI2LTk2YTctMTFkMGMyOTZjM2I4IiwiYXV0aF90aW1lIjoxNzU3NjEyNTg0LCJpZHAiOiJsb2NhbCIsIm16X3VzZXJuYW1lIjoiZXFwaWF1aSIsIm16X3VzZXJncm91cF9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsIm16X3NoYXJkX2NvZGUiOiJCUkFaSUwiLCJzY29wZSI6WyJtel91c2VybmFtZSIsIm9wZW5pZCIsImRpLWFwaS5hbGwiLCJtejYtYXBpLmFsbCJdLCJhbXIiOlsicHdkIl19.R_HxjEK21AFoXrSgLSFVCRV48AqVabScuobr308fTvwpj4apPluYvEWLYuD6QSbKAcix046EEYUO5MnABhDzxf3iHINIUqQ81CY6QXHc9VQsLmjOasgfIxPSZi6GHcBRen85ueC1TodogBABgtwhAVWU6oUSjtDhzgcUr2-DYYOQlXmROsl3YRYykYfoythQ6kbvFchOarQbPgFwipQS-yFN87bxpdAiileE9ZT9B7k3G1eBbyuiEbtPDNnn3amekcUFg5bpOzZYW04BLwHCuPPW_p8yRmjI7q5rGLV4uzLUZRHCoj6mstv9PzDILTMuQqVBGYu-c2N-CsqZfcv-NRCm29y2ChDy4DdhZM4VxR6R06PrEpC6li-YqMX8Y6RLo21tiLsoYdV5xz29Hc6h62oeyIPEn8GpMQ0uzqK72ibtz0ljcgwnrUKbtAhgR08u0eMFa9aGhc_822fbIm0fyM2JrXYG1DwLLD6RT_Ts2zdtLkXvBNln7AdZQl66jRGd7Cl3IYMPVQ7iVp2txDssIF-3RJagPQUc2FYdr0uCwaaqC8uNJAfg7sbDry4SguUfzWXj3AAYKVemcUNPx2_oLaSkzo3hyYbAxe4OI1rYh-HNvTbnyL88sB2A3nbIuDh_a34yRDSc8AhxC94yblVD7QMi33oqJIYXztmq7mCSK24"


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
