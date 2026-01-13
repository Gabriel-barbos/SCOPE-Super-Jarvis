import express from "express";
import fetch from "node-fetch";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
import cors from "cors";
import clientRoutes from "./routes/ClientRoutes.js";
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado com sucesso"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

app.use("/api/clients", clientRoutes);


app.post("/api/get-token", async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { username, password, client_id, client_secret, grant_type, response_type } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username e password são obrigatórios" });
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
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erro ao buscar token:", data);
      return res.status(response.status).json(data);
    }

    console.log("✅ Token obtido com sucesso para:", username);
    return res.status(200).json(data);
  } catch (error) {
    console.error("❌ Erro interno ao gerar token:", error);
    return res.status(500).json({ error: "Erro interno ao gerar token" });
  }
});


app.post("/proxy", async (req, res) => {
  try {
    const { path, method = "GET", body: reqBody, headers: extraHeaders, token } = req.body;

    if (!path) {
      return res.status(400).json({ error: "O campo 'path' é obrigatório" });
    }

    let authToken = token || req.headers.authorization || "";
    if (authToken.toLowerCase().startsWith("bearer ")) {
      authToken = authToken.slice(7);
    }

    if (!authToken) {
      return res.status(401).json({ error: "Token de autorização é obrigatório" });
    }

    console.log(`🔄 Requisitando ${method.toUpperCase()} ${path}`);

    const response = await fetch(`https://live.mzoneweb.net/mzone62.api${path}`, {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
        ...extraHeaders,
      },
      body: ["GET", "DELETE"].includes(method.toUpperCase())
        ? undefined
        : JSON.stringify(reqBody),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    if (!response.ok) {
      console.error("❌ Erro da API externa:", data);
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error("❌ Erro no proxy:", err);
    return res.status(500).json({ error: err.message });
  }
});


app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    servidor: "Proxy MZone",
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log("Endpoints disponíveis:");
  console.log("  POST /api/get-token  -> Gerar token");
  console.log("  POST /proxy          -> Proxy para API externa");
  console.log("  GET  /api/health     -> Health check");
});
