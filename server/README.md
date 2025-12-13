# VibeQuote Server

Express.js backend for VibeQuote - Quote Image Editor.

## Features

- **Authentication** - JWT-based auth with httpOnly cookies
- **Image Search** - Unsplash API proxy with LRU caching
- **MongoDB** - User accounts and video metadata storage

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Run server
npm run server        # Production
npm run server:dev    # Development (hot reload)

# 4. Run tests
npm test
```

---

## Environment Variables

| Variable                | Required | Description                                                         |
| ----------------------- | -------- | ------------------------------------------------------------------- |
| `UNSPLASH_ACCESS_KEY`   | **Yes**  | Get from [unsplash.com/developers](https://unsplash.com/developers) |
| `MONGODB_URI`           | **Yes**  | MongoDB Atlas connection string                                     |
| `JWT_SECRET`            | **Yes**  | Secret key for JWT signing                                          |
| `S3_BUCKET`             | No       | S3 bucket for video storage                                         |
| `S3_REGION`             | No       | AWS region (default: us-east-1)                                     |
| `AWS_ACCESS_KEY_ID`     | No       | AWS credentials for S3                                              |
| `AWS_SECRET_ACCESS_KEY` | No       | AWS credentials for S3                                              |
| `PORT`                  | No       | Server port (default: 3001)                                         |

---

## API Endpoints

### Auth Routes

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT cookie
- `POST /api/auth/logout` - Logout and clear cookie
- `GET /api/auth/me` - Get current user info

### Image Routes

#### GET /api/images/search

Search Unsplash for images.

```
Query params:
  q: string           - Search query (required)
  page: number        - Page number (default: 1)
  per_page: number    - Results per page (default: 20, max: 30)
  orientation: string - landscape | portrait | squarish
  color: string       - blue | red | green | yellow | etc.

Response:
{
  "results": [
    {
      "id": "abc123",
      "thumbUrl": "...",
      "regularUrl": "...",
      "photographer": "John Doe",
      "photographerUrl": "https://unsplash.com/@johndoe"
    }
  ],
  "total": 100,
  "total_pages": 5,
  "cached": false
}
```

### Video Metadata Routes

- `GET /api/videos` - List user's saved videos
- `POST /api/videos` - Save video metadata
- `DELETE /api/videos/:id` - Delete video metadata
- `POST /api/videos/:id/download` - Increment download count

### Health Check

#### GET /api/health

```
Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "mongodb": true,
    "unsplash": true,
    "s3": false
  }
}
```

---

## Development

```bash
# Run with hot reload
npm run server:dev

# Run tests
npm test

# Watch tests
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## Project Structure

```
server/
├── index.ts              # Entry point
├── routes/
│   ├── auth.ts           # Authentication routes
│   ├── images.ts         # Image search routes
│   └── videos.ts         # Video metadata routes
├── models/               # MongoDB models
├── middleware/           # Auth middleware
├── db/
│   └── mongodb.ts        # MongoDB connection
├── utils/
│   ├── lru-cache.ts      # LRU cache implementation
│   ├── sanitize.ts       # Input sanitization
│   └── s3.ts             # S3 upload helper
└── __tests__/
    ├── images.test.ts
    └── lru-cache.test.ts
```

---

## Note on Video Generation

**Video rendering is done client-side using browser APIs.**

The server does NOT render videos. Instead:

1. The frontend editor captures the canvas as an image
2. Client-side JavaScript creates the video using MediaRecorder API
3. The video is downloaded directly to the user's device

This approach:

- Eliminates server-side FFmpeg dependency
- Reduces server costs and complexity
- Enables real-time preview and editing
- Works fully offline for video export

---

## Error Handling

| Status | Error                        |
| ------ | ---------------------------- |
| 400    | Invalid input                |
| 401    | Unauthorized (not logged in) |
| 404    | Resource not found           |
| 429    | Rate limited                 |
| 500    | Server error                 |
