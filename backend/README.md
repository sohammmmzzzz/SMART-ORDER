# Backend - FastAPI Application

## Setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. **Run the application:**
```bash
# Development mode (with auto-reload)
uvicorn main:app --reload

# Or using Python
python main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/verify-token` - Verify JWT token
- `POST /auth/logout` - User logout

### Orders (`/orders`)
- `POST /orders/create` - Create new order (user only)
- `GET /orders/` - Get orders (filtered by role)
- `GET /orders/pending` - Get pending orders (pantry/admin)
- `PUT /orders/{order_id}/status` - Update order status (pantry/admin)
- `GET /orders/history` - Get order history

### Menu (`/menu`)
- `GET /menu/items` - Get all menu items
- `GET /menu/categories` - Get menu categories
- `GET /menu/items/{category}` - Get items by category

### Admin (`/admin`)
- `GET /admin/analytics` - Get analytics dashboard data
- `GET /admin/orders/all` - Get all orders with filters
- `GET /admin/users` - Get all users
- `GET /admin/stats/summary` - Get summary statistics

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration and settings
├── database.py          # Database connection manager
├── models.py            # Pydantic models
├── auth.py              # Authentication utilities
├── routers/             # API route handlers
│   ├── __init__.py
│   ├── auth.py
│   ├── orders.py
│   ├── menu.py
│   └── admin.py
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variables template
└── README.md
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. Login via `/auth/login` to receive a JWT token
2. Include the token in subsequent requests:
   ```
   Authorization: Bearer <your_token>
   ```

## Role-Based Access

- **User**: Can place orders and view their own orders
- **Pantry**: Can view all orders, mark orders complete
- **Admin**: Full access to all endpoints including analytics

## Error Handling

All endpoints return standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a `detail` field with a description.

## Development

### Testing the API

Use the interactive Swagger documentation at http://localhost:8000/docs

### Default Test Users

After running the database schema:

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | admin |
| pantry1 | password123 | pantry |
| user1 | password123 | user |

## Production Deployment

1. Set `ENVIRONMENT=production` in `.env`
2. Configure proper CORS origins in `main.py`
3. Use a production ASGI server (e.g., Gunicorn with Uvicorn workers)
4. Set up HTTPS/SSL certificates
5. Configure rate limiting and security headers
6. Use environment-specific secrets

Example production command:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
