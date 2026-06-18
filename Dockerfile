# syntax=docker/dockerfile:1

# ---- deps: cài dependencies ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate Prisma + build Next (standalone) ----
# Cũng dùng làm image chạy migration (có sẵn Prisma CLI + tsx + source).
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Build không truy vấn DB (mọi page force-dynamic) — dùng URL giả cho qua bước generate/build.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=finance"
RUN npm run build

# ---- runner: image chạy app gọn nhẹ ----
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next standalone output (đã gồm node_modules tối thiểu + server.js)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Prisma client engine (đảm bảo có khi chạy)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
