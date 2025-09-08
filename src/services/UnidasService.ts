import proxyApi from "./proxyApi";

// Função para filtrar veículos que estão apenas no grupo default
function filtrarVeiculosSemGrupoCliente(veiculo: any) {
  return veiculo.vehicleGroups.length === 1 && veiculo.vehicleGroups[0].isAll === true;
}

// Busca veículos em lotes paginados e filtra
async function buscarVeiculosSemGrupo(
  lote = 500,
  onProgress?: (processados: number, total: number, descricao?: string) => void
) {
  const token = localStorage.getItem("token");
  let skip = 0;
  let totalProcessados = 0;
  const resultado: any[] = [];
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await proxyApi.post(
        "/proxy",
        {
          path: `/Vehicles?$expand=vehicleGroups&$top=${lote}&$skip=${skip}`,
          method: "GET",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;
      if (!data?.value || data.value.length === 0) break;

      const filtrados = data.value.filter(filtrarVeiculosSemGrupoCliente);
      resultado.push(...filtrados);

      skip += lote;
      totalProcessados += data.value.length;

      if (onProgress) onProgress(totalProcessados, data["@odata.count"] || 0);
      hasMore = data.value.length === lote;
    } catch (err: any) {
      console.error("❌ Erro ao buscar veículos:", err.response?.data || err.message);
      break;
    }
  }

  return resultado;
}

export default {
  buscarVeiculosSemGrupo,
};
