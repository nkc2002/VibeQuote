/**
 * User Model and Authentication for MongoDB
 */

import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import crypto from "crypto";

let client: MongoClient | null = null;
let db: Db | null = null;

export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  initials: string;
  createdAt: Date;
}

/**
 * Connect to MongoDB
 */
export const connectAuthDB = async (): Promise<Db> => {
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

    // Ensure indexes
    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true });

    console.log("Auth DB connected");
    return db;
  } catch (error) {
    console.error("Auth DB connection error:", error);
    throw error;
  }
};

/**
 * Get users collection
 */
export const getUsersCollection = async (): Promise<
  Collection<UserDocument>
> => {
  const database = await connectAuthDB();
  return database.collection<UserDocument>("users");
};

/**
 * Hash password using SHA-256 with salt
 */
export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
};

/**
 * Verify password
 */
export const verifyPassword = (
  password: string,
  storedHash: string
): boolean => {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
};

/**
 * Generate initials from name (e.g., "CƯỜNG NGUYỄN" → "CN")
 */
export const generateInitials = (name: string): string => {
  if (!name) return "U";

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  // Get first letter of first and last word
  const first = words[0].charAt(0);
  const last = words[words.length - 1].charAt(0);
  return (first + last).toUpperCase();
};

/**
 * Convert UserDocument to UserPublic (safe for client)
 */
export const toUserPublic = (user: UserDocument): UserPublic => ({
  id: user._id!.toString(),
  name: user.name,
  email: user.email,
  initials: generateInitials(user.name),
  createdAt: user.createdAt,
});

/**
 * Create a new user
 */
export const createUser = async (
  name: string,
  email: string,
  password: string
): Promise<UserPublic> => {
  const users = await getUsersCollection();

  // Check if user exists
  const existing = await users.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new Error("Email already registered");
  }

  const now = new Date();
  const user: UserDocument = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    createdAt: now,
    updatedAt: now,
  };

  const result = await users.insertOne(user);
  user._id = result.insertedId;

  return toUserPublic(user);
};

/**
 * Find user by email
 */
export const findUserByEmail = async (
  email: string
): Promise<UserDocument | null> => {
  const users = await getUsersCollection();
  return users.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by ID
 */
export const findUserById = async (
  id: string
): Promise<UserDocument | null> => {
  const users = await getUsersCollection();
  try {
    return users.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
};

/**
 * Authenticate user (login)
 */
export const authenticateUser = async (
  email: string,
  password: string
): Promise<UserPublic | null> => {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return toUserPublic(user);
};
