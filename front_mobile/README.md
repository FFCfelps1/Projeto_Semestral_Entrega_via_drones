# SkySwift Flutter

Aplicativo completo da SkySwift: login e cadastro, pedidos (criação, confirmação, despacho do drone, entrega e cancelamento), simulação de rotas, notificações, relatórios com CSV e gestão da conta, com estado dos microsserviços. Todas as funcionalidades usam HTTP pelo proxy `/api/<serviço>/`. O código usa Flutter com Dart >=3.13.1; o ambiente foi validado com Flutter 3.47.1.

A entrega principal roda como Flutter Web no mesmo Nginx do React, em <http://localhost:8080/relatorios/>. Na raiz do repositório, execute `npm run k8s:up` e `npm run k8s:access`. É possível criar a conta no próprio app.

Para desenvolver contra o backend do Kubernetes:

```bash
flutter pub get
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8080
# Emulador Android: --dart-define=API_BASE_URL=http://10.0.2.2:8080
```

Testes locais: `flutter analyze` e `flutter test`. Os testes de widgets usam um backend simulado em `test/support/backend_falso.dart`. Os testes do navegador publicado ficam na raiz: `npm run test:browser`, com Google Chrome instalado e `k8s:access` aberto.

O token fica apenas em memória. Telas, fluxos e endpoints estão no [guia do aplicativo](../docs/frontend/mobile.md); contratos dos relatórios no [guia de relatórios](../docs/frontend/relatorios.md).
