/**
 * MongoDB connection and Video model
 */

import { MongoClient, Db, Collection, ObjectId } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export interface VideoDocument {
  _id?: ObjectId;
  hash: string;
  unsplashId: string;
  input: {
    text: string;
    template: string;
    styleParams: Record<string, unknown>;
  };
  createdAt: Date;
  size: number;
  duration: number;
  publicUrl?: string;
  persist: boolean;
}

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
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

/**
 * Get database instance (alias for connectDB)
 */
export const getDb = connectDB;

/**
 * Get videos collection
 */
export const getVideosCollection = async (): Promise<
  Collection<VideoDocument>
> => {
  const database = await connectDB();
  return database.collection<VideoDocument>("videos");
};

/**
 * Save video metadata
 */
export const saveVideoMetadata = async (
  video: Omit<VideoDocument, "_id">
): Promise<string> => {
  const collection = await getVideosCollection();
  const result = await collection.insertOne(video as VideoDocument);
  return result.insertedId.toString();
};

/**
 * Find video by hash (for cache lookup)
 */
export const findVideoByHash = async (
  hash: string
): Promise<VideoDocument | null> => {
  const collection = await getVideosCollection();
  return collection.findOne({ hash });
};

/**
 * Close MongoDB connection
 */
export const closeDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};

/**
 * Check if MongoDB is connected
 */
export const isConnected = (): boolean => {
  return client !== null && db !== null;
};
