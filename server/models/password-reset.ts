/**
 * Password Reset Model for MongoDB
 *
 * Fields: userId, token, expiresAt
 */

import { ObjectId, Collection } from "mongodb";
import { getDB } from "./connection";
import crypto from "crypto";

export interface PasswordResetDocument {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
}

/**
 * Get password resets collection
 */
export const getPasswordResetsCollection = async (): Promise<
  Collection<PasswordResetDocument>
> => {
  const db = await getDB();
  return db.collection<PasswordResetDocument>("password_resets");
};

/**
 * Ensure indexes
 */
export const ensurePasswordResetIndexes = async (): Promise<void> => {
  const resets = await getPasswordResetsCollection();
  await resets.createIndex({ token: 1 });
  await resets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
};

/**
 * Generate a secure reset token
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Create a password reset entry
 */
export const createPasswordReset = async (userId: string): Promise<string> => {
  const resets = await getPasswordResetsCollection();

  // Invalidate any existing tokens for this user
  await resets.updateMany(
    { userId: new ObjectId(userId), used: false },
    { $set: { used: true } }
  );

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await resets.insertOne({
    userId: new ObjectId(userId),
    token,
    expiresAt,
    used: false,
  });

  return token;
};

/**
 * Find valid password reset by token
 */
export const findPasswordReset = async (
  token: string
): Promise<PasswordResetDocument | null> => {
  const resets = await getPasswordResetsCollection();
  return resets.findOne({
    token,
    expiresAt: { $gt: new Date() },
    used: false,
  });
};

/**
 * Mark reset token as used
 */
export const markResetAsUsed = async (token: string): Promise<void> => {
  const resets = await getPasswordResetsCollection();
  await resets.updateOne({ token }, { $set: { used: true } });
};
