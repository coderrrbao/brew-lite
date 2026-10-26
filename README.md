# BrewLite

BrewLite is a coffee shop ordering demo with a **Next.js frontend** and a
**NestJS mock API**. The frontend runs on port `3000`; the API runs on port
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

The root `.env.example` contains the sample settings for both apps. Copy the
frontend values into `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
INTERNAL_API_URL=http://localhost:4000
```

The backend values are `PORT` and `CORS_ORIGIN`. The NestJS app does not load
`.env` files automatically, so set these variables in the backend process
environment when you need to override the defaults. Docker Compose already
sets the backend port and CORS origin in its service configuration.

When running in Docker Compose, `INTERNAL_API_URL` is set to
`http://backend:4000` so the frontend container can reach the API service.

## Features

- Browse the coffee menu, filter products, and view product details.
- Customize drink size and toppings, then manage the cart.
- Use the checkout flow and view order confirmation and order history.
- Use the login and registration screens.
- Validate promotion codes through the mock API.
- Continue browsing with local sample products if the API is unavailable.

## API endpoints

The NestJS API currently provides mock/demo endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/products` | List products |
| `GET` | `/products/:id` | Get one product |
| `POST` | `/auth/register` | Register a demo user |
| `POST` | `/auth/login` | Log in a demo user |
| `POST` | `/orders` | Create an order |
| `GET` | `/orders/me` | Get demo order history |
| `POST` | `/payments` | Process a demo payment |
| `GET` | `/promotions` | List active promotion codes |
| `POST` | `/promotions/validate` | Validate a promotion against a subtotal |

The API uses in-memory mock data; it is not connected to a database. Order
ownership and payment processing are for demonstration and are not production
security controls. The frontend also has local fallback data for product
catalog requests.

## Project structure

```text
backend/                 NestJS API, modules, services, DTOs and Dockerfile
frontend/                Next.js App Router application and Dockerfile
docker-compose.yml       Runs the frontend and API together
test.js                  Standalone Open-Meteo weather-checking script
BrewLite-CongNghePhanMem.pdf
                         Project brief/reference document
```

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



```powershell
node test.js
```
