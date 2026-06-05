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

# Microsserviço: Notificações
**Pasta:** `/back/notificacoes`
**Contexto de Desenvolvimento:** Desenvolvido para aumentar o engajamento e a transparência com o usuário. Este serviço é um consumidor puramente reativo: ele "escuta" o que acontece no sistema e traduz isso em mensagens amigáveis no painel do usuário.
**Descrição:** Gerencia o histórico de alertas e notificações em tempo real, persistindo-as em banco de dados para consulta posterior.

---

### Consumo Reativo de Eventos
O serviço reage a eventos específicos vindos do Barramento, como a criação de um pedido, e gera automaticamente uma entrada na tabela de notificações:

```javascript
app.post("/eventos/receber", async (req, res) => {
  const { tipo, dados } = req.body;

  if (tipo === "PEDIDO_CRIADO") {
    // Transforma o evento em uma notificação legível
    await criarNotificacaoPedidoCriado(dados);
    return res.status(201).json({ recebido: true });
  }
});
```

### Gestão de Estado (Lida/Não Lida)
Possui endpoints para que o frontend possa marcar mensagens como lidas, permitindo o controle de "badge" (contador) na interface:

```javascript
app.patch("/notificacoes/:id/ler", async (req, res) => {
  await pool.query(
    "UPDATE notificacoes SET lida = true, lida_em = CURRENT_TIMESTAMP WHERE id = ?",
    [req.params.id]
  );
  res.json({ success: true });
});
```
