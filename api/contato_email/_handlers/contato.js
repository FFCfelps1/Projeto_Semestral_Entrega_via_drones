const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "entrega.drones@gmail.com";
const DEFAULT_SUBJECT = "Contato SkySwift - Entrega via Drones";
const DEFAULT_BODY = [
  "Ola, equipe SkySwift!",
  "",
  "Tenho interesse em conhecer melhor o servico de entregas via drones.",
  "Poderiam, por favor, compartilhar informacoes sobre:",
  "- areas atendidas e disponibilidade da operacao;",
  "- prazo medio e janela estimada de entrega;",
  "- capacidade de carga por drone e tipos de encomenda aceitos;",
  "- rastreamento em tempo real e integracao com sistemas;",
  "- modelo comercial, valores e planos disponiveis.",
  "",
  "Se possivel, peco retorno com uma proposta inicial e orientacoes para proximo passo.",
  "",
  "Atenciosamente,",
  "[Seu nome]",
  "[Empresa]",
  "[Telefone]",
].join("\n");

function buildMailtoLink(recipient, subject, body) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  return `mailto:${recipient}?subject=${encodedSubject}&body=${encodedBody}`;
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
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
  if (req.method !== "GET") {
    return sendJson(res, 405, { success: false, error: "Metodo nao permitido" });
  }

  const { subject, body } = req.query || {};
  const finalSubject = typeof subject === "string" && subject.trim() ? subject.trim() : DEFAULT_SUBJECT;
  const finalBody = typeof body === "string" && body.trim() ? body.trim() : DEFAULT_BODY;

  const link = buildMailtoLink(CONTACT_RECIPIENT, finalSubject, finalBody);

  publishEvent("ContatoSolicitado", {
    destinatario: CONTACT_RECIPIENT,
    assunto: finalSubject,
    metodo: "mailto",
  });

  return sendJson(res, 200, {
    success: true,
    recipient: CONTACT_RECIPIENT,
    subject: finalSubject,
    body: finalBody,
    link,
  });
};
