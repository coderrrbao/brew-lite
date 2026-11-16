# BrewLite

BrewLite là ứng dụng đặt đồ uống coffee shop với **Next.js frontend** (mobile-first/PWA) và **NestJS API backend**, lưu trữ dữ liệu trong **PostgreSQL**.

## Yêu cầu

- Node.js 22 trở lên
- pnpm 9 trở lên
- Docker Desktop với Docker Compose

Kích hoạt pnpm qua Corepack nếu chưa có:

```bash
corepack enable
```

## Cấu trúc repository

```
brewlite/
├── apps/
│   ├── web/                    # Next.js mobile-first/PWA
│   └── api/                    # NestJS API
├── docs/
│   ├── requirements/           # Task 1: SRS, stakeholder, phạm vi
│   ├── diagrams/               # Task 2: Activity, Sequence, Class diagrams
│   ├── architecture/           # Task 3: Kiến trúc, quyết định thiết kế
│   ├── traceability-matrix.md  # Ma trận truy vết
│   └── deployment.md           # Hướng dẫn triển khai
├── tests/                      # Integration/E2E tests
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Chạy web, API và database
├── .env.example                # Biến môi trường mẫu
└── README.md
```

## Chạy với Docker

```bash
# Copy file biến môi trường
cp .env.example .env

# Build và chạy toàn bộ hệ thống
docker compose up --build
```

Truy cập:
- Web app: <http://localhost:3000>
- API: <http://localhost:4000/products>
- Health check: <http://localhost:4000/health>

Dừng containers: `Ctrl+C`, sau đó `docker compose down`.

## Chạy local (development)

### 1. Cài dependencies

```bash
cd apps/api
pnpm install

cd ../web
pnpm install
```

### 2. Thiết lập database

```bash
# Khởi động PostgreSQL
docker compose up -d db

# Chạy migrations
cd apps/api
cp .env.example .env
pnpm db:generate
pnpm exec prisma migrate dev
pnpm db:seed
```

### 3. Khởi động ứng dụng

Terminal 1 - API:
```bash
cd apps/api
pnpm start:dev
```

Terminal 2 - Web:
```bash
cd apps/web
pnpm dev
```

Mở <http://localhost:3000>.

### Biến môi trường

Copy `.env.example` ra `.env` ở root, hoặc thiết lập riêng trong `apps/api/.env` và `apps/web/.env.local`:

**API** (`apps/api/.env`):
```dotenv
PORT=4000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-bytes
DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite?schema=public
```

**Web** (`apps/web/.env.local`):
```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
INTERNAL_API_URL=http://localhost:4000
```

## Tính năng

- Xem menu cà phê, lọc sản phẩm, xem chi tiết sản phẩm
- Tùy chọn size và topping, quản lý giỏ hàng
- Luồng thanh toán, xác nhận đơn và lịch sử đơn hàng
- Đăng ký, đăng nhập (JWT authentication)
- Kiểm tra mã khuyến mãi
- Fallback dữ liệu local khi API không khả dụng

## API Endpoints

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/products` | Danh sách sản phẩm |
| `GET` | `/products/:id` | Chi tiết sản phẩm |
| `POST` | `/auth/register` | Đăng ký |
| `POST` | `/auth/login` | Đăng nhập |
| `POST` | `/orders` | Tạo đơn hàng |
| `GET` | `/orders/me` | Lịch sử đơn hàng |
| `PATCH` | `/orders/:id/status` | Cập nhật trạng thái đơn (Staff) |
| `POST` | `/payments` | Xử lý thanh toán |
| `GET` | `/promotions` | Danh sách khuyến mãi |
| `POST` | `/promotions/validate` | Kiểm tra mã khuyến mãi |
| `GET` | `/health` | Health check |

## Kiểm thử

```bash
# Unit tests (API)
cd apps/api
pnpm test

# E2E tests (API)
pnpm test:e2e

# E2E tests (Frontend - Playwright)
cd apps/web
pnpm test:e2e
```

## Build & Deploy

Xem hướng dẫn chi tiết tại [docs/deployment.md](docs/deployment.md).

```bash
# Build tất cả
pnpm -r build

# Build Docker images
docker compose build

# Deploy production
docker compose up -d
```

## Rollback

1. Xác định version cần rollback từ Git tags
2. `git checkout <tag>`
3. `docker compose up --build -d`
4. Kiểm tra health: `curl http://<host>:4000/health`

## Các lệnh hữu ích

| Thư mục | Lệnh | Mô tả |
|---|---|---|
| `apps/web/` | `pnpm dev` | Chạy Next.js dev server |
| `apps/web/` | `pnpm build` | Build frontend production |
| `apps/web/` | `pnpm lint` | Kiểm tra TypeScript |
| `apps/api/` | `pnpm start:dev` | Chạy NestJS ở chế độ watch |
| `apps/api/` | `pnpm build` | Build API |
| `apps/api/` | `pnpm test` | Chạy unit tests |
| `apps/api/` | `pnpm test:e2e` | Chạy E2E tests |
| `apps/api/` | `pnpm db:migrate` | Chạy database migration |
| `apps/api/` | `pnpm db:seed` | Seed dữ liệu mẫu |
