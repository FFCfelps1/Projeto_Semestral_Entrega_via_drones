# SkySwift Flutter

Login integrado ao backend e tela inédita de **Relatórios e Indicadores de Entregas**, com filtros, visualizações e download CSV. O código usa Flutter com Dart >=3.13.1; o ambiente foi validado com Flutter 3.47.1.

A entrega principal roda como Flutter Web no mesmo Nginx do React, em <http://localhost:8080/relatorios/>. Na raiz do repositório, execute `npm run k8s:up` e `npm run k8s:access`. Utilize uma conta cadastrada no site React.

Para desenvolver contra o backend do Kubernetes:

```bash
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8080
```

Testes locais: `flutter analyze` e `flutter test`. Os testes do navegador publicado ficam na raiz: `npm run test:browser`, com Google Chrome instalado e `k8s:access` aberto.

O token fica apenas em memória. A exportação desta entrega é validada no navegador; não há distribuição Android/iOS. Detalhes, contratos e compilação estão no [guia de relatórios](../docs/frontend/relatorios.md).
