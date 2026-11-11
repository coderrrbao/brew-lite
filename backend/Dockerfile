FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
# Thêm --unsafe-perm để pnpm cho phép Prisma tải và compile engine
RUN pnpm install --frozen-lockfile --unsafe-perm

COPY . .
# Bổ sung step generate Prisma client trước khi build NestJS
RUN pnpm db:generate
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=4000
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --unsafe-perm

COPY --from=builder /app/dist ./dist
# Copy thêm thư mục Prisma generated client/schema nếu backend dùng runtime
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/main.js"]