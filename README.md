# E-commerce API

A robust RESTful API for e-commerce built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

### Authentication

- User registration
- JWT login
- Authentication middleware for protected routes

### Products

- Product registration
- Paginated listing
- Search by ID
- Product updates
- Product deletion
- Stock management

### Cart

- Add products
- Remove products
- Clear cart
- Calculate total
- Apply discounts

### Orders

- Create order from cart
- List user orders
- Search order by ID
- Update status
- Status history
- Cancel order

### Discount System

- Percentage or fixed amount coupons
- User usage validation
- Validity control
- Minimum value for application
- Usage limits

## 🛠️ Technologies

- Node.js
- Express
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT for authentication
- BCrypt for encryption
- Docker & Docker Compose

## 📋 Prerequisites

- Node.js (v14+)
- PostgreSQL
- NPM or Yarn
- Docker & Docker Compose (for containerized deployment)

## 🔧 Installation

### Using Docker (Recommended)

1. Clone the repository

```bash
git clone https://github.com/renanbmello/api-ecommerce/tree/main
```

2. Start the containers

```bash
docker compose up -d
```

The API will be available at `http://localhost:3000`

### Manual Installation

1. Clone the repository

```bash
git clone https://github.com/renanbmello/api-ecommerce/tree/main
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

4. Set up the database

```bash
npx prisma migrate dev
```

5. Start the server

```bash
npm run dev
```

## 🗄️ Database Structure

### Main Entities:

- User
- Product
- Cart
- Order
- Discount
- OrderStatusHistory

## 🔒 Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the header for protected routes:

```bash
Authorization: Bearer <token>
```

## 📚 API Documentation

### Authentication

- POST /auth/register - User registration
- POST /auth/login - User login

### Products

- GET /products - List all products
- GET /products/:id - Get product by ID
- POST /products - Create new product
- PUT /products/:id - Update product
- DELETE /products/:id - Remove product
- PATCH /products/:id/stock - Update stock

### Cart

- GET /cart - View cart
- POST /cart/products - Add product
- DELETE /cart/products/:id - Remove product
- DELETE /cart - Clear cart
- POST /cart/discount - Apply discount
- GET /cart/total - Calculate total

### Orders

- POST /orders - Create order
- GET /orders - List orders
- GET /orders/:id - Get order
- PUT /orders/:id - Update order
- DELETE /orders/:id - Cancel order

## 🐳 Docker Configuration

### Dockerfile

The project includes a Dockerfile that:

- Uses Node.js 18 Alpine as base image
- Sets up the working environment
- Installs necessary dependencies
- Configures security measures

### Docker Compose

The docker-compose.yml file sets up:

- Backend service (Node.js application)
- PostgreSQL database
- Volume mappings for persistence
- Environment variables
- Automatic database migrations

## 🔐 Environment Variables

env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
PORT=3000

## 🧪 Testing

```bash
npm run test
```

```bash
npm run test:coverage
```
