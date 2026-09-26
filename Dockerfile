# Use npm so Railway does not reject the outdated bun.lock.
FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
