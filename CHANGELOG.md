# Histórico de versões

## v1.13.0 — 25/10/2026

- Acrescenta a tela inédita de Relatórios e Indicadores em Flutter Web, em `/relatorios/`, junto ao site React no mesmo Nginx.
- Integra login e validação de perfil ao backend, mantendo a sessão Flutter em memória.
- Adiciona indicadores por período, status e modalidade e exportação CSV autenticada no serviço de pedidos, sem novo microsserviço ou migração de banco.
- Preserva os endpoints antigos, a topologia Kubernetes, as credenciais e os dados persistidos.
- Inclui testes unitários, HTTP, widgets, navegador com download real, recuperação e reexecução do ambiente.
- Valida construção Linux ARM64 e AMD64; a execução do cluster é ARM64 no Docker Desktop.

Contratos e execução: [guia de relatórios](docs/frontend/relatorios.md). Evidências: [relatório de testes](docs/infra/kubernetes-testes.md).
