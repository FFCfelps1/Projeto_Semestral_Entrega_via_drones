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

# Referência Técnica de Código - SkySwift

Este documento fornece um detalhamento técnico exaustivo de cada módulo e arquivo do projeto, organizado por estrutura de diretórios com cabeçalhos padronizados.

---

## 📂 /api - Funções Serverless (Vercel)
**Descrição**: Implementação dos microsserviços adaptada para o ambiente Vercel.
**Papel**: Atuar como a camada de API de produção, utilizando persistência em SQLite ou chamadas externas.

### 📄 `barramento_eventos/handler.js`
- **Função**: Hub central de mensagens.
- **Funcionalidades**:
    - Gerenciamento de inscrições de serviços.
    - Distribuição de eventos via broadcast HTTP.
- **Principais Endpoints**: `GET /inscricoes`, `POST /inscricao`, `POST /eventos`.

### 📄 `cadastro_usuario/_handlers/cadastro.js`
- **Função**: Processamento de novos registros.
- **Funcionalidades**: Criação de novos usuários com criptografia de senha.
- **Segurança**: Validação de campos obrigatórios e unicidade de e-mail.

---

## 📂 /back - Microsserviços Express
**Descrição**: Versão baseada em Node.js/Express para execução local or em containers.
**Papel**: Core logístico e administrativo do sistema.

### 📄 `barramento_eventos/server.js`
- **Função**: Servidor de eventos persistente.
- **Funcionalidades**: Mantém um histórico de eventos em memória e gerencia a lógica de retransmissão para serviços ativos.

### 📄 `cadastro_usuario/server.js`
- **Função**: Serviço de Identidade e Acesso.
- **Funcionalidades**:
    - Autenticação via JWT.
    - Integração direta com MySQL.
    - Publicação de eventos de ciclo de vida do usuário.

### 📄 `gestao_de_pedidos/routes/pedidos.js`
- **Função**: Controlador principal de fluxo de pedidos.
- **Funcionalidades**:
    - CRUD completo de encomendas.
    - Atualização de status de entrega.
    - Filtros por ID de usuário e data.

---

## 📂 /front/src - Interface React
**Descrição**: Aplicação Single Page (SPA) moderna.
**Papel**: Interface do usuário final para solicitar e monitorar entregas.

### 📄 `App.jsx`
- **Função**: Root Component e Router.
- **Funcionalidades**: 
    - Orquestração de rotas dinâmicas.
    - Sincronização de tema (Dark/Light).
    - Validação de sessão persistente no `localStorage`.

### 📄 `PedidoPage.jsx`
- **Função**: Workspace de Pedidos.
- **Funcionalidades**:
    - Formulário interativo para novos pedidos.
    - Visualização de lista de pedidos ativos.
    - Integração com serviço de coordenadas para entrega via drone.

### 📄 `DroneTrackingSection.jsx`
- **Função**: Painel de Monitoramento.
- **Funcionalidades**:
    - Exibição de mapas e trajetórias simuladas.
    - Feedback visual de status (Pendente, Em Trânsito, Entregue).

---

## 📂 /back/gestao_de_pedidos/middleware
**Descrição**: Camadas de processamento intermediário de requisições.

### 📄 `validarPedido.js`
- **Função**: Guardião de Integridade de Dados.
- **Funcionalidades**:
    - Sanitização de inputs de novos pedidos.
    - Verificação de campos como coordenadas GPS e descrição do produto.

---

## 📂 /docs/slides
**Descrição**: Materiais de apresentação e documentação visual.

### 📄 `slides.tex`
- **Função**: Fonte LaTeX para apresentação do projeto.
- **Funcionalidades**: Define a estrutura visual e os tópicos da defesa semestral do projeto.

---

## 🛠️ Tecnologias e Dependências
- **Frontend**: React, Vite, Axios, Bootstrap.
- **Backend**: Node.js, Express, MySQL2, SQLite3.
- **Comunicação**: Event-Driven Architecture via HTTP Webhooks.
- **Autenticação**: JWT (JSON Web Tokens) e BcryptJS.
