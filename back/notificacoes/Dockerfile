FROM node:24-alpine
WORKDIR /app/notificacoes
COPY notificacoes/package.json notificacoes/package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node notificacoes/ .
COPY --chown=node:node shared/ ../shared/
USER node
EXPOSE 3006
CMD ["node", "server.js"]
