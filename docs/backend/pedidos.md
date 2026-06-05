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

# Microsserviço: Gestão de Pedidos
**Pasta:** `/back/gestao_de_pedidos`
**Contexto de Desenvolvimento:** O coração operacional da SkySwift. Foi desenvolvido para suportar o fluxo desde a intenção de compra até a entrega final, utilizando middlewares para garantir a qualidade dos dados.
**Descrição:** Gerencia o CRUD de pedidos e as atualizações de status (Pendente, Em Voo, Entregue).

---

### Middleware de Validação
Antes de processar o pedido, verificamos se as coordenadas GPS e os dados do cliente são válidos:

```javascript
const validarPedido = (req, res, next) => {
  const { destinoLat, destinoLng, itens } = req.body;
  if (!destinoLat || !destinoLng) {
    return res.status(400).json({ error: "Coordenadas de destino obrigatórias" });
  }
  if (!itens || itens.length === 0) {
    return res.status(400).json({ error: "O pedido deve ter pelo menos um item" });
  }
  next();
};
```

### Fluxo de Criação
Ao criar um pedido, o status inicial é definido e o barramento é notificado para que o drone seja despachado:

```javascript
router.post("/novo", validarPedido, async (req, res) => {
  const novoPedido = {
    ...req.body,
    id: Date.now(),
    status: 'pendente',
    dataCriacao: new Date()
  };
  
  // Salva no banco e publica
  await db.save(novoPedido);
  await publicarNoBarramento('PEDIDO_CRIADO', novoPedido);
  
  res.status(201).json(novoPedido);
});
```
