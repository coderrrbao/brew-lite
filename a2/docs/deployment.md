# Deployment Guide

## Kiến trúc triển khai

BrewLite sử dụng kiến trúc 3 tầng:

- **Frontend (web)**: Next.js chạy ở chế độ standalone, phục vụ qua port 3000
- **Backend (api)**: NestJS API server, phục vụ qua port 4000
- **Database**: PostgreSQL 16

## Triển khai bằng Docker Compose (Local)

```bash
# Clone repository
git clone <repo-url>
cd brewlite

# Copy environment file
cp .env.example .env
# Chỉnh sửa .env với các giá trị thích hợp

# Build và chạy
docker compose up --build
```

Truy cập:
- Web app: http://localhost:3000
- API: http://localhost:4000
- Health check: http://localhost:4000/health

## Triển khai Production

### Yêu cầu
- Docker và Docker Compose
- PostgreSQL database (managed hoặc self-hosted)
- Reverse proxy (nginx/Caddy) cho HTTPS

### Biến môi trường Production

| Biến | Mô tả | Bắt buộc |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret key cho JWT (≥32 bytes) | ✅ |
| `PORT` | Port API server (mặc định: 4000) | ❌ |
| `CORS_ORIGIN` | URL frontend cho CORS | ✅ |
| `NEXT_PUBLIC_API_URL` | URL API công khai | ✅ |
| `INTERNAL_API_URL` | URL API nội bộ (container-to-container) | ❌ |

### Database Migration

```bash
cd apps/api
pnpm exec prisma migrate deploy
```

### Health Check

```bash
curl http://localhost:4000/health
```

### Rollback

1. Xác định phiên bản cần rollback từ Git tags/releases
2. Checkout phiên bản đó: `git checkout <tag>`
3. Rebuild và deploy: `docker compose up --build -d`
4. Rollback database nếu cần: kiểm tra migration history

## CI/CD Pipeline

```
Push/Tag → Lint & Test → Build → Docker Image → Push Registry → Deploy → Smoke Test
```

Xem chi tiết tại `.github/workflows/backend-ci.yml`.
