FROM node:24-alpine
WORKDIR /app/barramento_eventos
COPY barramento_eventos/package.json barramento_eventos/package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node barramento_eventos/ .
COPY --chown=node:node shared/ ../shared/
USER node
EXPOSE 3001
CMD ["node", "server.js"]
