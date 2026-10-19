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

# Microsserviço: Barramento de Eventos
**Pasta:** `/back/barramento_eventos`
**Contexto de Desenvolvimento:** Criado para resolver o problema de acoplamento entre microsserviços. Sem o barramento, cada serviço precisaria conhecer o endereço de todos os outros. Com ele, o serviço apenas "grita" um evento e o barramento distribui.
**Descrição:** Hub central que recebe eventos via POST e os replica para todos os serviços inscritos.

---

### Implementação do Broadcast
O barramento percorre a lista de inscritos e faz um repasse assíncrono do evento:

```javascript
async function distribuirEvento(evento) {
  for (const servico of inscricoes) {
    // Evita loop infinito: não envia para quem originou
    if (servico.nome === evento.origem) continue;

    try {
      await axios.post(`${servico.url}/eventos/receber`, evento, {
        timeout: 5000,
      });
      console.log(`Evento ${evento.tipo} entregue para ${servico.nome}`);
    } catch (erro) {
      console.error(`Falha ao entregar para ${servico.nome}: ${erro.message}`);
    }
  }
}
```

### Registro de Serviços
Os serviços se registram informando um nome único e uma URL de retorno (webhook):

```javascript
app.post('/inscricao', (req, res) => {
  const { nome, url } = req.body;
  if (!nome || !url) return res.status(400).send('Dados incompletos');
  
  inscricoes.push({ nome, url });
  res.status(201).json({ success: true, message: `Serviço ${nome} inscrito` });
});
```

---

## Contrato de eventos (atualizado em 18/10/2026)

O barramento conversa apenas por HTTP e JSON, sem depender da linguagem dos
serviços. Por isso o serviço de rotas pôde ser reimplementado em Dart
(`back/entrega_via_drone_dart`) sem nenhuma mudança nos demais serviços.

### Endpoints

| Método e caminho | Quem chama | Corpo / parâmetros | Efeito |
| --- | --- | --- | --- |
| `POST /inscricao` | todo serviço consumidor, a cada 5 s | `{ "nome", "url" }` | inscreve ou atualiza a URL do serviço |
| `POST /eventos` | serviço que publica | `{ "tipo", "dados", "origem" }` | registra e distribui o evento |
| `GET /eventos` | depuração | `?tipo=&limite=` | histórico, do mais recente ao mais antigo |
| `GET /inscricoes` | depuração e testes | — | serviços inscritos |
| `POST {url}/eventos/receber` | o barramento | evento completo | entrega o evento a cada inscrito, exceto à origem |

### Formato do evento distribuído

```json
{
  "id": "4b0c1e9a-7f43-4a55-9c1e-2f1b8f0e6d21",
  "tipo": "RotaCalculada",
  "dados": { "pedidoId": "...", "distancia": 4170.7, "duracao": 446, "fallback": false },
  "origem": "entrega_via_drone",
  "timestamp": "2026-10-18T22:00:00.000Z"
}
```

- `id`: UUID gerado com `crypto.randomUUID()`. Antes era `historico.length + 1`,
  que repetia o valor `1001` para todo evento após o histórico atingir o limite
  de 1000 entradas. O UUID também não se repete após reinícios do pod, o que
  não aconteceria com um contador em memória. O teste `tests/barramento.cjs`
  publica 1003 eventos e verifica que todos os ids são distintos.
- `origem`: nome usado na inscrição; o barramento não devolve o evento a quem o publicou.

### Quem publica e quem consome

| Evento | Publicado por | Consumido por | Reação |
| --- | --- | --- | --- |
| `RotaCalculada` | `entrega_via_drone` (Dart) | `gestao_de_pedidos` | move o pedido de `confirmado`/`em_processamento` para `em_rota` |
| `PEDIDO_CRIADO` | `gestao_de_pedidos` | `notificacoes` | cria a notificação "Pedido criado" |
| `PEDIDO_CONFIRMADO`, `PEDIDO_ATUALIZADO`, `PEDIDO_CANCELADO` | `gestao_de_pedidos` | — | registrados no histórico |
| `ContatoSolicitado`, `EmailEnviado` | `contato_email` | — | registrados no histórico |

### Inscrições esperadas

Cinco serviços se inscrevem: `entrega_via_drone`, `contato_email`,
`cadastro_usuario`, `gestao_de_pedidos` e `notificacoes`. A versão Dart usa o
mesmo nome `entrega_via_drone` da versão Node; por isso apenas uma das duas
deve estar em execução por vez (no Kubernetes, sobe somente a versão Dart).
