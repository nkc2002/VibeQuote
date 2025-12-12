# VibeQuote Server

Express.js backend for VibeQuote - Quote Video Generator.

## Features

- **Image Search** - Unsplash API proxy with LRU caching
- **Video Generation** - FFmpeg-based MP4 creation
- **MongoDB** - Video metadata storage
- **S3** - Optional video persistence

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

| Variable                | Required  | Description                                                         |
| ----------------------- | --------- | ------------------------------------------------------------------- |
| `UNSPLASH_ACCESS_KEY`   | **Yes**   | Get from [unsplash.com/developers](https://unsplash.com/developers) |
| `MONGODB_URI`           | **Yes\*** | MongoDB Atlas connection string                                     |
| `FFMPEG_URL`            | No        | URL to download FFmpeg binary. If not set, uses system FFmpeg       |
| `S3_BUCKET`             | No        | S3 bucket for video storage                                         |
| `S3_REGION`             | No        | AWS region (default: us-east-1)                                     |
| `AWS_ACCESS_KEY_ID`     | No        | AWS credentials for S3                                              |
| `AWS_SECRET_ACCESS_KEY` | No        | AWS credentials for S3                                              |
| `PORT`                  | No        | Server port (default: 3001)                                         |
| `MAX_CONCURRENT_JOBS`   | No        | Concurrent video jobs (default: 2)                                  |

\*MongoDB is required for video generation but optional for image search.

---

## API Endpoints

### GET /api/images/search

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
      "photographerUrl": "https://unsplash.com/@johndoe",
      "download_location": "..."
    }
  ],
  "total": 100,
  "total_pages": 5,
  "cached": false
}
```

### POST /api/generate-video

Generate a 5-second quote video.

```
Body (JSON):
{
  "unsplashId": "abc123",        // Unsplash image ID
  "wrappedText": "Quote text",   // The quote to display
  "template": "center",          // center | bottom | top-left | bottom-right
  "styleParams": {               // Optional
    "fontFamily": "Syne",
    "fontSize": 32,
    "textColor": "#FFFFFF",
    "overlayOpacity": 0.4
  }
}

Query params:
  persist=true  - Store video to S3 and return URL (requires S3 config)

Response (persist=false): Streams MP4 directly
Response (persist=true):
{
  "success": true,
  "cached": false,
  "url": "https://s3.example.com/videos/hash.mp4",
  "hash": "abc123",
  "size": 150000,
  "duration": 5,
  "photographer": "John Doe"
}
```

### GET /api/generate-video/status

Get service status and queue info.

```
Response:
{
  "status": "ok",
  "queue": {
    "running": 1,
    "queued": 0,
    "max": 2
  },
  "recentTelemetry": [...]
}
```

### GET /api/health

Health check endpoint.

```
Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "unsplash": true,
    "mongodb": true,
    "s3": false,
    "ffmpeg": "system"
  }
}
```

---

## Video Generation Flow

1. **Validate input** - Sanitize text, validate unsplashId
2. **Check cache** - Look for existing video by hash in MongoDB
3. **Acquire semaphore** - Wait for available processing slot
4. **Fetch image** - Get from Unsplash, trigger download_location per API policy
5. **Generate video** - FFmpeg creates 5s, 480p, 15fps MP4
6. **Save metadata** - Store job info to MongoDB
7. **Return** - Stream MP4 or upload to S3

---

## Font Setup

The server expects a font file at `public/fonts/Syne-Bold.ttf`.

```bash
# Download Syne font from Google Fonts
mkdir -p public/fonts
# Download and place Syne-Bold.ttf in public/fonts/
```

If font is not found, FFmpeg will use its default font.

---

## FFmpeg Setup

**Option 1: System FFmpeg**

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
winget install FFmpeg
```

**Option 2: Download automatically**
Set `FFMPEG_URL` to a direct download URL for ffmpeg binary.

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
│   ├── images.ts         # GET /api/images/search
│   └── generate-video.ts # POST /api/generate-video
├── db/
│   └── mongodb.ts        # MongoDB connection
├── utils/
│   ├── lru-cache.ts      # LRU cache implementation
│   ├── sanitize.ts       # Input sanitization (images)
│   ├── video-sanitize.ts # FFmpeg text sanitization
│   ├── semaphore.ts      # Concurrency control
│   ├── ffmpeg.ts         # FFmpeg binary manager
│   └── s3.ts             # S3 upload helper
└── __tests__/
    ├── images.test.ts
    ├── generate-video.test.ts
    └── lru-cache.test.ts
```

---

## Rate Limits

- **Unsplash API**: 50 requests/hour (demo), 5000/hour (production)
- **Video Generation**: Controlled by `MAX_CONCURRENT_JOBS` semaphore

---

## Error Handling

| Status | Error                                          |
| ------ | ---------------------------------------------- |
| 400    | Invalid input (missing unsplashId, empty text) |
| 404    | Unsplash image not found                       |
| 429    | Rate limited (Unsplash or concurrent jobs)     |
| 500    | Server error (FFmpeg failed, etc.)             |
| 502    | Upstream error (Unsplash API down)             |
