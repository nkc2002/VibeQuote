/**
 * User Model for MongoDB
 *
 * Fields: name, email (unique), passwordHash, createdAt
 */

import { ObjectId, Collection } from "mongodb";
import { getDB } from "./connection";

export interface UserDocument {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  initials: string;
  createdAt: string;
}

/**
 * Generate initials from name (e.g., "CƯỜNG NGUYỄN" → "CN")
 */
export const generateInitials = (name: string): string => {
  if (!name) return "U";

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

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
  createdAt: user.createdAt.toISOString(),
});

/**
 * Get users collection
 */
export const getUsersCollection = async (): Promise<
  Collection<UserDocument>
> => {
  const db = await getDB();
  return db.collection<UserDocument>("users");
};

/**
 * Ensure indexes
 */
export const ensureUserIndexes = async (): Promise<void> => {
  const users = await getUsersCollection();
  await users.createIndex({ email: 1 }, { unique: true });
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
 * Create a new user
 */
export const createUser = async (
  name: string,
  email: string,
  passwordHash: string
): Promise<UserDocument> => {
  const users = await getUsersCollection();

  const user: UserDocument = {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    createdAt: new Date(),
  };

  const result = await users.insertOne(user);
  user._id = result.insertedId;
  return user;
};

/**
 * Update user password
 */
export const updateUserPassword = async (
  userId: string,
  newPasswordHash: string
): Promise<boolean> => {
  const users = await getUsersCollection();
  const result = await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { passwordHash: newPasswordHash } }
  );
  return result.modifiedCount > 0;
};
