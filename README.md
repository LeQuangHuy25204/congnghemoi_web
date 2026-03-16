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
- Payment: POST /api/payment
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
