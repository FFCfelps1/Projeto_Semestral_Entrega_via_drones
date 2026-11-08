# Implantação final — 08/11/2026

Esta entrega reúne os scripts Docker/Kubernetes para implantar a solução final,
conforme o cronograma da parte 2 de ECM252/ECM516. Usa o site React, o aplicativo
Flutter 1.3.0-mobile e os microsserviços já entregues. O código das telas, das
regras de negócio e dos handlers da Vercel foi preservado.

## Relação com a apostila

Referência: **01_apostila_microsservicos.pdf**, professor Rodrigo Bossini.
Os números abaixo são os impressos no rodapé da apostila (o leitor PDF mostra
quatro páginas a mais).

| Conteúdo de aula | Aplicação no projeto |
| --- | --- |
| Docker Engine, CLI e Compose, p. 76; Dockerfile e imagens, seção 4.3.56 em diante | Cada serviço tem sua imagem; `compose.yaml` reúne os containers. |
| Configuração declarativa de Deployment, seção 4.3.69.2, pp. 117–118 | `infra/kubernetes/application/services.yaml` descreve réplicas, labels e containers. |
| Atualização da imagem, seção 4.3.70, pp. 119–124 | `k8s:build` gera uma tag por compilação; `k8s:up` aplica a tag e aguarda o rollout. |
| Service e encaminhamento de portas, seção 4.3.71, pp. 125–126 | Services expõem as portas dos containers; `k8s:access` publica o Nginx e o Mailpit localmente. |
| Comunicação interna com ClusterIP e nomes de serviços, seção 4.3.72, pp. 127–134 | APIs, MySQL e barramento se comunicam por DNS interno, sem `localhost` entre containers. |

A implantação mantém o acesso externo por Nginx e `kubectl port-forward`, já
adotado no projeto. MySQL com volume persistente, Secrets e sondas de saúde
complementam os exemplos de aula para atender às dependências da aplicação.

## O que esta entrega acrescenta

- O Dockerfile do frontend compila React e Flutter a partir dos fontes. Não
  depende de `front_mobile/build/web` gerado em outra máquina, nem de Flutter
  instalado no computador. O SDK oficial é fixado em 3.47.1 e o `pubspec.lock`
  é respeitado. A imagem final contém apenas Nginx e os arquivos publicados.
- Docker Compose executa MySQL, Mailpit, barramento, cinco microsserviços e
  frontend. O serviço de rotas usa a implementação Dart.
- A subida espera o banco ficar disponível e aplica o esquema existente antes
  de iniciar os serviços dependentes. As credenciais são geradas uma vez e
  reutilizadas; a parada mantém o volume MySQL.
- Os comandos npm escolhem Git Bash no Windows, inclusive quando o comando
  `bash` do sistema aponta para o WSL. Os scripts shell usam finais de linha LF.
- O teste da implantação verifica React, a versão atual do Flutter, seus assets,
  as seis APIs, as inscrições por DNS e a proteção JWT dos relatórios.
- O workflow `Implantacao final` reproduz build, parada/subida no Compose e
  implantação, integração, recuperação e persistência no Kubernetes temporário.

## Opção 1: Docker Compose

Pré-requisitos: **Git, Node.js 24 e Docker Desktop com containers Linux**.
Kubernetes e SDK Flutter não são necessários para esta opção. A primeira
compilação baixa imagens, SDK e dependências e pode demorar alguns minutos.

Na raiz do clone, pelo PowerShell, Git Bash ou terminal Unix:

```sh
npm run docker:check
npm run docker:up
```

Abra o site em <http://localhost:8080>, o aplicativo Flutter em
<http://localhost:8080/relatorios/> e os e-mails de teste em
<http://localhost:8025>.

| Comando | Resultado |
| --- | --- |
| `npm run docker:build` | Compila as sete imagens da aplicação. |
| `npm run docker:up` | Compila, inicia infraestrutura, aplica esquema e verifica a solução. |
| `npm run docker:up -- --no-build` | Reutiliza as imagens e os dados locais. |
| `npm run docker:status` | Mostra os containers e sua saúde. |
| `npm run docker:logs -- frontend` | Acompanha os logs do serviço escolhido. |
| `npm run docker:test` | Repete as verificações HTTP, sem alterar dados. |
| `npm run docker:down` | Encerra containers e rede, preservando banco e credenciais. |

As credenciais ficam em `.docker-local/secrets.env`, ignorado pelo Git. Preserve
esse arquivo junto com o volume `skyswift_mysql-data`. Se o volume existir e o
arquivo desaparecer, o script exige a recuperação das credenciais antes de subir.
Compose e Kubernetes usam bancos e credenciais independentes.

Para mudar as portas no PowerShell, use `$env:APP_PORT = '8081'` e
`$env:MAIL_PORT = '8026'` antes de `npm run docker:up`. No Git Bash/Unix, use
`APP_PORT=8081 MAIL_PORT=8026 npm run docker:up`. Só Nginx e a interface do Mailpit
publicam portas, vinculadas a `127.0.0.1`.

## Opção 2: Kubernetes

Habilite Kubernetes no Docker Desktop, com **kind, um nó e containerd**, e tenha
`kubectl` disponível. No Windows, instale Git for Windows com Git Bash.

```sh
npm run k8s:check
npm run k8s:up
npm run k8s:access
```

Os endereços são os mesmos do Compose. O último comando deve continuar aberto.
Encerre o Compose antes de usar essas portas no Kubernetes. Para reimplantar as
imagens já compiladas, use `npm run k8s:up -- --no-build`.

`npm run k8s:down` preserva o PVC e as credenciais. O contexto continua sendo
`docker-desktop`, o namespace `skyswift` e a configuração local fica em
`.kubernetes-local/`. Consulte o [guia Kubernetes](kubernetes.md) para detalhes.

## Validação

```sh
npm ci
npm run test:infra
npm test
npm run k8s:test
npm run k8s:test -- --lifecycle
```

Os dois últimos comandos exigem Kubernetes com a aplicação pronta. Testam os
fluxos reais de cadastro, pedidos, eventos, notificações, e-mail e relatórios,
reinícios e preservação de dados em duas reaplicações e um ciclo de parada/subida.
Os testes de infraestrutura usam um servidor HTTP simulado para verificar que o
diagnóstico detecta Flutter desatualizado, API indisponível e assets incorretos;
eles não substituem a execução nos containers.

O workflow em `.github/workflows/implantacao.yml` usa um runner descartável,
reaproveita no Kubernetes as imagens testadas no Compose e não publica imagens
em registries nem altera ambientes externos. Os resultados de cada execução
ficam na aba **Actions** do repositório.

## Limites do ambiente

Esta configuração atende à demonstração local. Mailpit captura e-mails de teste;
o mapa e os provedores de rotas continuam dependendo de serviços externos.
Notificações globais e eventos sem fila durável mantêm o comportamento das
entregas anteriores. Aplicativos Android/iOS são clientes do backend e não são
executados dentro do Kubernetes; a imagem Nginx publica a compilação Flutter Web.

Referências complementares: [builds em estágios do Docker](https://docs.docker.com/build/building/multi-stage/),
[ordem de inicialização no Compose](https://docs.docker.com/compose/how-tos/startup-order/)
e [SDK oficial Flutter](https://docs.flutter.dev/install/archive).
