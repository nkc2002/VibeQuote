/**
 * S3 Upload Helper (Optional)
 * Uploads generated videos to S3 if configured
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createReadStream, statSync } from "fs";

let s3Client: S3Client | null = null;

/**
 * Check if S3 is configured
 */
export const isS3Configured = (): boolean => {
  return !!(
    process.env.S3_BUCKET &&
    process.env.S3_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
};

/**
 * Get S3 client (lazy initialization)
 */
const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
};

/**
 * Upload file to S3
 * Returns the public URL
 */
export const uploadToS3 = async (
  filePath: string,
  key: string,
  contentType: string = "video/mp4"
): Promise<string> => {
  if (!isS3Configured()) {
    throw new Error("S3 is not configured");
  }

  const bucket = process.env.S3_BUCKET!;
  const client = getS3Client();

  const fileStream = createReadStream(filePath);
  const fileStats = statSync(filePath);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
    ContentLength: fileStats.size,
    // Make public readable if desired
    // ACL: 'public-read',
  });

  await client.send(command);

  // Return the public URL
  const region = process.env.S3_REGION || "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

/**
 * Generate S3 key for video
 */
export const generateS3Key = (hash: string): string => {
  const date = new Date().toISOString().split("T")[0];
  return `videos/${date}/${hash}.mp4`;
};
