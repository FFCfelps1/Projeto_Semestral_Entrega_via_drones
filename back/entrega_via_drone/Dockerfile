FROM node:24-alpine
WORKDIR /app/entrega_via_drone
COPY entrega_via_drone/package.json entrega_via_drone/package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node entrega_via_drone/ .
COPY --chown=node:node shared/ ../shared/
USER node
EXPOSE 3002
CMD ["node", "server.js"]
