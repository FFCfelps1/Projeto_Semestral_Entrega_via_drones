require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3003;
const CONTACT_RECIPIENT = 'entrega.drones@gmail.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const DEFAULT_SUBJECT = 'Contato SkySwift - Entrega via Drones';
const DEFAULT_BODY = [
  'Olá, equipe SkySwift!',
  '',
  'Tenho interesse em conhecer melhor o serviço de entregas via drones.',
  'Poderiam, por favor, compartilhar informações sobre:',
  '- áreas atendidas e disponibilidade da operação;',
  '- prazo médio e janela estimada de entrega;',
  '- capacidade de carga por drone e tipos de encomenda aceitos;',
  '- rastreamento em tempo real e integração com sistemas;',
  '- modelo comercial, valores e planos disponíveis.',
  '',
  'Se possível, peço retorno com uma proposta inicial e orientações para próximo passo.',
  '',
  'Atenciosamente,',
  '[Seu nome]',
  '[Empresa]',
  '[Telefone]'
].join('\n');

function buildMailtoLink(recipient, subject, body) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createMailer() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Microsserviço de e-mail rodando' });
});

app.get('/email/contato', (req, res) => {
  const { subject, body } = req.query;
  const finalSubject = typeof subject === 'string' && subject.trim() ? subject.trim() : DEFAULT_SUBJECT;
  const finalBody = typeof body === 'string' && body.trim() ? body.trim() : DEFAULT_BODY;

  const mailtoLink = buildMailtoLink(CONTACT_RECIPIENT, finalSubject, finalBody);

  console.log(`[${new Date().toISOString()}] Link de contato gerado para ${CONTACT_RECIPIENT}`);

  return res.json({
    success: true,
    recipient: CONTACT_RECIPIENT,
    subject: finalSubject,
    body: finalBody,
    link: mailtoLink,
  });
});

app.post('/email/enviar', async (req, res) => {
  const { nome, email, empresa, telefone, mensagem } = req.body || {};

  if (!nome || !email || !mensagem) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios: nome, e-mail e mensagem.',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'E-mail inválido.',
    });
  }

  if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    return res.status(503).json({
      success: false,
      error: 'Serviço de envio não configurado no servidor. Defina SMTP_USER, SMTP_PASS e SMTP_FROM.',
    });
  }

  const mailer = createMailer();

  const assunto = `Novo contato via site - ${nome}`;
  const corpoTexto = [
    'Nova mensagem enviada diretamente pelo site SkySwift.',
    '',
    `Nome: ${nome}`,
    `Email: ${email}`,
    `Empresa: ${empresa || 'Não informado'}`,
    `Telefone: ${telefone || 'Não informado'}`,
    '',
    'Mensagem:',
    `${mensagem}`,
  ].join('\n');

  try {
    const info = await mailer.sendMail({
      from: SMTP_FROM,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: assunto,
      text: corpoTexto,
    });

    console.log(`[${new Date().toISOString()}] Mensagem enviada para ${CONTACT_RECIPIENT}. ID: ${info.messageId}`);

    return res.json({
      success: true,
      recipient: CONTACT_RECIPIENT,
      messageId: info.messageId,
      message: 'Mensagem enviada com sucesso.',
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro ao enviar mensagem:`, error.message);

    return res.status(500).json({
      success: false,
      error: 'Falha ao enviar mensagem no momento. Tente novamente mais tarde.',
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serviço de e-mail rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
