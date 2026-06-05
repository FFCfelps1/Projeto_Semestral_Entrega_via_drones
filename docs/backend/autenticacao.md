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

# Microsserviço: Cadastro e Autenticação
**Pasta:** `/back/cadastro_usuario`
**Contexto de Desenvolvimento:** Necessário para garantir que apenas usuários autorizados façam pedidos. A evolução partiu de um login simples para um sistema com persistência em MySQL e tokens JWT para sessões sem estado (stateless).
**Descrição:** Gerencia o ciclo de vida do usuário, desde a criação da conta até a exclusão, passando pela autenticação segura.

---

### Segurança com Bcrypt e JWT
A senha nunca é salva em texto puro. Utilizamos um "salt" para gerar o hash:

```javascript
// No cadastro
const salt = await bcrypt.genSalt(10);
const senhaHash = await bcrypt.hash(senha, salt);

// No login (Comparação)
const senhaValida = await bcrypt.compare(senhaFornecida, usuarioNoBanco.senha);

// Geração de Token
const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
);
```

### Evento de Novo Usuário
Ao cadastrar, o serviço avisa o sistema para que outros módulos (como o de boas-vindas) possam agir:

```javascript
async function publicarEvento(tipo, dados) {
    await axios.post(`${BARRAMENTO_URL}/eventos`, {
        tipo,
        dados,
        origem: 'cadastro_usuario'
    });
}
```
