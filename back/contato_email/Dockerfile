FROM node:24-alpine
WORKDIR /app/contato_email
COPY contato_email/package.json contato_email/package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node contato_email/ .
COPY --chown=node:node shared/ ../shared/
USER node
EXPOSE 3003
CMD ["node", "server.js"]
