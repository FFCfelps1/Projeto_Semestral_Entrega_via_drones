const nodemailer = require("nodemailer");

const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "entrega.drones@gmail.com";

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readRequestBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      if (!req.body) {
        return Promise.resolve({});
      }

      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch (error) {
        return Promise.reject(new Error("Body JSON invalido"));
      }
    }

    return Promise.resolve(req.body || {});
  }

  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!chunks.length) {
        resolve({});
        return;
      }

      const rawBody = Buffer.concat(chunks).toString("utf8");

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(new Error("Body JSON invalido"));
      }
    });

    req.on("error", (error) => {
      reject(error);
    });
  });
}

function createMailer() {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

async function publishEvent(tipo, dados) {
  const barramentoUrl = process.env.BARRAMENTO_URL;

  if (!barramentoUrl) {
    return;
  }

  try {
    await fetch(`${barramentoUrl}/eventos`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        tipo,
        dados,
        origem: "contato_email",
      }),
    });
  } catch (error) {
    console.error("Falha ao publicar evento:", error.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { success: false, error: "Metodo nao permitido" });
  }

  let body;

  try {
    body = await readRequestBody(req);
  } catch (error) {
    return sendJson(res, 400, { success: false, error: error.message });
  }

  const { nome, email, empresa, telefone, mensagem } = body || {};

  if (!nome || !email || !mensagem) {
    return sendJson(res, 400, {
      success: false,
      error: "Campos obrigatorios: nome, e-mail e mensagem.",
    });
  }

  if (!isValidEmail(email)) {
    return sendJson(res, 400, {
      success: false,
      error: "E-mail invalido.",
    });
  }

  const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;
  const mailer = createMailer();

  if (!mailer || !smtpFrom) {
    return sendJson(res, 503, {
      success: false,
      error: "Servico de envio nao configurado. Defina SMTP_USER, SMTP_PASS e SMTP_FROM.",
    });
  }

  const assunto = `Novo contato via site - ${nome}`;
  const corpoTexto = [
    "Nova mensagem enviada diretamente pelo site SkySwift.",
    "",
    `Nome: ${nome}`,
    `Email: ${email}`,
    `Empresa: ${empresa || "Nao informado"}`,
    `Telefone: ${telefone || "Nao informado"}`,
    "",
    "Mensagem:",
    `${mensagem}`,
  ].join("\n");

  try {
    const info = await mailer.sendMail({
      from: smtpFrom,
      to: CONTACT_RECIPIENT,
      replyTo: email,
      subject: assunto,
      text: corpoTexto,
    });

    publishEvent("EmailEnviado", {
      destinatario: CONTACT_RECIPIENT,
      remetente: email,
      nome,
      messageId: info.messageId,
    });

    return sendJson(res, 200, {
      success: true,
      recipient: CONTACT_RECIPIENT,
      messageId: info.messageId,
      message: "Mensagem enviada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error.message);

    return sendJson(res, 500, {
      success: false,
      error: "Falha ao enviar mensagem no momento. Tente novamente mais tarde.",
    });
  }
};
