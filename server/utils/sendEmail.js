import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export async function sendEmail({ to, subject, html, text }) {
  // cria transportador de e-mail usando SMTP do Gmail
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASS,
    },
  });

  const mailOptions = {
    from: `"Sistema MZone" <${process.env.GMAIL_USER}>`,
    to,
    bcc: process.env.GMAIL_CCO?.split(",").map((s) => s.trim()),
    subject,
    text: text || "",
    html: html || "",
  };

  // envia o e-mail
  const info = await transporter.sendMail(mailOptions);
  console.log(`✅ E-mail enviado: ${info.messageId} para ${to}`);
  return info;
}
