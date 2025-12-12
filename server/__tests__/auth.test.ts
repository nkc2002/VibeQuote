/**
 * Auth API Integration Tests
 *
 * Tests all auth endpoints: register, login, me, logout, forgot, reset
 */

import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";

// Import app after setting up env
let app: any;
let mongod: MongoMemoryServer;
let client: MongoClient;

beforeAll(async () => {
  // Create MongoDB Memory Server
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Set environment variables
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test-secret-key";
  process.env.NODE_ENV = "test";
  process.env.FRONTEND_URL = "http://localhost:5173";

  // Connect client
  client = new MongoClient(uri);
  await client.connect();

  // Import app after env is set
  app = (await import("../index")).default;
}, 30000);

afterAll(async () => {
  if (client) await client.close();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  // Clear users collection before each test
  const db = client.db("vibequote");
  await db.collection("users").deleteMany({});
  await db.collection("password_resets").deleteMany({});
});

describe("Auth API", () => {
  // ============================================================
  // REGISTER
  // ============================================================
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe("Test User");
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.user.initials).toBe("TU");

      // Should set cookie
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toContain("vibequote_token");
    });

    it("should reject duplicate email", async () => {
      // Create first user
      await request(app).post("/api/auth/register").send({
        name: "First User",
        email: "duplicate@example.com",
        password: "password123",
      });

      // Try to create second user with same email
      const res = await request(app).post("/api/auth/register").send({
        name: "Second User",
        email: "duplicate@example.com",
        password: "password456",
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe("Email exists");
    });

    it("should reject missing name", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Validation failed");
    });

    it("should reject invalid email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "not-an-email",
        password: "password123",
      });

      expect(res.status).toBe(400);
    });

    it("should reject short password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "123",
      });

      expect(res.status).toBe(400);
    });

    it("should generate correct initials for Vietnamese names", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Nguyễn Văn Cường",
        email: "cuong@example.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.user.initials).toBe("NC");
    });
  });

  // ============================================================
  // LOGIN
  // ============================================================
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      const db = client.db("vibequote");
      const passwordHash = await bcrypt.hash("password123", 12);
      await db.collection("users").insertOne({
        name: "Test User",
        email: "test@example.com",
        passwordHash,
        createdAt: new Date(),
      });
    });

    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should login with remember me", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
        remember: true,
      });

      expect(res.status).toBe(200);
      // Cookie should have longer expiry
      const cookie = res.headers["set-cookie"][0];
      expect(cookie).toContain("Max-Age");
    });

    it("should reject invalid password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid credentials");
    });

    it("should reject non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.status).toBe(401);
    });

    it("should reject empty credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({});

      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // ME
  // ============================================================
  describe("GET /api/auth/me", () => {
    let authCookie: string;

    beforeEach(async () => {
      // Register and login to get cookie
      const registerRes = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      authCookie = registerRes.headers["set-cookie"][0];
    });

    it("should return user with valid cookie", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe("test@example.com");
    });

    it("should return 401 without cookie", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Not authenticated");
    });

    it("should return 401 with invalid cookie", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", "vibequote_token=invalid-token");

      expect(res.status).toBe(401);
    });
  });

  // ============================================================
  // LOGOUT
  // ============================================================
  describe("POST /api/auth/logout", () => {
    it("should clear cookie", async () => {
      const res = await request(app).post("/api/auth/logout");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Should clear cookie
      const cookie = res.headers["set-cookie"][0];
      expect(cookie).toContain("vibequote_token=;");
    });
  });

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================
  describe("POST /api/auth/forgot", () => {
    beforeEach(async () => {
      // Create a test user
      const db = client.db("vibequote");
      await db.collection("users").insertOne({
        name: "Test User",
        email: "test@example.com",
        passwordHash: "hashed",
        createdAt: new Date(),
      });
    });

    it("should return success for existing email", async () => {
      const res = await request(app)
        .post("/api/auth/forgot")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return success for non-existing email (security)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot")
        .send({ email: "nonexistent@example.com" });

      // Should NOT reveal if email exists
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/forgot")
        .send({ email: "not-an-email" });

      expect(res.status).toBe(400);
    });

    it("should create reset token", async () => {
      await request(app)
        .post("/api/auth/forgot")
        .send({ email: "test@example.com" });

      const db = client.db("vibequote");
      const reset = await db.collection("password_resets").findOne({});
      expect(reset).toBeDefined();
      expect(reset?.token).toBeDefined();
    });
  });

  // ============================================================
  // RESET PASSWORD
  // ============================================================
  describe("POST /api/auth/reset", () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create user and reset token
      const db = client.db("vibequote");

      const userResult = await db.collection("users").insertOne({
        name: "Test User",
        email: "test@example.com",
        passwordHash: await bcrypt.hash("oldpassword", 12),
        createdAt: new Date(),
      });

      resetToken = "valid-reset-token-123";
      await db.collection("password_resets").insertOne({
        userId: userResult.insertedId,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        used: false,
      });
    });

    it("should reset password with valid token", async () => {
      const res = await request(app).post("/api/auth/reset").send({
        token: resetToken,
        newPassword: "newpassword123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Should be able to login with new password
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "newpassword123",
      });

      expect(loginRes.status).toBe(200);
    });

    it("should reject invalid token", async () => {
      const res = await request(app).post("/api/auth/reset").send({
        token: "invalid-token",
        newPassword: "newpassword123",
      });

      expect(res.status).toBe(400);
    });

    it("should reject expired token", async () => {
      // Update token to be expired
      const db = client.db("vibequote");
      await db
        .collection("password_resets")
        .updateOne(
          { token: resetToken },
          { $set: { expiresAt: new Date(Date.now() - 1000) } }
        );

      const res = await request(app).post("/api/auth/reset").send({
        token: resetToken,
        newPassword: "newpassword123",
      });

      expect(res.status).toBe(400);
    });

    it("should reject short password", async () => {
      const res = await request(app).post("/api/auth/reset").send({
        token: resetToken,
        newPassword: "123",
      });

      expect(res.status).toBe(400);
    });
  });
});

describe("Health Check", () => {
  it("should return health status", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.services).toBeDefined();
  });
});
