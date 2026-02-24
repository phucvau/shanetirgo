# ShaneTirgo - Next.js + Microservices + Docker + MySQL

Neu ban moi hoc, di theo tai lieu tung buoc:
- `LEARN_STEP_BY_STEP.md`

Project này được tổ chức theo hướng e-commerce production baseline với:
- Next.js web app
- Microservices (`product-service`, `order-service`)
- MySQL 8
- Docker Compose cho local/prod self-hosted
- GitHub Actions CI/CD

## Architecture

- `web` (Next.js): frontend + API proxy (`/api/products`, `/api/orders`, `/api/categories`, `/api/collections`)
- `product-service`: quản lý truy vấn sản phẩm từ MySQL
- `order-service`: quản lý đơn hàng từ MySQL
- `category-service`: quản lý danh mục
- `collection-service`: quản lý bộ sưu tập
- `mysql`: database trung tâm

## Run Local bằng Docker

```bash
npm run docker:up
```

Reset data MySQL:
```bash
npm run docker:reset
```

Chi chay de hoc buoc 1 (chi MySQL + product-service):
```bash
docker compose up -d --build mysql product-service
```

Services:
- Web: `http://localhost:3000`
- Product service: `http://localhost:4001/health`
- Order service: `http://localhost:4002/health`
- Category service: `http://localhost:4003/health`
- Collection service: `http://localhost:4004/health`
- MySQL: `localhost:3307`

Test API qua Next.js:

```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/orders
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"Phuc","totalAmount":149.99}'
```

## Run Web không dùng Docker (tùy chọn)

```bash
npm ci
npm run dev
```

Copy env:

Server-side env khuyen dung cho web (Vercel/production):
- `PRODUCT_SERVICE_URL`
- `ORDER_SERVICE_URL`
- `CATEGORY_SERVICE_URL`
- `COLLECTION_SERVICE_URL`

Luu y:
- Khong dung `NEXT_PUBLIC_PRODUCT_API_URL` nua.
- Frontend va admin deu goi qua Next API `/api/*`.

## CI/CD

### CI (`.github/workflows/ci.yml`)
- Chạy khi `push` vào `main/develop` và khi tạo PR
- Steps:
  - install dependencies
  - lint + build web
  - build Docker image cho từng microservice

### CD (`.github/workflows/cd.yml`)
- Chạy khi merge vào `main` hoặc chạy manual (`workflow_dispatch`)
- Build + push image lên GHCR:
  - `web`
  - `product-service`
  - `order-service`
- Deploy qua SSH nếu có secrets:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_SSH_KEY`
  - `DEPLOY_PATH`

## Database

MySQL schema init nằm ở:
- `db/init/001_init.sql`

Bảng mẫu:
- `products`
- `orders`

## Cấu trúc chính

- `Dockerfile`
- `docker-compose.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/cd.yml`
- `app/api/products/route.ts`
- `app/api/orders/route.ts`
- `services/product-service/*`
- `services/order-service/*`
- `db/init/001_init.sql`
