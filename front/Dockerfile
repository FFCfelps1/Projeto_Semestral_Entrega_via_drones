FROM --platform=$BUILDPLATFORM ubuntu:24.04 AS flutter-build
ARG FLUTTER_VERSION=3.47.1
# SDK oficial, fixado na mesma versao usada na entrega do aplicativo.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git unzip xz-utils libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch "$FLUTTER_VERSION" https://github.com/flutter/flutter.git /opt/flutter
ENV PATH="/opt/flutter/bin:${PATH}"
RUN flutter config --no-analytics && flutter precache --web
WORKDIR /app/front_mobile
COPY front_mobile/pubspec.yaml front_mobile/pubspec.lock ./
RUN flutter pub get --enforce-lockfile
COPY front_mobile/ .
RUN flutter build web --release --no-pub --base-href /relatorios/ --no-web-resources-cdn

FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
COPY front/package.json front/package-lock.json ./
RUN npm ci
COPY front/ .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.28-alpine
COPY front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=flutter-build /app/front_mobile/build/web/ /usr/share/nginx/html/relatorios/
EXPOSE 8080
