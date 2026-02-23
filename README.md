# News API

A robust, production-ready RESTful API built with Node.js and TypeScript where Authors publish content and Readers consume it. Features an Analytics Engine that records user engagement and processes view counts into daily reports.

## Features

- 🔐 Secure authentication with JWT
- 👥 Role-based access control (Author/Reader)
- 📝 Article management with soft deletion
- 📊 Analytics engine with daily aggregation
- 🔍 Advanced filtering and search
- 📄 Pagination support
- ✅ Comprehensive validation
- 🛡️ Security best practices

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: Bcrypt
- **Job Scheduling**: node-cron
- **Validation**: express-validator
- **Testing**: Jest & Supertest

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/yonathan001/News-API.git
cd News-API
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/news_api?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="24h"
PORT=3000
NODE_ENV="development"
```

### 4. Set up the database

Create a PostgreSQL database:

```bash
createdb news_api
```

Or using psql:

```sql
CREATE DATABASE news_api;
```

### 5. Run database migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start the server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Response Format

**Success Response:**
```json
{
  "Success": true,
  "Message": "Operation successful",
  "Object": { ... },
  "Errors": null
}
```

**Error Response:**
```json
{
  "Success": false,
  "Message": "Operation failed",
  "Object": null,
  "Errors": ["Error message 1", "Error message 2"]
}
```

**Paginated Response:**
```json
{
  "Success": true,
  "Message": "Data retrieved",
  "Object": [...],
  "PageNumber": 1,
  "PageSize": 10,
  "TotalSize": 50,
  "Errors": null
}
```

### Authentication Endpoints

#### 1. Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "author"
}
```

**Password Requirements:**
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character

**Roles:** `author` or `reader`

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "Success": true,
  "Message": "Login successful",
  "Object": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "author"
    }
  },
  "Errors": null
}
```

### Article Endpoints

#### 3. Create Article (Author Only)
```http
POST /api/articles
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Breaking News",
  "content": "This is the article content with at least 50 characters...",
  "category": "Tech",
  "status": "Published"
}
```

**Validation:**
- Title: 1-150 characters
- Content: Minimum 50 characters
- Status: `Draft` or `Published` (default: `Draft`)

#### 4. Get My Articles (Author Only)
```http
GET /api/articles/me?page=1&size=10
Authorization: Bearer <token>
```

#### 5. Update Article (Author Only)
```http
PUT /api/articles/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "Published"
}
```

#### 6. Delete Article (Author Only - Soft Delete)
```http
DELETE /api/articles/:id
Authorization: Bearer <token>
```

#### 7. Get Public Articles
```http
GET /api/articles?page=1&size=10&category=Tech&author=John&q=breaking
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `size`: Items per page (default: 10, max: 100)
- `category`: Filter by exact category
- `author`: Filter by author name (partial match)
- `q`: Search in article title (keyword)

#### 8. Get Article by ID
```http
GET /api/articles/:id
Authorization: Bearer <token> (optional)
```

**Note:** This endpoint tracks read events. Authentication is optional but recommended for tracking logged-in readers.

### Author Dashboard

#### 9. Get Author Dashboard
```http
GET /api/author/dashboard?page=1&size=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "Success": true,
  "Message": "Dashboard data retrieved successfully",
  "Object": [
    {
      "id": "uuid",
      "title": "Article Title",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "TotalViews": 150
    }
  ],
  "PageNumber": 1,
  "PageSize": 10,
  "TotalSize": 25,
  "Errors": null
}
```

## Analytics Engine

The analytics engine runs automatically via a cron job:

- **Schedule**: Daily at midnight GMT
- **Function**: Aggregates ReadLog entries into DailyAnalytics
- **Process**: Sums all reads for each article per day and upserts into the database

### Manual Analytics Trigger (for testing)

You can manually trigger analytics processing by importing and calling:

```typescript
import { runAnalyticsManually } from './jobs/analytics.job';
await runAnalyticsManually();
```

## Database Schema

### User Table
- `id`: UUID (Primary Key)
- `name`: String (alphabets and spaces only)
- `email`: String (unique, validated)
- `password`: String (hashed with bcrypt)
- `role`: Enum (author, reader)
- `createdAt`: Timestamp

### Article Table
- `id`: UUID (Primary Key)
- `title`: String (1-150 chars)
- `content`: Text (min 50 chars)
- `category`: String
- `status`: Enum (Draft, Published)
- `authorId`: UUID (Foreign Key)
- `createdAt`: Timestamp
- `deletedAt`: Timestamp (nullable, for soft delete)

### ReadLog Table
- `id`: UUID (Primary Key)
- `articleId`: UUID (Foreign Key)
- `readerId`: UUID (Foreign Key, nullable)
- `readAt`: Timestamp

### DailyAnalytics Table
- `id`: UUID (Primary Key)
- `articleId`: UUID (Foreign Key)
- `viewCount`: Integer
- `date`: Date
- Unique constraint on (articleId, date)

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Project Structure

```
News-API/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── article.controller.ts
│   │   └── author.controller.ts
│   ├── jobs/
│   │   └── analytics.job.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── article.routes.ts
│   │   ├── author.routes.ts
│   │   └── index.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── response.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   └── article.validator.ts
│   ├── app.ts
│   └── server.ts
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Technology Choices

### Why TypeScript?
- Type safety reduces runtime errors
- Better IDE support and autocomplete
- Easier refactoring and maintenance
- Industry standard for production Node.js apps

### Why Prisma?
- Type-safe database queries
- Excellent TypeScript integration
- Easy migrations and schema management
- Built-in connection pooling

### Why PostgreSQL?
- ACID compliance for data integrity
- Excellent support for complex queries
- Robust indexing capabilities
- Perfect for relational data (users, articles, analytics)

### Why Bcrypt?
- Industry-standard password hashing
- Built-in salt generation
- Configurable work factor for future-proofing

### Why node-cron?
- Simple and lightweight
- No external dependencies (like Redis)
- Perfect for scheduled tasks
- Easy to test and maintain

## Security Features

- ✅ Password hashing with bcrypt (12 rounds)
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma ORM)
- ✅ No stack traces in production errors
- ✅ CORS enabled
- ✅ Soft delete for data recovery

## Bonus Features

### 1. Rate Limiting for Read Tracking
To prevent abuse (e.g., refreshing 100 times in 10 seconds), implement:

```typescript
// Add to middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const readLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 3, // 3 requests per window
  message: 'Too many read requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to article read endpoint
router.get('/:id', readLimiter, optionalAuth, getArticleById);
```

### 2. Unit Tests
Tests are included for all HTTP endpoints with database mocking.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Author

Yonathan - [GitHub](https://github.com/yonathan001)
