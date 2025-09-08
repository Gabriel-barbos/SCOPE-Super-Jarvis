import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { username, password, client_id, client_secret, grant_type, response_type } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username e password são obrigatórios' });
    }

    const params = new URLSearchParams();
    params.append("client_id", client_id || "mz-eqmaranhao");
    params.append("client_secret", client_secret || "G8PcqkHikp%BUejsv.C!^wzr");
    params.append("username", username);
    params.append("Password", password);
    params.append("grant_type", grant_type || "password");
    params.append("response_type", response_type || "code id token");

    const response = await fetch("https://login.mzoneweb.net/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro ao buscar token:", data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Erro interno na função get-token:", error);
    return res.status(500).json({ error: "Erro interno ao gerar token" });
  }
}
