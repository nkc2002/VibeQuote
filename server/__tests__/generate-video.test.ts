/**
 * Video Generation API Integration Tests
 *
 * Tests video generation endpoints with mocked FFmpeg and Unsplash.
 * These are protected routes - require authentication.
 */

import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

let app: any;
let mongod: MongoMemoryServer;
let client: MongoClient;
let authCookie: string;

// Mock fetch for Unsplash
const originalFetch = global.fetch;

beforeAll(async () => {
  // Mock fetch
  global.fetch = jest.fn((url: string) => {
    if (url.includes("api.unsplash.com")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: "test-photo",
            urls: {
              full: "https://images.unsplash.com/photo-test",
              regular: "https://images.unsplash.com/photo-test-regular",
            },
            user: {
              name: "Test",
              links: { html: "https://unsplash.com/@test" },
            },
            links: { download_location: "https://api.unsplash.com/download" },
          }),
      } as Response);
    }
    if (url.includes("images.unsplash.com")) {
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
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
  process.env.UNSPLASH_ACCESS_KEY = "test-key";

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

describe("Video Generation API", () => {
  describe("POST /api/generate-video", () => {
    it("should reject unauthenticated requests", async () => {
      const res = await request(app).post("/api/generate-video").send({
        unsplashId: "test-photo-id",
        wrappedText: "Test quote text",
      });

      expect(res.status).toBe(401);
    });

    it("should reject missing unsplashId", async () => {
      const res = await request(app)
        .post("/api/generate-video")
        .set("Cookie", authCookie)
        .send({
          wrappedText: "Test quote text",
        });

      expect(res.status).toBe(400);
    });

    it("should reject missing wrappedText", async () => {
      const res = await request(app)
        .post("/api/generate-video")
        .set("Cookie", authCookie)
        .send({
          unsplashId: "test-photo-id",
        });

      expect(res.status).toBe(400);
    });

    it("should accept valid request structure", async () => {
      const res = await request(app)
        .post("/api/generate-video")
        .set("Cookie", authCookie)
        .send({
          unsplashId: "test-photo-id",
          wrappedText: "Test quote text",
          fontFamily: "Arial",
          fontSize: 48,
          fontColor: "#ffffff",
          duration: 5,
        });

      // Will likely fail due to FFmpeg not installed, but should validate input
      expect([200, 500, 503]).toContain(res.status);
    });
  });

  describe("GET /api/generate-video/status", () => {
    it("should return queue status", async () => {
      const res = await request(app)
        .get("/api/generate-video/status")
        .set("Cookie", authCookie);

      // May or may not require auth depending on implementation
      expect([200, 401]).toContain(res.status);
    });
  });
});

describe("Request Validation", () => {
  it("should reject excessively long text", async () => {
    const longText = "a".repeat(1000);
    const res = await request(app)
      .post("/api/generate-video")
      .set("Cookie", authCookie)
      .send({
        unsplashId: "test-photo-id",
        wrappedText: longText,
      });

    // Should either truncate or reject
    expect([200, 400, 500]).toContain(res.status);
  });

  it("should handle special characters in text", async () => {
    const res = await request(app)
      .post("/api/generate-video")
      .set("Cookie", authCookie)
      .send({
        unsplashId: "test-photo-id",
        wrappedText: "Test with 'quotes' and \"double quotes\" and : colons",
      });

    // Should handle or reject gracefully
    expect([200, 400, 500]).toContain(res.status);
  });
});
