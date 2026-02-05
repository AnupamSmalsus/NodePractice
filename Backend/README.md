# 🔗 URL Shortener API

A production-ready URL shortener service built with Node.js, Express.js, and MongoDB. Features include rate limiting, URL expiration, custom aliases, analytics, and comprehensive error handling.

## 📋 Features

- ✅ **Short URL Generation** - Create short URLs using nanoid (7-character codes)
- ✅ **Custom Aliases** - Support for custom short URL aliases
- ✅ **URL Analytics** - Track visit counts and creation dates
- ✅ **URL Expiration** - Automatic expiration support for short URLs
- ✅ **Duplicate Handling** - Returns existing short URL for duplicate requests
- ✅ **Rate Limiting** - Prevents abuse with configurable rate limits
- ✅ **Input Validation** - Validates URL format and custom aliases
- ✅ **Error Handling** - Comprehensive error handling with proper HTTP status codes
- ✅ **Request Logging** - HTTP request logging with Morgan
- ✅ **MVC Architecture** - Clean, maintainable code structure

---

## 📁 Project Structure

```
RESTApi/
├── config/
│   └── db.js              # MongoDB connection configuration
├── controllers/
│   └── urlController.js   # URL operations (create, redirect, analytics)
├── middlewares/
│   ├── errorHandler.js    # Centralized error handling
│   ├── logger.js          # HTTP request logging (Morgan)
│   ├── rateLimiter.js     # Rate limiting middleware
│   └── validateUrl.js     # URL validation middleware
├── models/
│   └── Url.js             # Mongoose URL schema
├── routes/
│   ├── redirectRoute.js   # Redirect route (/:shortId)
│   └── urlRoutes.js       # API routes (/api/url)
├── utils/
│   └── generateShortCode.js # Short code generation utility
├── .env                   # Environment variables
├── .gitignore             # Git ignore file
├── package.json           # Dependencies and scripts
├── server.js              # Application entry point
└── README.md              # Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v16 or higher
- **MongoDB** v5 or higher (local or cloud instance)
- **npm** or **yarn**

### Installation

1. **Clone the repository** (or navigate to project directory):
   ```bash
   cd /path/to/RESTApi
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   
   Edit the `.env` file with your settings:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/url-shortener
   BASE_URL=http://localhost:3000
   DEFAULT_EXPIRY_DAYS=7
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Run the server**:
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Verify the server is running**:
   ```bash
   curl http://localhost:3000/health
   ```

---

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "URL Shortener API is running",
  "timestamp": "2024-02-04T12:00:00.000Z"
}
```

---

### Create Short URL

```http
POST /api/url
Content-Type: application/json
```

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `originalUrl` | string | Yes | The long URL to shorten (must include http/https) |
| `customAlias` | string | No | Custom alias (3-20 alphanumeric chars, hyphens, underscores) |
| `expiresIn` | number | No | Days until expiration (1-365) |

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/url \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://www.example.com/very/long/url/path",
    "customAlias": "my-link",
    "expiresIn": 30
  }'
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Short URL created successfully",
  "data": {
    "originalUrl": "https://www.example.com/very/long/url/path",
    "shortUrl": "http://localhost:3000/my-link",
    "shortCode": "my-link",
    "createdAt": "2024-02-04T12:00:00.000Z",
    "expiresAt": "2024-03-05T12:00:00.000Z"
  }
}
```

**Duplicate URL Response (200 OK):**
```json
{
  "success": true,
  "message": "URL already shortened",
  "data": {
    "originalUrl": "https://www.example.com/very/long/url/path",
    "shortUrl": "http://localhost:3000/abc1234",
    "shortCode": "abc1234",
    "createdAt": "2024-02-04T12:00:00.000Z",
    "expiresAt": "2024-02-11T12:00:00.000Z"
  }
}
```

---

### Redirect to Original URL

```http
GET /:shortId
```

**Example:**
```bash
curl -L http://localhost:3000/abc1234
```

**Response:** 302 Redirect to original URL

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Short URL not found"
}
```

**Error Response (410 Gone - Expired):**
```json
{
  "success": false,
  "message": "This short URL has expired"
}
```

---

### Get URL Analytics

```http
GET /api/url/:shortId
```

**Example Request:**
```bash
curl http://localhost:3000/api/url/abc1234
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "originalUrl": "https://www.example.com/very/long/url/path",
    "shortUrl": "http://localhost:3000/abc1234",
    "shortCode": "abc1234",
    "visitCount": 42,
    "createdAt": "2024-02-04T12:00:00.000Z",
    "expiresAt": "2024-02-11T12:00:00.000Z",
    "isExpired": false
  }
}
```

---

## ⚠️ Error Responses

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "originalUrl",
      "message": "Please provide a valid URL with http or https protocol"
    }
  ]
}
```

### Conflict Error (409 Conflict)

```json
{
  "success": false,
  "message": "Custom alias is already taken"
}
```

### Rate Limit Error (429 Too Many Requests)

```json
{
  "success": false,
  "message": "Too many requests, please try again later.",
  "retryAfter": "Please wait 15 minutes before making more requests."
}
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/url-shortener | MongoDB connection string |
| `BASE_URL` | http://localhost:3000 | Base URL for generated short links |
| `DEFAULT_EXPIRY_DAYS` | 7 | Default URL expiration in days |
| `RATE_LIMIT_WINDOW_MS` | 900000 | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | 100 | Max requests per window |

---

## 📝 File Explanations

### `server.js`
Main entry point. Initializes Express, connects to MongoDB, sets up middleware stack (logging, JSON parsing, rate limiting), mounts routes, and configures error handling.

### `config/db.js`
MongoDB connection module using Mongoose. Handles connection events (error, disconnect, reconnect) and exits gracefully on connection failure.

### `models/Url.js`
Mongoose schema defining the URL document structure: original URL, short code, custom alias, visit count, timestamps, and expiration. Includes indexes for fast lookups and methods for expiration checking and visit counting.

### `controllers/urlController.js`
Business logic for URL operations:
- `createShortUrl`: Validates input, checks duplicates, generates short code, saves to DB
- `redirectToOriginal`: Finds URL, checks expiration, increments visits, redirects
- `getUrlAnalytics`: Returns URL statistics

### `middlewares/validateUrl.js`
Express-validator rules for URL creation requests. Validates URL format, custom alias format, and expiration range.

### `middlewares/rateLimiter.js`
Rate limiting using express-rate-limit. General limiter (100 req/15min) and stricter creation limiter (20 req/15min) to prevent abuse.

### `middlewares/errorHandler.js`
Centralized error handling. Custom `ApiError` class, 404 handler, and global error handler that formats Mongoose errors appropriately.

### `middlewares/logger.js`
HTTP request logging using Morgan. Different formats for development (colored, concise) and production (combined, for log aggregation).

### `utils/generateShortCode.js`
Utility for generating unique 7-character short codes using nanoid. Also includes custom alias validation.

### `routes/urlRoutes.js`
API routes for `/api/url` endpoints (POST for creation, GET for analytics).

### `routes/redirectRoute.js`
Redirect route for `/:shortId` that performs the actual URL redirection.

---

## 🧪 Testing the API

```bash
# 1. Create a short URL
curl -X POST http://localhost:3000/api/url \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://www.google.com"}'

# 2. Create with custom alias
curl -X POST http://localhost:3000/api/url \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://github.com", "customAlias": "gh"}'

# 3. Test redirect (follow redirects)
curl -L http://localhost:3000/<shortCode>

# 4. Get analytics
curl http://localhost:3000/api/url/<shortCode>

# 5. Test invalid URL (should return 400)
curl -X POST http://localhost:3000/api/url \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "not-a-valid-url"}'
```

---

## 📜 License

ISC
