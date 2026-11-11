FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

# Cho phép pnpm tự động chạy build scripts cho prisma
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="${PATH}:${PNPM_HOME}"

COPY package.json pnpm-lock.yaml ./

# Bật cấu hình pnpm cho phép build dependencies của Prisma
RUN pnpm config set approve-builds true || true
RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma Client & Build dự án NestJS
RUN npx prisma generate
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=4000

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/main.js"]