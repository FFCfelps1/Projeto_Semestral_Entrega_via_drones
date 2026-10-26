FROM node:24-alpine AS build
WORKDIR /app
COPY front/package.json front/package-lock.json ./
RUN npm ci
COPY front/ .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.28-alpine
COPY front/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY front_mobile/build/web/ /usr/share/nginx/html/relatorios/
EXPOSE 8080
