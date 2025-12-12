/**
 * MongoDB Connection Manager
 */

import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Connect to MongoDB
 */
export const connectDB = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable not set");
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("vibequote");
    console.log("MongoDB connected");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

/**
 * Get database instance
 */
export const getDB = async (): Promise<Db> => {
  if (!db) {
    return connectDB();
  }
  return db;
};

/**
 * Close database connection
 */
export const closeDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB disconnected");
  }
};
