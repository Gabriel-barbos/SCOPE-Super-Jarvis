import express from "express";
import Client from "../models/Client.js";

const router = express.Router();

/**
 * CREATE - criar cliente
 */
router.post("/", async (req, res) => {
  try {
    const { name, login, password, type } = req.body;

    if (!name || !login || !password || !type) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const exists = await Client.findOne({ login });
    if (exists) {
      return res.status(409).json({ error: "Login already exists" });
    }

    const client = await Client.create({
      name,
      login,
      password,
      type,
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * READ - listar todos
 */
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().select("-password");
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * READ - buscar por ID
 */
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).select("-password");

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * UPDATE - atualizar cliente
 */
router.put("/:id", async (req, res) => {
  try {
    const { name, login, password, type } = req.body;

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, login, password, type },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE - remover cliente
 */
router.delete("/:id", async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
