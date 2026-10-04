FROM node:24-alpine
WORKDIR /app/cadastro_usuario
COPY cadastro_usuario/package.json cadastro_usuario/package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node cadastro_usuario/ .
COPY --chown=node:node shared/ ../shared/
USER node
EXPOSE 3004
CMD ["node", "server.js"]
