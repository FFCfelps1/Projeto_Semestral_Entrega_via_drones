# Imagem do microsservico de rotas em Dart.
# Build em dois estagios: compila um executavel nativo (AOT) e copia apenas
# ele e as bibliotecas minimas de runtime para uma imagem vazia.

# --- Estagio 1: compilacao --------------------------------------------------
FROM dart:3.13 AS build
WORKDIR /app

# Copia so as dependencias primeiro para aproveitar o cache de camadas.
COPY pubspec.yaml pubspec.lock ./
RUN dart pub get

COPY . .
RUN dart pub get --offline \
 && dart compile exe bin/server.dart -o bin/server

# --- Estagio 2: execucao ----------------------------------------------------
FROM scratch
# /runtime traz libc, resolucao de DNS e certificados para chamar o OSRM via HTTPS.
COPY --from=build /runtime/ /
COPY --from=build /app/bin/server /app/bin/server

# Mesmo usuario sem privilegios exigido pelo securityContext do Kubernetes.
USER 1000:1000
EXPOSE 3002
CMD ["/app/bin/server"]
