import express from "express";
import fetch from "node-fetch";
import cors from "cors";

// Importar o scheduler (isso ativa automaticamente o agendamento)
import "./scheduler.js";
import { executarRotinaManual, getProximaExecucao } from "./scheduler.js";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ NOVO: Endpoint para executar rotina manualmente
app.post("/api/executar-rotina-unidas", async (req, res) => {
  try {
    console.log("🚀 Executando rotina Unidas manualmente...");
    const resultado = await executarRotinaManual();
    res.json(resultado);
  } catch (err) {
    console.error("❌ Erro ao executar rotina:", err.message);
    res.status(500).json({ 
      sucesso: false,
      error: err.message 
    });
  }
});

// ✅ NOVO: Endpoint para obter informações do agendamento
app.get("/api/status-rotina", (req, res) => {
  try {
    const info = getProximaExecucao();
    res.json({
      agendamentoAtivo: true,
      horario: "8:00 AM (todo dia)",
      timezone: "America/Sao_Paulo",
      ...info
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Endpoint existente: Proxy para API externa
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

// ✅ Endpoint existente: Obter token
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

// ✅ NOVO: Endpoint de health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    servidor: "Proxy + Rotinas Automáticas",
    rotina: getProximaExecucao()
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`⏰ Rotina da Unidas agendada para todo dia às 8:00 AM`);
  console.log(`📋 Próxima execução: ${getProximaExecucao().proximaExecucaoFormatada}`);
  console.log(`🔗 Endpoints disponíveis:`);
  console.log(`   POST /api/executar-rotina-unidas - Executar rotina manualmente`);
  console.log(`   GET  /api/status-rotina - Status do agendamento`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /proxy - Proxy para API externa`);
  console.log(`   POST /api/get-token - Obter token de autenticação`);
});