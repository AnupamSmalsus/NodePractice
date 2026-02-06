# 🔗 URL Shortener API

A production-ready URL shortener service built with Node.js, Express.js, and MongoDB. Features include user authentication with Google OAuth, email encryption, rate limiting, URL expiration, custom aliases, analytics, and comprehensive error handling.

## 📋 Features

### URL Shortening
- ✅ **Short URL Generation** - Create short URLs using nanoid (7-character codes)
- ✅ **Custom Aliases** - Support for custom short URL aliases
- ✅ **URL Analytics** - Track visit counts and creation dates
- ✅ **URL Expiration** - Automatic expiration support for short URLs
- ✅ **Duplicate Handling** - Returns existing short URL for duplicate requests

### User Authentication
- ✅ **User Signup/Login** - Email and password-based authentication
- ✅ **Google OAuth** - Sign in with Google integration
- ✅ **JWT Tokens** - Secure token-based authentication
- ✅ **Email OTP Password Reset** - 6-digit OTP sent via email for password reset
- ✅ **Profile Management** - Update username functionality

### Security
- ✅ **Email Encryption** - AES-256-CBC encryption for user emails
- ✅ **Password Hashing** - bcrypt password hashing with salt
- ✅ **Blind Index Search** - SHA-256 hash for email lookups
- ✅ **Rate Limiting** - Prevents abuse with configurable rate limits
- ✅ **Input Validation** - Validates URL format and custom aliases

### Infrastructure
- ✅ **Email Service** - Nodemailer integration for sending OTP emails
- ✅ **Error Handling** - Comprehensive error handling with proper HTTP status codes
- ✅ **Request Logging** - HTTP request logging with Morgan
- ✅ **MVC Architecture** - Clean, maintainable code structure
- ✅ **CORS Support** - Cross-origin resource sharing enabled

---

## 📁 Project Structure

```
Backend/
├── config/
│   └── db.js                # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication operations (signup, login, OAuth, password reset)
│   └── urlController.js     # URL operations (create, redirect, analytics)
├── middlewares/
│   ├── authMiddleware.js    # JWT token verification middleware
│   ├── errorHandler.js      # Centralized error handling
│   ├── logger.js            # HTTP request logging (Morgan)
│   ├── rateLimiter.js       # Rate limiting middleware
│   └── validateUrl.js       # URL validation middleware
├── models/
│   ├── Url.js               # Mongoose URL schema
│   └── User.js              # Mongoose User schema (encrypted email, password hash)
├── routes/
│   ├── authRoutes.js        # Authentication routes (/api/auth)
│   ├── redirectRoute.js     # Redirect route (/:shortId)
│   └── urlRoutes.js         # API routes (/api/url)
├── utils/
│   ├── emailService.js      # Email service for sending OTP via Nodemailer
│   ├── encryption.js        # AES-256-CBC encryption/decryption utilities
│   └── generateShortCode.js # Short code generation utility
├── .env                     # Environment variables
├── .gitignore               # Git ignore file
├── package.json             # Dependencies and scripts
├── server.js                # Application entry point
└── README.md                # Documentation
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

## 🔐 Authentication Endpoints

### Register User

```http
POST /api/auth/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Success Response (201 Created):**
```json
{
  "_id": "65bf...",
  "username": "johndoe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Login User

```http
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "identifier": "john@example.com",
  "password": "securepass123"
}
```

> **Note:** `identifier` can be either email or username.

**Success Response (200 OK):**
```json
{
  "_id": "65bf...",
  "username": "johndoe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Google Sign In

```http
POST /api/auth/google
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "google_id_token_from_frontend"
}
```

**Success Response (200/201):**
```json
{
  "_id": "65bf...",
  "username": "johndoe1234",
  "email": "john@gmail.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Forgot Password (Request OTP)

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent to your email address"
}
```

> **Note:** A 6-digit OTP is sent to the user's email. The OTP expires in 10 minutes.

---

### Reset Password (Verify OTP)

```http
POST /api/auth/reset-password
Content-Type: application/json
```

**Request Body:**
```json
{
  "otp": "123456",
  "password": "newSecurePass123"
}
```

> **Note:** `otp` must be the 6-digit code sent to the user's email.

**Success Response (200 OK):**
```json
{
  "_id": "65bf...",
  "username": "johndoe",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid or expired OTP"
}
```

---

### Get Current User (Protected)

```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "_id": "65bf...",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2024-02-04T12:00:00.000Z"
}
```

---

### Update Username (Protected)

```http
PUT /api/auth/username
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "newusername"
}
```

**Success Response (200 OK):**
```json
{
  "_id": "65bf...",
  "username": "newusername",
  "email": "john@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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

### Authentication Error (401 Unauthorized)

```json
{
  "message": "Invalid credentials"
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
| `JWT_SECRET` | - | Secret key for JWT token signing (required) |
| `JWT_EXPIRES_IN` | 1d | JWT token expiration duration |
| `ENCRYPTION_KEY` | - | 32-byte hex key for AES-256-CBC email encryption (required) |
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID for Sign in with Google |
| `EMAIL_SERVICE` | gmail | Email service provider (gmail, sendgrid, etc.) |
| `EMAIL_USER` | - | Email address for sending OTP emails (required) |
| `EMAIL_PASS` | - | App password for email authentication (required) |

---

## 📝 File Explanations

### `server.js`
Main entry point. Initializes Express, connects to MongoDB, sets up middleware stack (logging, JSON parsing, rate limiting, CORS), mounts routes (auth, URL, redirect), and configures error handling.

### `config/db.js`
MongoDB connection module using Mongoose. Handles connection events (error, disconnect, reconnect) and exits gracefully on connection failure.

### `models/Url.js`
Mongoose schema defining the URL document structure: original URL, short code, custom alias, visit count, timestamps, and expiration. Includes indexes for fast lookups and methods for expiration checking and visit counting.

### `models/User.js`
Mongoose schema for user authentication. Features:
- Encrypted email field (AES-256-CBC)
- Email hash field (SHA-256) for lookups without decryption
- Password hashing with bcrypt (pre-save hook)
- Optional Google ID for OAuth users
- Password reset token fields with expiration
- Password comparison method

### `controllers/urlController.js`
Business logic for URL operations:
- `createShortUrl`: Validates input, checks duplicates, generates short code, saves to DB
- `redirectToOriginal`: Finds URL, checks expiration, increments visits, redirects
- `getUrlAnalytics`: Returns URL statistics

### `controllers/authController.js`
Business logic for authentication:
- `signup`: Register user with encrypted email and hashed password
- `login`: Authenticate via email or username
- `googleLogin`: OAuth flow with Google ID token verification
- `getMe`: Return authenticated user's profile
- `updateUsername`: Update user's username
- `forgotPassword`: Generate 6-digit OTP and send via email (10 min expiry)
- `resetPassword`: Verify OTP and reset password

### `middlewares/authMiddleware.js`
JWT token verification middleware. Extracts Bearer token from Authorization header, verifies using JWT_SECRET, and attaches user to request object.

### `middlewares/validateUrl.js`
Express-validator rules for URL creation requests. Validates URL format, custom alias format, and expiration range.

### `middlewares/rateLimiter.js`
Rate limiting using express-rate-limit. General limiter (100 req/15min) and stricter creation limiter (20 req/15min) to prevent abuse.

### `middlewares/errorHandler.js`
Centralized error handling. Custom `ApiError` class, 404 handler, and global error handler that formats Mongoose errors appropriately.

### `middlewares/logger.js`
HTTP request logging using Morgan. Different formats for development (colored, concise) and production (combined, for log aggregation).

### `utils/encryption.js`
Encryption utilities for sensitive data:
- `encrypt`: AES-256-CBC encryption with random IV (returns `iv:ciphertext`)
- `decrypt`: Decrypts encrypted strings back to plaintext
- `hashIndex`: SHA-256 hash for creating blind indexes (searchable encrypted fields)

### `utils/emailService.js`
Email service using Nodemailer for sending OTP emails:
- `sendPasswordResetOTP`: Sends branded HTML email with 6-digit OTP
- Configurable SMTP provider (Gmail, SendGrid, etc.)
- Includes styled email template with OTP code and expiry notice

### `utils/generateShortCode.js`
Utility for generating unique 7-character short codes using nanoid. Also includes custom alias validation.

### `routes/authRoutes.js`
Authentication routes for `/api/auth` endpoints (signup, login, Google OAuth, password reset, profile).

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
