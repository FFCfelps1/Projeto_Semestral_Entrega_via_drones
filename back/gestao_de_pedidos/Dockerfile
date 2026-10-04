FROM node:24-alpine
WORKDIR /app/gestao_de_pedidos
COPY gestao_de_pedidos/package.json gestao_de_pedidos/package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node gestao_de_pedidos/ .
COPY --chown=node:node shared/ ../shared/
USER node
EXPOSE 3005
CMD ["node", "server.js"]
