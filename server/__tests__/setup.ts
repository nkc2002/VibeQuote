/**
 * Jest Test Setup with MongoDB Memory Server
 *
 * This file sets up an in-memory MongoDB instance for testing.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

let mongod: MongoMemoryServer;
let client: MongoClient;

// Store original env
const originalEnv = process.env;

beforeAll(async () => {
  // Create MongoDB Memory Server
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Set environment variables for tests
  process.env = {
    ...originalEnv,
    MONGODB_URI: uri,
    JWT_SECRET: "test-secret-key",
    NODE_ENV: "test",
    FRONTEND_URL: "http://localhost:5173",
  };

  // Connect to memory server
  client = new MongoClient(uri);
  await client.connect();
});

afterAll(async () => {
  // Close connections
  if (client) {
    await client.close();
  }
  if (mongod) {
    await mongod.stop();
  }

  // Restore env
  process.env = originalEnv;
});

beforeEach(async () => {
  // Clear all collections before each test
  if (client) {
    const db = client.db("vibequote");
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.dropCollection(collection.name).catch(() => {});
    }
  }
});

export { mongod, client };
