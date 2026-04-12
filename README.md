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

## Backend: Microsservicos

O projeto utiliza dois microsservicos Node.js no diretorio `back`:

1. `back/entrega_via_drone` (porta `3002`): calcula rota para rastreamento.
2. `back/contato_email` (porta `3003`): oferece duas formas de contato:
  - abrir cliente de e-mail com `mailto`;
  - enviar mensagem direto no site (backend envia para `entrega.drones@gmail.com`).

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

### Endpoints principais

- `GET http://localhost:3002/health`
- `GET http://localhost:3002/rota?origemLat=...&origemLng=...&destinoLat=...&destinoLng=...`
- `GET http://localhost:3003/health`
- `GET http://localhost:3003/email/contato`
- `POST http://localhost:3003/email/enviar`

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

