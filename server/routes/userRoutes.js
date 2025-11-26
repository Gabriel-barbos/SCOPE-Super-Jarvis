import express from "express";
import axios from "axios";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.post("/create-user", async (req, res) => {
  try {
    const { name, email, password, token } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "name, email e password são obrigatórios" });

    if (!token)
      return res.status(401).json({ error: "Token de autorização é obrigatório" });

    // 1Criar usuário na API externa
    const apiResponse = await axios.post(
      `${process.env.API_URL}/user`,
      { name, email, password },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const userData = apiResponse.data;

    // Enviar o e-mail com credenciais
    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; color:#333;">
        <h2>Olá ${name},</h2>
        <p>Seu acesso ao sistema foi criado com sucesso! Seguem suas credenciais:</p>
        <table cellpadding="0" cellspacing="0" style="margin-top:8px;">
          <tr><td><strong>Usuário:</strong></td><td style="padding-left:8px;">${email}</td></tr>
          <tr><td><strong>Senha:</strong></td><td style="padding-left:8px;">${password}</td></tr>
        </table>
        <p style="margin-top:12px;">Recomendamos alterar sua senha no primeiro acesso.</p>
        <p style="font-size:12px;color:#666;margin-top:18px;">Se você não solicitou este acesso, entre em contato com o suporte.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Seus dados de acesso ao sistema",
      html,
      text: `Olá ${name},\n\nUsuário: ${email}\nSenha: ${password}\n\nAltere sua senha no primeiro acesso.`,
    });

    // Retornar sucesso
    res.status(201).json({
      message: "Usuário criado e e-mail enviado com sucesso",
      user: userData,
    });
  } catch (error) {
    console.error("❌ Erro em /create-user:", error.response?.data || error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data || "Erro da API externa",
      });
    }

    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
