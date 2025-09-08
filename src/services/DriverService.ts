import proxyApi from "./proxyApi";

// Função para separar primeiro e sobrenome
function separarNomeCompleto(nomeCompleto: string) {
  const partes = nomeCompleto.trim().split(" ");
  const firstName = partes.shift() || "";
  const surname = partes.join(" ") || " ";
  return { firstName, surname };
}

// Monta o objeto no formato da API
function montarMotorista(row: any, index: number) {
  const { firstName, surname } = separarNomeCompleto(row.nomeCompleto);

  const motorista: any = {
    description: row.nomeCompleto,
    driverKeyCode: Number(row.codigoMzone) || 1000 + index,
    firstName,
    surname,
    costPerHour: 0,
    startDate: new Date().toISOString(),
  };

  if (row.idDriver) {
    motorista.identityNumber = row.idDriver.toString();
  }

  return motorista;
}

// Envia motoristas em lotes sequenciais e atualiza progresso
async function cadastrarMotoristasEmLote(
  data: any[],
  lote = 5,
  onProgress?: (sent: number, total: number, nome?: string) => void
) {
  const total = data.length;
  let sent = 0;

  for (let i = 0; i < total; i += lote) {
    const chunk = data.slice(i, i + lote);

    // Envio sequencial dentro do lote
    for (let j = 0; j < chunk.length; j++) {
      const motorista = montarMotorista(chunk[j], i + j);
      console.log("📤 Enviando motorista:", motorista);

      try {
        const token = localStorage.getItem("token");
        const res = await proxyApi.post(
          "/proxy",
          {
            path: "/Drivers",
            method: "POST",
            body: motorista,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("✅ Motorista criado:", res.data);
      } catch (err: any) {
        console.error(
          `❌ Erro ao criar motorista ${motorista.description}:`,
          err.response?.data || err.message
        );
      }

      sent++;
      if (onProgress) onProgress(sent, total, motorista.description);
    }
  }
}

export default {
  cadastrarMotoristasEmLote,
};
