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
