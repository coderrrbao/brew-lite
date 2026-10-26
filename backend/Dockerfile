FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json ./
RUN pnpm install
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=4000
RUN corepack enable
COPY package.json ./
RUN pnpm install --prod
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/main.js"]
