# Projeto Semestral: Entrega via Drones - SkySwift

---

Nome: Felipe Fazio da Costa 				  RA: 23.00055-4

Nome: Enzo Oliveira D’Onofrio 				RA: 23.01561-6

Nome: Leonardo Souza Olivieri 				RA: 23.01512-8

Nome: Arthur Gama Ruiz 					      RA: 23.01445-8

Nome: João Vitor Morimoto Sesma			  RA: 23.01516-0

Nome: Pedro Wilian Palumbo Bevilacqua RA: 23.01307-9

---

Uma aplicação web moderna para gerenciamento de entregas autônomas via drones, construída com React, Vite, Bootstrap e FontAwesome.

## 🚀 Características

- ✅ Interface responsiva com suporte a mobile, tablet e desktop
- 🌓 Modo claro e escuro (dark mode) com persistência em localStorage
- 🎨 Componentes reutilizáveis e bem estruturados
- 💰 Página de preços com três planos e FAQ interativo
- 🔧 Commits estruturados seguindo padrão semântico
- 📦 Versionamento semântico com tags Git

## 📋 Pré-requisitos

- Node.js (v16+)
- npm ou yarn

## 🛠️ Configuração e Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd projeto_semestral_entrega_via_drones
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse em seu navegador:
```
http://localhost:5173
```

### Páginas do Frontend

- `/` — Página inicial (hero, pedidos, vantagens, CTA)
- `/pedido` — Pedido de entrega via drone integrado ao microsservico `gestao_de_pedidos`: formulário, resumo com preço/tempo, lista de pedidos, histórico de status e cancelamento
- `/precos` — Planos de preço (Pessoal, Empresarial, Corporativo) e FAQ
- `/rastreamento` — Rastreamento de entrega por drone com mapa interativo
- `/suporte` — Central de ajuda com busca e tópicos expansíveis

## Backend: Microsservicos

O projeto utiliza uma arquitetura de microsservicos Node.js no diretorio `back`, conectados por um barramento de eventos:

1. `back/barramento_eventos` (porta `3001`): barramento central de eventos para comunicacao entre servicos.
2. `back/entrega_via_drone` (porta `3002`): calcula rota para rastreamento.
3. `back/contato_email` (porta `3003`): oferece duas formas de contato:
  - abrir cliente de e-mail com `mailto`;
  - enviar mensagem direto no site (backend envia para `entrega.drones@gmail.com`).
4. `back/cadastro_usuario` (porta `3004`): autentica usuarios, cria cadastro, gerencia perfil e emite token JWT.
5. `back/gestao_de_pedidos` (porta `3005`): gerencia o ciclo de vida dos pedidos de entrega via drone — criacao, confirmacao, listagem, atualizacao de status, cancelamento e historico. Calcula preco e tempo estimados e emite eventos no barramento.

### Barramento de Eventos (porta 3001)

O barramento de eventos e o componente central da arquitetura de microsservicos. Ele recebe eventos publicados por qualquer servico e os distribui para todos os servicos inscritos.

**Fluxo:**
1. Cada microsservico se inscreve automaticamente ao iniciar (`POST /inscricao`)
2. Quando algo acontece, o servico publica um evento (`POST /eventos`)
3. O barramento distribui o evento para todos os inscritos via `POST /eventos/receber`

**Eventos do sistema:**
- `RotaCalculada` — publicado pelo servico de rotas quando uma rota e calculada. O servico de pedidos consome este evento e move o pedido correspondente para o status `em_rota`.
- `ContatoSolicitado` — publicado pelo servico de email quando um link mailto e gerado
- `EmailEnviado` — publicado pelo servico de email quando uma mensagem e enviada
- `PEDIDO_CRIADO`, `PEDIDO_CONFIRMADO`, `PEDIDO_ATUALIZADO`, `PEDIDO_CANCELADO` — publicados pelo servico de pedidos a cada mudanca no ciclo de vida do pedido

**Ordem de inicializacao:** O barramento deve ser iniciado ANTES dos demais servicos.

### Como iniciar o barramento de eventos (3001)

```bash
cd back/barramento_eventos
npm install
npm run dev
```

### Como iniciar o microsservico de rota (3002)

```bash
cd back/entrega_via_drone
npm install
npm run dev
```

### Como iniciar o microsservico de email (3003)

```bash
cd back/contato_email
npm install
npm run dev
```

### Como configurar login e cadastro (3004)

Crie o banco e a tabela de usuarios no MySQL executando o script:

```sql
source back/banco/script.sql;
```

Ou abra `back/banco/script.sql` no MySQL Workbench e execute o arquivo completo.

Configure `back/cadastro_usuario/.env` a partir de `back/cadastro_usuario/.env.example`:

```env
PORT=3004
SERVICE_URL=http://localhost:3004
BARRAMENTO_URL=http://localhost:3001

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=skyswift
DB_PORT=3306

JWT_SECRET=troque-este-segredo-em-producao
```

Inicie o microsservico:

```bash
cd back/cadastro_usuario
npm install
npm run dev
```

No frontend local, a autenticacao usa `http://localhost:3004` por padrao. Para sobrescrever:

```env
VITE_AUTH_SERVICE_URL=http://localhost:3004
```

### Como iniciar o microsservico de pedidos (3005)

Este microsservico persiste os pedidos no MySQL (banco `skyswift`). Garanta que o banco
e a tabela `pedidos` existem rodando o script (o mesmo arquivo ja cria a tabela):

```sql
source back/banco/script.sql;
```

Configure `back/gestao_de_pedidos/.env` a partir de `back/gestao_de_pedidos/.env.example`:

```env
PORT=3005
SERVICE_URL=http://localhost:3005
BARRAMENTO_URL=http://localhost:3001

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=skyswift
DB_PORT=3306
```

Inicie o microsservico (em um terminal separado, com o servidor rodando):

```bash
cd back/gestao_de_pedidos
npm install
npm run dev
```

Voce deve ver `✅ gestao_pedidos rodando na porta 3005`. No frontend local, a pagina de
pedidos usa `http://localhost:3005` por padrao. Para sobrescrever:

```env
VITE_PEDIDOS_ENTREGA_SERVICE_URL=http://localhost:3005
```

**Tipos de entrega e regra de preco:** `padrao` (x1,0 / 45 min), `expressa` (x1,35 / 30 min)
e `prioritaria` (x1,65 / 20 min). O preco segue a formula `(10 + peso * 5) * multiplicador`.

**Status do pedido:** `rascunho` -> `confirmado` -> `em_processamento` -> `em_rota` ->
`entregue` (transicao so avanca; `cancelado` pode ser aplicado de qualquer estado, exceto
quando o pedido ja esta `em_rota` ou `entregue`).

### Endpoints principais

- `GET http://localhost:3001/health`
- `POST http://localhost:3001/eventos` — publica um evento
- `GET http://localhost:3001/eventos` — consulta historico de eventos (filtro: `?tipo=RotaCalculada&limite=10`)
- `POST http://localhost:3001/inscricao` — inscreve um servico
- `GET http://localhost:3001/inscricoes` — lista servicos inscritos
- `GET http://localhost:3002/health`
- `GET http://localhost:3002/rota?origemLat=...&origemLng=...&destinoLat=...&destinoLng=...`
- `POST http://localhost:3002/eventos/receber` — recebe eventos do barramento
- `GET http://localhost:3003/health`
- `GET http://localhost:3003/email/contato`
- `POST http://localhost:3003/email/enviar`
- `POST http://localhost:3003/eventos/receber` — recebe eventos do barramento
- `GET http://localhost:3004/health`
- `POST http://localhost:3004/auth/cadastro`
- `POST http://localhost:3004/auth/login`
- `GET http://localhost:3004/auth/me`
- `PATCH http://localhost:3004/auth/me`
- `PATCH http://localhost:3004/auth/me/senha`
- `DELETE http://localhost:3004/auth/me`
- `GET http://localhost:3005/health`
- `POST http://localhost:3005/pedidos` — cria um pedido
- `GET http://localhost:3005/pedidos` — lista pedidos (filtros: `?usuarioId=...&status=...`)
- `GET http://localhost:3005/pedidos/:id` — busca um pedido
- `POST http://localhost:3005/pedidos/:id/confirmar` — confirma um pedido em rascunho
- `PATCH http://localhost:3005/pedidos/:id` — atualiza o status do pedido
- `DELETE http://localhost:3005/pedidos/:id` — cancela um pedido
- `GET http://localhost:3005/pedidos/:id/historico` — historico de status do pedido
- `POST http://localhost:3005/eventos/receber` — recebe eventos do barramento

### Resposta do endpoint de contato por `mailto`

Exemplo de retorno de `GET /email/contato`:

```json
{
  "success": true,
  "recipient": "entrega.drones@gmail.com",
  "subject": "Contato SkySwift - Entrega via Drones",
  "body": "Olá, equipe SkySwift!\n\nTenho interesse em conhecer melhor o serviço de entregas via drones.\nPoderiam, por favor, compartilhar informações sobre:\n- áreas atendidas e disponibilidade da operação;\n- prazo médio e janela estimada de entrega;\n- capacidade de carga por drone e tipos de encomenda aceitos;\n- rastreamento em tempo real e integração com sistemas;\n- modelo comercial, valores e planos disponíveis.\n\nSe possível, peço retorno com uma proposta inicial e orientações para próximo passo.\n\nAtenciosamente,\n[Seu nome]\n[Empresa]\n[Telefone]",
  "link": "mailto:entrega.drones@gmail.com?subject=Contato%20SkySwift%20-%20Entrega%20via%20Drones&body=..."
}
```

No frontend, o botao "Contatar Vendas" chama esse endpoint e abre o cliente de e-mail padrao do usuario com destinatario e texto pre-preenchidos.

### Envio direto pelo site (`POST /email/enviar`)

Corpo esperado:

```json
{
  "nome": "Joao Silva",
  "email": "joao@empresa.com",
  "empresa": "Empresa X",
  "telefone": "(11) 99999-9999",
  "mensagem": "Gostaria de uma proposta para entregas recorrentes."
}
```

Campos obrigatorios: `nome`, `email`, `mensagem`.

Para envio real de e-mail, configure variaveis de ambiente no microsservico `back/contato_email`:

- `SMTP_HOST` (padrao: `smtp.gmail.com`)
- `SMTP_PORT` (padrao: `587`)
- `SMTP_SECURE` (`true` ou `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Mesmo no envio direto, o destinatario final permanece fixo em `entrega.drones@gmail.com`.

### Criacao de pedido (`POST /pedidos`)

Corpo esperado:

```json
{
  "item": "Documentos",
  "peso": 2,
  "origem": "Rua das Flores, 120 - Centro",
  "destino": "Avenida Brasil, 850 - Jardim",
  "tipo": "prioritaria",
  "observacoes": "Entregar na portaria",
  "usuarioId": null
}
```

Campos obrigatorios: `item`, `peso`, `origem`, `destino`, `tipo`.

Exemplo de resposta (`201 Created`):

```json
{
  "id": "1305bf98-af2b-47bd-a8a6-ccd6eca33821",
  "item": "Documentos",
  "peso": 2,
  "origem": "Rua das Flores, 120 - Centro",
  "destino": "Avenida Brasil, 850 - Jardim",
  "tipo": "prioritaria",
  "observacoes": "Entregar na portaria",
  "usuarioId": null,
  "status": "rascunho",
  "precoEstimado": "33.00",
  "tempoEstimado": 20,
  "statusHistorico": [
    { "status": "rascunho", "momento": "2026-05-29T23:53:47.584Z" }
  ],
  "criadoEm": "2026-05-29T23:53:47.584Z",
  "atualizadoEm": "2026-05-29T23:53:47.584Z"
}
```

No frontend, a pagina `/pedido` consome esse endpoint: o formulario cria o pedido, o
resumo exibe preco/tempo retornados pelo back e a lista permite ver historico e cancelar.

## Deploy na Vercel (frontend + APIs)

Este repositorio esta preparado para deploy unico na Vercel com:

- frontend React em `front`;
- funcoes serverless em `api/entrega_via_drone`, `api/contato_email`, `api/cadastro_usuario` e `api/gestao_de_pedidos`.

### Endpoints em producao

- `GET /api/entrega_via_drone/health`
- `GET /api/entrega_via_drone/rota?origemLat=...&origemLng=...&destinoLat=...&destinoLng=...`
- `GET /api/contato_email/health`
- `GET /api/contato_email/email/contato`
- `POST /api/contato_email/email/enviar`
- `GET /api/cadastro_usuario/health`
- `POST /api/cadastro_usuario/auth/cadastro`
- `POST /api/cadastro_usuario/auth/login`
- `GET /api/cadastro_usuario/auth/me`
- `PATCH /api/cadastro_usuario/auth/me`
- `PATCH /api/cadastro_usuario/auth/me/senha`
- `DELETE /api/cadastro_usuario/auth/me`
- `GET /api/gestao_de_pedidos/health`
- `POST /api/gestao_de_pedidos/pedidos`
- `GET /api/gestao_de_pedidos/pedidos`
- `GET /api/gestao_de_pedidos/pedidos/:id`
- `POST /api/gestao_de_pedidos/pedidos/:id/confirmar`
- `PATCH /api/gestao_de_pedidos/pedidos/:id`
- `DELETE /api/gestao_de_pedidos/pedidos/:id`
- `GET /api/gestao_de_pedidos/pedidos/:id/historico`

### Variaveis de ambiente na Vercel

Para habilitar envio real em `POST /api/contato_email/email/enviar`, configure no projeto Vercel:

- `SMTP_HOST` (opcional, padrao `smtp.gmail.com`)
- `SMTP_PORT` (opcional, padrao `587`)
- `SMTP_SECURE` (`true` ou `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `CONTACT_RECIPIENT` (opcional, padrao `entrega.drones@gmail.com`)

Para habilitar autenticacao em producao, configure as variaveis do banco MySQL e do JWT:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT` (opcional, padrao `3306`)
- `DB_CONNECTION_LIMIT` (opcional, padrao `10`)
- `JWT_SECRET`

O microsservico de pedidos (`api/gestao_de_pedidos`) usa as **mesmas** variaveis de banco
(`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`) — nao exige variaveis extras,
mas a tabela `pedidos` precisa existir no banco (criada por `back/banco/script.sql`).

Opcional para integracao com barramento externo:

- `BARRAMENTO_URL`

### URLs do frontend

No ambiente de desenvolvimento local, o frontend continua usando:

- `http://localhost:3002` para rota;
- `http://localhost:3003` para contato.
- `http://localhost:3004` para autenticacao.
- `http://localhost:3005` para pedidos.

Em producao, o frontend usa automaticamente as rotas serverless em `/api/...`.

Se quiser sobrescrever manualmente no frontend:

- `VITE_MAP_SERVICE_URL`
- `VITE_EMAIL_SERVICE_URL`
- `VITE_AUTH_SERVICE_URL`
- `VITE_PEDIDOS_ENTREGA_SERVICE_URL`

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento com Vite |
| `npm run build` | Constrói a aplicação para produção |
| `npm run preview` | Visualiza a build de produção localmente |
| `npm run lint` | Executa ESLint para verificar código |

## 📁 Estrutura do Projeto

```
src/
├── contexts/
│   └── ThemeContext.jsx          # Context para gerenciar tema claro/escuro
├── components/
│   ├── common/
│   │   ├── Button.jsx            # Botão reutilizável com variantes
│   │   ├── Container.jsx         # Wrapper com classe container Bootstrap
│   │   ├── Section.jsx           # Seção com styles personalizados
│   │   └── Icon.jsx              # Ícone FontAwesome wrapper
│   ├── header/
│   │   ├── Header.jsx            # Navbar com toggle tema e menu mobile
│   │   ├── NavLinks.jsx          # Links de navegação
│   │   └── Header.css
│   ├── sections/
│   │   ├── Hero.jsx              # Banner principal
│   │   ├── HowItWorks.jsx        # Seção "Como funciona"
│   │   ├── HowItWorksCard.jsx    # Card individual
│   │   ├── Benefits.jsx          # Seção de benefícios
│   │   ├── BenefitItem.jsx       # Item de benefício
│   │   ├── CTA.jsx               # Call to Action
│   │   └── sections.css
│   └── footer/
│       ├── Footer.jsx            # Rodapé com links
│       └── Footer.css
├── App.jsx                        # Componente raiz
├── App.css                        # Estilos globais
├── main.jsx                       # Entry point
└── assets/                        # Imagens e recursos estáticos
```

## 🎨 Componentes Principais

### Button
Botão reutilizável com suporte a variantes (primary, secondary, outline) e tamanhos (sm, md, lg).

```jsx
<Button variant="primary" size="md" onClick={() => {}}>
  Clique aqui
</Button>
```

### Icon
Wrapper para ícones FontAwesome.

```jsx
<Icon icon="shopping-cart" size="2x" className="text-primary" />
```

### Section
Componente de seção com background e estilos customizados.

```jsx
<Section id="benefits" background="light">
  Conteúdo aqui
</Section>
```

### Header
Navbar responsiva com toggle de tema e menu mobile.

### Footer
Rodapé estruturado com links e informações da empresa.

## 🌓 Modo Claro/Escuro

A aplicação oferece modo claro e escuro automático:

- **ThemeContext** gerencia o estado do tema globalmente
- Preferência salva em `localStorage` com chave `theme`
- Classe `dark` adicionada ao `document.documentElement`
- Atributo `data-bs-theme` controlado para Bootstrap

### Como usar a tema no seu componente:

```jsx
import { useTheme } from '../contexts/ThemeContext'

export default function MeuComponente() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button onClick={toggleTheme}>
      {isDark ? 'Modo Claro' : 'Modo Escuro'}
    </button>
  )
}
```

## 📝 Padrão de Commits

Seguimos o padrão de **Conventional Commits** para manter o histórico limpo e semântico.

### Formato:
```
<tipo>(<escopo>): <descrição>
```

### Tipos de commit:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações em documentação
- `style`: Alterações que não afetam lógica (formatting, semicolons, etc)
- `refactor`: Refatoração de código sem mudança de funcionalidade
- `perf`: Melhorias de performance
- `test`: Adição ou modificação de testes
- `chore`: Alterações de setup, dependências, etc

### Escopos usados:
- `interface_grafica`: Componentes visuais
- `setup`: Configuração inicial
- `componentes`: Componentes reutilizáveis
- `header_footer`: Header e Footer
- `contextos`: Contextos React
- `readme`: Documentação

### Exemplos:
```bash
git commit -m "feat(interface_grafica): implementar seção hero"
git commit -m "fix(header): corrigir alinhamento do menu mobile"
git commit -m "docs(readme): adicionar guia de uso"
git commit -m "chore(setup): atualizar dependências"
```

## 🏷️ Versionamento Semântico

Utilizamos **Semantic Versioning (SemVer)** com tags Git.

### Formato:
```
v<MAJOR>.<MINOR>.<PATCH>
```

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs

### Criando uma tag:
```bash
git tag -a v1.0.0 -m "Primeira versão da aplicação"
git push origin v1.0.0
```

### Exemplos de versiones:
- `v1.0.0`: Versão inicial completa
- `v1.1.0`: Novas seções adicionadas
- `v1.0.1`: Bug fix corrigido
- `v2.0.0`: Redesign completamente novo

## 🔨 Stack Tecnológico

| Tecnologia | Versão | Propósito |
|------------|--------|----------|
| React | 19.2.0 | Framework UI |
| Vite | 8.0.0 | Build tool |
| Bootstrap | 5.3.8 | Framework CSS |
| FontAwesome | 7.2.0 | Ícones |
| JavaScript | ES2020+ | Linguagem |

## 📱 Responsividade

A aplicação é totalmente responsiva:

- **Mobile**: < 576px
- **Tablet**: 576px - 991px
- **Desktop**: ≥ 992px

Todos os componentes utilizam classes Bootstrap para garantir adaptação em qualquer tamanho de tela.

## 🚀 Deployment

### Build para Produção:
```bash
npm run build
```

Isto gera a pasta `dist/` pronta para deploy em qualquer servidor estático.

### Opções de Hosting:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Heroku

## 📖 Documentação Adicional

Cada componente contém comentários JSDoc explicando:
- Props disponíveis
- Exemplos de uso
- Comportamento esperado

## 🐛 Troubleshooting

### Problema: Estilos Bootstrap não aparecem
**Solução**: Verifique se `bootstrap.min.css` está importado em `main.jsx`

### Problema: Ícones FontAwesome não aparecem
**Solução**: Confirm `@fortawesome/fontawesome-free/css/all.min.css` importado em `main.jsx`

### Problema: Modo escuro não funciona
**Solução**: Limpe o localStorage e recarregue a página

## 📞 Suporte

Para dúvidas ou sugestões, abra uma *issue* no repositório.

## 📄 Licença

Este projeto está sob a licença que consta no arquivo `LICENSE`.

---

## 👥 Contribuidores e Desenvolvedores

- Enzo Oliveira D’Onofrio
- Leonardo Souza Olivieri
- Arthur Gama Ruiz
- João Vitor Morimoto Sesma
- Pedro Wilian Palumbo Bevilacqua
- Felipe Fazia da Costa

### 👨‍🏫 Orientador

- Professor Rodrigo Bossini Tavares Moreira

