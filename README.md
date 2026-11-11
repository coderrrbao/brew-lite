# BrewLite

BrewLite is a coffee shop ordering app with a **Next.js frontend** and a
**NestJS API backed by PostgreSQL through Prisma**. The frontend runs on port `3000`; the API runs on port
`4000`.

## Requirements

- Node.js 22 or later
- pnpm 9 or later
- Docker Desktop with Docker Compose (for the Docker workflow)

Enable pnpm through Corepack if it is not already available:

```powershell
corepack enable
```

## Run with Docker

From the project root:

```powershell
docker compose up --build
```

Open:

- Web app: <http://localhost:3000>
- API products: <http://localhost:4000/products>

Stop the containers with `Ctrl+C`. To stop and remove them later, run:

```powershell
docker compose down
```

### Run published images

The `Docker CI/CD` workflow builds both images for every pull request and
publishes them to GitHub Container Registry when changes are pushed to `main`.
To run the latest published images, set the repository owner and pull them:

```powershell
$env:FRONTEND_IMAGE='ghcr.io/<github-owner>/brewlite-frontend'
$env:BACKEND_IMAGE='ghcr.io/<github-owner>/brewlite-backend'
docker compose pull
docker compose up -d
```

For a deployment server, configure `DATABASE_URL`, `CORS_ORIGIN`, and
`JWT_SECRET` as environment variables instead of committing them. Use
`IMAGE_TAG=sha-<commit-sha>` to deploy an immutable image.

## Run locally

Install dependencies once in each app directory:

```powershell
Set-Location backend
pnpm install

Set-Location ..\frontend
pnpm install
```

Start the API and frontend in **two separate terminals**, from the project
root:

Terminal 1:

```powershell
Set-Location backend
pnpm start:dev
```

Terminal 2:

```powershell
Set-Location frontend
pnpm dev
```

Then open <http://localhost:3000>. The frontend uses
`http://localhost:4000` for browser-side API requests by default. For
server-side requests it uses `INTERNAL_API_URL` when set, otherwise it uses
the public API URL.

Copy `frontend/.env.example` to `frontend/.env.local` for the frontend:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
INTERNAL_API_URL=http://localhost:4000
```

The backend sample settings are in `backend/.env.example`. Copy it to
`backend/.env` for Prisma's `DATABASE_URL`. The NestJS app does not load `.env`
files automatically, so set `PORT` and `CORS_ORIGIN` in the backend process
environment when you need to override the defaults. Docker Compose already
sets these values in its service configuration.

When running in Docker Compose, `INTERNAL_API_URL` is set to
`http://backend:4000` so the frontend container can reach the API service.

## Features

- Browse the coffee menu, filter products, and view product details.
- Customize drink size and toppings, then manage the cart.
- Use the checkout flow and view order confirmation and order history.
- Use the login and registration screens.
- Validate promotion codes through the API and PostgreSQL.

## API endpoints

The NestJS API provides these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/products` | List products |
| `GET` | `/products/:id` | Get one product |
| `POST` | `/auth/register` | Register a user |
| `POST` | `/auth/login` | Log in a user |
| `POST` | `/orders` | Create an order |
| `GET` | `/orders/me` | Get the authenticated user's order history |
| `POST` | `/payments` | Process a payment |
| `GET` | `/promotions` | List active promotion codes |
| `POST` | `/promotions/validate` | Validate a promotion against a subtotal |

Product, order, payment, promotion, and user data are stored in PostgreSQL
through Prisma. The frontend does not fall back to local product data when the
API is unavailable, so configuration or database errors are surfaced instead
of being hidden by stale local data.

## Prisma and PostgreSQL

The backend has a PostgreSQL Prisma schema for users, products, orders, order
items, payments, and promotions. The API services read and write these models
through Prisma.

For local development, start PostgreSQL with Docker Compose:

```powershell
docker compose up -d db
Set-Location backend
pnpm install
pnpm db:validate
pnpm exec prisma migrate dev
```

Prisma reads `DATABASE_URL` from `backend/.env`; copy `backend/.env.example`
there and adjust the URL if needed. The migration command applies the
checked-in initial migration and generates the Prisma Client in
`backend/src/generated/prisma`.

To run the API and database in Docker Compose, use `docker compose up --build`.
The backend container uses the Compose database hostname and starts after
PostgreSQL is healthy.

## Project structure

```text
backend/                 NestJS API, modules, services, DTOs and Dockerfile
frontend/                Next.js App Router application and Dockerfile
docker-compose.yml       Runs the frontend and API together
test.js                  Standalone Open-Meteo weather-checking script
BrewLite-CongNghePhanMem.pdf
                         Project brief/reference document
```

Frontend API clients are grouped in `frontend/lib/api/` by backend module
(`auth`, `products`, `orders`, and `payments`). `frontend/lib/api.ts` re-exports
them as the stable import path used by the app.

## Useful commands

Run these commands from the corresponding app directory:

| Directory | Command | Description |
| --- | --- | --- |
| `frontend/` | `pnpm dev` | Start the Next.js development server |
| `frontend/` | `pnpm build` | Build the frontend for production |
| `frontend/` | `pnpm start` | Start the production frontend |
| `frontend/` | `pnpm lint` | Run the TypeScript check |
| `backend/` | `pnpm start:dev` | Start the NestJS API in watch mode |
| `backend/` | `pnpm build` | Build the API |
| `backend/` | `pnpm start` | Start the built API |

Repo 1 keeps the required Task 10 business checks beside their owning modules:
order state transitions are tested in the orders suite, stock protection is
implemented and tested in the products suite, while payment idempotency is
tested in the payments suite. Promotion and loyalty integration remains a
TODO until it is wired into the payment transaction.



```powershell
node test.js
```
