# Lo trinh hoc tung buoc (Docker + MySQL + Microservice + CI/CD)

Tai lieu nay de ban test tung buoc, khong bi roi.

## Buoc 1: Hieu Docker + MySQL + 1 service

Muc tieu:
- Biet Docker dung de chay app dong nhat
- Biet service doc du lieu tu MySQL

Lenh chay:
```bash
npm run docker:reset
docker compose up -d --build mysql product-service
```

Cach test:
1. Mo `http://localhost:4001/health`
- Ky vong: tra ve `{"status":"ok","service":"product-service"}`

2. Mo `http://localhost:4001/products`
- Ky vong: luc dau la `[]` (vi chua co du lieu)

3. Tao 1 product bang Postman:
- Method: `POST`
- URL: `http://localhost:4001/products`
- Body JSON:
```json
{
  "name": "Ao thun basic",
  "slug": "ao-thun-basic",
  "price": 199000,
  "stock": 20,
  "imageUrl": "/images/product-1.jpeg",
  "isNew": true
}
```

4. Goi lai `GET http://localhost:4001/products`
- Ky vong: thay product vua tao

Neu pass 2 test tren: ban da hieu tac dung cua Docker + DB + service.

Tat buoc 1:
```bash
docker compose stop product-service mysql
```

## Buoc 2: Them web Next.js + 2 service

Muc tieu:
- Biet web goi du lieu qua API route
- Biet vi sao tach `product-service` va `order-service`

Lenh chay:
```bash
npm run docker:up
```

Cach test:
1. Mo `http://localhost:3000/api/products`
- Ky vong: web lay du lieu tu `product-service`

2. Mo `http://localhost:3000/api/orders`
- Ky vong: web lay du lieu tu `order-service`

3. Tao order:
```bash
curl -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -d '{"customerName":"Phuc","totalAmount":149.99}'
```

Tat buoc 2:
```bash
npm run docker:down
```

## Buoc 3: Hieu CI/CD (khong can chay local)

Doc 2 file:
- `.github/workflows/ci.yml`: tu dong kiem tra code khi push/PR
- `.github/workflows/cd.yml`: tu dong build image + deploy khi merge `main`

Y nghia:
- CI giup phat hien loi som
- CD giup deploy nhat quan, khong deploy thu cong

## Thu tu hoc de khong roi
1. Lam xong Buoc 1
2. Lam xong Buoc 2
3. Cuoi cung moi doc Buoc 3
