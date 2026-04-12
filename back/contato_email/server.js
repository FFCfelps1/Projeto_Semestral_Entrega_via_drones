const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3003;
const CONTACT_RECIPIENT = 'entrega.drones@gmail.com';
const DEFAULT_SUBJECT = 'Contato SkySwift - Entrega via Drones';
const DEFAULT_BODY = [
  'Ola, equipe SkySwift!',
  '',
  'Gostaria de mais informacoes sobre o servico de entrega via drones.',
  '',
  'Obrigado.'
].join('\n');

function buildMailtoLink(recipient, subject, body) {
  const query = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:${recipient}?${query.toString()}`;
}

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Microservico de email rodando' });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Email service rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
