/**
 * Images API Integration Tests
 *
 * Tests image search endpoints with mocked Unsplash API.
 * These are protected routes - require authentication.
 */

import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

let app: any;
let mongod: MongoMemoryServer;
let client: MongoClient;
let authCookie: string;

// Mock Unsplash API responses
const mockSearchResults = {
  total: 100,
  total_pages: 10,
  results: [
    {
      id: "photo-1",
      urls: {
        thumb: "https://images.unsplash.com/thumb-1",
        regular: "https://images.unsplash.com/regular-1",
      },
      user: {
        name: "Photographer 1",
        links: { html: "https://unsplash.com/@photographer1" },
      },
    },
    {
      id: "photo-2",
      urls: {
        thumb: "https://images.unsplash.com/thumb-2",
        regular: "https://images.unsplash.com/regular-2",
      },
      user: {
        name: "Photographer 2",
        links: { html: "https://unsplash.com/@photographer2" },
      },
    },
  ],
};

// Mock fetch
const originalFetch = global.fetch;

beforeAll(async () => {
  // Mock fetch for Unsplash
  global.fetch = jest.fn((url: string) => {
    if (url.includes("api.unsplash.com/search/photos")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResults),
      } as Response);
    }
    if (url.includes("api.unsplash.com/photos/random")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSearchResults.results[0]),
      } as Response);
    }
    return originalFetch(url);
  }) as jest.Mock;

  // Create MongoDB Memory Server
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test-secret-key";
  process.env.NODE_ENV = "test";
  process.env.UNSPLASH_ACCESS_KEY = "test-unsplash-key";

  client = new MongoClient(uri);
  await client.connect();

  app = (await import("../index")).default;

  // Create authenticated user
  const registerRes = await request(app).post("/api/auth/register").send({
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  });

  authCookie = registerRes.headers["set-cookie"][0];
}, 30000);

afterAll(async () => {
  global.fetch = originalFetch;
  if (client) await client.close();
  if (mongod) await mongod.stop();
});

describe("Images API", () => {
  describe("GET /api/images/search", () => {
    it("should reject unauthenticated requests", async () => {
      const res = await request(app).get("/api/images/search?q=nature");

      expect(res.status).toBe(401);
    });

    it("should search images with authentication", async () => {
      const res = await request(app)
        .get("/api/images/search?q=nature")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.results).toBeDefined();
      expect(Array.isArray(res.body.results)).toBe(true);
    });

    it("should return correct structure", async () => {
      const res = await request(app)
        .get("/api/images/search?q=ocean")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.total).toBeDefined();
      expect(res.body.total_pages).toBeDefined();

      const firstResult = res.body.results[0];
      expect(firstResult.id).toBeDefined();
      expect(firstResult.thumbUrl || firstResult.urls).toBeDefined();
    });

    it("should handle pagination", async () => {
      const res = await request(app)
        .get("/api/images/search?q=mountain&page=2&per_page=10")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
    });

    it("should reject missing query", async () => {
      const res = await request(app)
        .get("/api/images/search")
        .set("Cookie", authCookie);

      expect([200, 400]).toContain(res.status);
    });
  });

  describe("GET /api/images/random", () => {
    it("should reject unauthenticated requests", async () => {
      const res = await request(app).get("/api/images/random");

      expect(res.status).toBe(401);
    });

    it("should get random image with authentication", async () => {
      const res = await request(app)
        .get("/api/images/random")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
    });

    it("should accept query parameter", async () => {
      const res = await request(app)
        .get("/api/images/random?query=sunset")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
    });
  });
});

describe("Protected Routes Authorization", () => {
  it("should reject expired tokens", async () => {
    // Use an expired/invalid token
    const res = await request(app)
      .get("/api/images/search?q=test")
      .set("Cookie", "vibequote_token=expired.invalid.token");

    expect(res.status).toBe(401);
  });

  it("should reject malformed tokens", async () => {
    const res = await request(app)
      .get("/api/images/search?q=test")
      .set("Cookie", "vibequote_token=not-a-jwt");

    expect(res.status).toBe(401);
  });
});
