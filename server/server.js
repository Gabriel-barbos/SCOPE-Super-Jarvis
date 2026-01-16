import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import clientRoutes from './routes/ClientRoutes.js';
import routineRoutes from './routes/RoutineRoutes.js';
import engineRoutes from './routes/EngineRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

//Conexão com MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado com sucesso'))
  .catch((err) => console.error('Erro ao conectar MongoDB:', err));

//Rotas
app.use('/api/clients', clientRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api', engineRoutes);

// Proxy API externa
app.post('/proxy', async (req, res) => {
  try {
    const { path, method = 'GET', body, token } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'Path é obrigatório' });
    }

    if (!token) {
      return res.status(401).json({ error: 'Token é obrigatório' });
    }

    const response = await fetch(
      `https://live.mzoneweb.net/mzone62.api${path}`,
      {
        method: method.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: ['GET', 'DELETE'].includes(method.toUpperCase())
          ? undefined
          : JSON.stringify(body),
      }
    );

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Erro no proxy:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
