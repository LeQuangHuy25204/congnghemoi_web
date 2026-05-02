# Ecommerce Microservices Backend

## Services
- api-gateway (port 5000)
- auth-service (port 5001)
- product-service (port 5002)
- cart-service (port 5003)
- order-service (port 5004)
- payment-service (port 5005)
- chatbot-service (port 5006)
- support-service (port 5007)

## 1) Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

## 2) Install dependencies
Run these commands from ecommerce-microservices:

```powershell
cd backend/service/auth-service; npm install; cd ../../..
cd backend/service/product-service; npm install; cd ../../..
cd backend/service/cart-service; npm install; cd ../../..
cd backend/service/order-service; npm install; cd ../../..
cd backend/service/payment-service; npm install; cd ../../..
cd backend/service/chatbot-service; npm install; cd ../../..
cd backend/service/support-service; npm install; cd ../../..
cd backend/api-gateway; npm install; cd ../..
```

## 3) Setup environment variables
Copy .env.example to .env in each service folder and update values if needed.

For chatbot Gemini integration, set these values in backend/service/chatbot-service/.env:
- GEMINI_API_KEY=<your_gemini_api_key>
- GEMINI_MODEL=gemini-2.0-flash

## 4) Run services
Open 8 terminals and run:

```powershell
cd backend/service/auth-service; npm run dev
cd backend/service/product-service; npm run dev
cd backend/service/cart-service; npm run dev
cd backend/service/order-service; npm run dev
cd backend/service/payment-service; npm run dev
cd backend/service/support-service; npm run dev
cd backend/service/chatbot-service; npm run dev
cd backend/api-gateway; npm run dev
```

## 5) API Summary
- Auth: POST /api/auth/register, POST /api/auth/login
- Product: GET /api/products, GET /api/products/:id, POST /api/products, PUT /api/products/:id, DELETE /api/products/:id
- Cart: GET /api/cart/:user_id, POST /api/cart/add, PUT /api/cart/update, DELETE /api/cart/remove
- Order: POST /api/orders, GET /api/orders/:user_id, PUT /api/orders/:id/status
- Payment:
  - POST /api/payment
  - GET /api/payment
  - GET /api/payment/:id
  - PATCH /api/payment/:id/status
  - GET /api/payment/:id/vietqr
- Chatbot: POST /api/chat
- Support: POST /api/support/ticket, GET /api/support/tickets/:user_id

All routes are exposed via api-gateway at http://localhost:5000

## 6) JWT Authentication Flow
1. Login via POST /api/auth/login and get token in response.
2. Send this header for protected APIs:

```http
Authorization: Bearer <your_token>
```

3. Protected routes at gateway:
- /api/cart/*
- /api/orders/*
- /api/payment/*
- /api/chat
- /api/support/*

Public routes:
- /api/auth/*
- /api/products/*

Important: JWT_SECRET in backend/api-gateway/.env must be the same as JWT_SECRET in backend/service/auth-service/.env.

## 7) Payment service notes

Copy `backend/service/payment-service/.env.example` to `.env` and fill credentials if you want real integrations:

- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL`
- `VIETQR_BANK_ID`, `VIETQR_ACCOUNT_NO`, `VIETQR_ACCOUNT_NAME`
- Optional: `VIETQR_CLIENT_ID`, `VIETQR_API_KEY` for full VietQR API response (`qrCode`, `qrDataURL`)

Method mapping in payment-service:

- `cod` -> local COD payment
- `momo` or `payos` -> PayOS payment link
- `bank` or `vietqr` -> VietQR

## 8) Run with Docker while keeping MongoDB on your machine

This repo now includes:
- `docker-compose.yml`
- `docker/backend.Dockerfile`
- `docker/frontend.Dockerfile`

The Docker setup does not create a MongoDB container. All services connect to the MongoDB server running on your host machine, so the same data remains visible in MongoDB Compass.

### Prepare environment

1. Copy the Docker env template:

```powershell
Copy-Item .env.docker.example .env
```

2. Make sure your local MongoDB server is running on the host machine.

3. If your MongoDB only listens on `127.0.0.1`, containers may not reach it. In that case, update MongoDB to listen on the host network as well, for example:
- `bindIp: 0.0.0.0`

Then restart MongoDB.

### Build and run

```powershell
docker compose up --build
```

App URLs:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:5000

### Notes

- Docker services use `host.docker.internal` to reach MongoDB on your machine.
- MongoDB Compass is only a client UI. The actual database server (`mongod`) still needs to be running locally or remotely.
- Uploaded product images are stored in `backend/public/img` on your host, not inside ephemeral containers.
