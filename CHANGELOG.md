# Histórico de versões

## 1.4.1-infra — 08/11/2026

- Impede que senhas e segredo JWT de outro projeto no terminal substituam as credenciais persistidas do Docker Compose.
- Acrescenta validação independente de React, Dart, Flutter e equivalência HTTP Node/Dart, além dos handlers Vercel.
- Amplia a demonstração de navegador com login, criação, confirmação, histórico e cancelamento de pedido no React e renderização em celular.
- Preserva o código da aplicação e os pacotes das entregas anteriores.

## 1.4.0-infra — 08/11/2026

- Implanta a solução final usando os serviços e o aplicativo Flutter 1.3.0-mobile das entregas anteriores.
- Compila React e Flutter dentro do Docker, sem depender de SDK ou build Flutter no computador.
- Adiciona Docker Compose com inicialização do esquema, credenciais locais e volume persistente MySQL.
- Ajusta a execução dos scripts Kubernetes no Windows para selecionar Git Bash e preservar finais de linha LF.
- Verifica assets e versão do Flutter, prontidão das seis APIs, DNS interno, inscrições no barramento e JWT.
- Acrescenta testes dos scripts e workflow de validação Docker/Kubernetes com integração, recuperação e persistência.

Guia: [implantação final de 08/11](docs/infra/entrega-08-11.md).

## 1.3.0-mobile — 01/11/2026

- Completa o aplicativo Flutter: interface gráfica para todas as funcionalidades do backend, sempre por HTTP via proxy `/api`.
- Pedidos: lista do usuário com filtro por status, criação com prévia de preço e prazo, detalhe com histórico, confirmação, processamento, despacho do drone (rota no serviço Dart com `pedidoId`, que move o pedido para `em_rota` pelo barramento), entrega e cancelamento.
- Rotas: simulação a partir do centro logístico, com distância, tempo, desenho do trajeto e atalho para o OpenStreetMap.
- Notificações: central com contador de não lidas na navegação e leitura individual ou em lote.
- Conta: cadastro no próprio app, edição de perfil, troca de senha, exclusão de conta, contato por e-mail (com alternativa `mailto` sem SMTP) e estado dos seis microsserviços e do barramento.
- Navegação adaptativa (barra inferior no celular, trilho lateral em telas largas); relatórios passam a ser uma das áreas. Android com permissão de rede e HTTP local.
- Testes de widgets com backend simulado cobrindo os fluxos ponta a ponta; teste de navegador ajustado à nova navegação. Sem mudanças no backend, no Nginx ou no Kubernetes.

Guia: [aplicativo Flutter](docs/frontend/mobile.md).

## 1.2.0-mobile — 25/10/2026

- Acrescenta a tela inédita de Relatórios e Indicadores em Flutter Web, em `/relatorios/`, junto ao site React no mesmo Nginx.
- Integra login e validação de perfil ao backend, mantendo a sessão Flutter em memória.
- Adiciona indicadores por período, status e modalidade e exportação CSV autenticada no serviço de pedidos, sem novo microsserviço ou migração de banco.
- Preserva os endpoints antigos, a topologia Kubernetes, as credenciais e os dados persistidos.
- Inclui testes unitários, HTTP, widgets, navegador com download real, recuperação e reexecução do ambiente.
- Valida construção Linux ARM64 e AMD64; a execução do cluster é ARM64 no Docker Desktop.

Contratos e execução: [guia de relatórios](docs/frontend/relatorios.md). Evidências: [relatório de testes](docs/infra/kubernetes-testes.md).
