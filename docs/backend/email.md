---
Integrantes:
- Arthur Gama Ruiz (RA: 23.01445-8)
- Enzo Oliveira D’Onofrio (RA: 23.01561-6)
- Felipe Fazio da Costa (RA: 23.00055-4)
- João Vitor Morimoto Sesma (RA: 23.01516-0)
- Leonardo Souza Olivieri (RA: 23.01512-8)
- Pedro Wilian Palumbo Bevilacqua (RA: 23.01307-9)

Data: 04/06/2026
Matérias: 
- ECM516_Arquitetura_de_Computadores
- ECM252_Linguagens_de_Programação_2
---

# Microsserviço: Contato e E-mail
**Pasta:** `/back/contato_email`
**Contexto de Desenvolvimento:** Essencial para a comunicação oficial com o cliente. O serviço evoluiu para suportar tanto o envio direto via SMTP (para mensagens automáticas) quanto a geração de links dinâmicos para abertura manual no cliente de e-mail do usuário.
**Descrição:** Centraliza as comunicações externas do sistema SkySwift via protocolo de e-mail.

---

### Integração SMTP (Nodemailer)
O serviço utiliza configurações de ambiente para se conectar de forma segura a servidores de e-mail profissionais:

```javascript
function createMailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}
```

### Registro de Contatos
Cada interação gera um evento que permite ao sistema auditar quantas solicitações de suporte ou vendas foram realizadas:

```javascript
// Publica evento de email enviado
publicarEvento('EmailEnviado', {
    destinatario: CONTACT_RECIPIENT,
    remetente: email,
    messageId: info.messageId
});
```
