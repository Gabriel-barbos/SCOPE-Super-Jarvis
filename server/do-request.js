import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/proxy", async (req, res) => {
  try {
    const { path, method = "GET", body: reqBody, headers: extraHeaders } = req.body;
    if (!path) return res.status(400).json({ error: "O campo 'path' é obrigatório" });

    // Pegando token do frontend via header Authorization ou body.token
    const token = req.headers.authorization || req.body.token || "";

    const response = await fetch(`https://live.mzoneweb.net/mzone62.api${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...extraHeaders,
      },
      body: ["GET", "DELETE"].includes(method.toUpperCase()) ? undefined : JSON.stringify(reqBody),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json(data);

  } catch (err) {
    console.error("Erro no proxy:", err);
    return res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Proxy rodando em http://localhost:${PORT}`));
