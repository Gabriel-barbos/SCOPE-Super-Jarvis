import proxyApi from "./proxyApi";

interface SecurityGroup {
  id: string;
  description: string;
}

async function listarSecurityGroups(): Promise<SecurityGroup[]> {
  try {
    const token = localStorage.getItem("token");
    const res = await proxyApi.post(
      "/proxy",
      {
        path: "/SecurityGroups?$select=id,description",
        method: "GET",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data.value || [];
  } catch (err: any) {
    console.error("❌ Erro ao listar grupos:", err.response?.data || err.message);
    return [];
  }
}


export default {
  listarSecurityGroups,
};

