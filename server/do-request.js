import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/proxy", async (req, res) => {
  try {
    const { path, method = "GET", body: reqBody, headers: extraHeaders, token } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: "O campo 'path' é obrigatório" });
    }

    // CORREÇÃO: Melhor priorização para obter o token
    let authToken = token || req.headers.authorization || "";

    // Remove prefixo "Bearer " caso já exista
    if (authToken.toLowerCase().startsWith("bearer ")) {
      authToken = authToken.slice(7);
    }

    if (!authToken) {
      console.error("❌ Token não fornecido");
      return res.status(401).json({ error: "Token de autorização é obrigatório" });
    }

    console.log("🔄 Fazendo requisição para API externa...");
    console.log("Path:", path);
    console.log("Method:", method);
    console.log("Token (primeiros 10 chars):", authToken.slice(0, 10) + "...");

    // Faz a requisição para a API real
    const response = await fetch(`https://live.mzoneweb.net/mzone62.api${path}`, {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
        ...extraHeaders,
      },
      body: ["GET", "DELETE"].includes(method.toUpperCase()) ? undefined : JSON.stringify(reqBody),
    });

    console.log("📡 Status da resposta:", response.status);

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    // Se não é 2xx, loga o erro para debug
    if (!response.ok) {
      console.error("❌ Erro da API externa:", {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
    }

    return res.status(response.status).json(data);

  } catch (err) {
    console.error("❌ Erro no proxy:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Endpoint adicional para obter token (se necessário)
app.post("/api/get-token", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log("🔑 Solicitando token para:", username);
    
    const response = await fetch("https://live.mzoneweb.net/mzone62.api/Auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Erro ao obter token:", data);
      return res.status(response.status).json(data);
    }

    console.log("✅ Token obtido com sucesso");
    return res.json(data);
    
  } catch (err) {
    console.error("❌ Erro ao solicitar token:", err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Proxy rodando em http://localhost:${PORT}`));