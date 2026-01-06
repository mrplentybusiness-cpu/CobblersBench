import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { Response } from "express";
import { Readable } from "stream";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "cobblers-bench";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    if (!isR2Configured()) {
      throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY");
    }
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

export class R2StorageService {
  async getUploadUrl(contentType?: string): Promise<{ uploadUrl: string; objectKey: string; publicUrl: string }> {
    const client = getR2Client();
    const objectKey = `uploads/${randomUUID()}`;
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: contentType || "application/octet-stream",
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
    
    const publicUrl = R2_PUBLIC_URL 
      ? `${R2_PUBLIC_URL}/${objectKey}`
      : `/r2/${objectKey}`;

    return { uploadUrl, objectKey, publicUrl };
  }

  async getObject(objectKey: string): Promise<Readable> {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });

    const response = await client.send(command);
    return response.Body as Readable;
  }

  async downloadObject(objectKey: string, res: Response): Promise<void> {
    try {
      const client = getR2Client();
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
      });

      const response = await client.send(command);
      
      res.set({
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Length": response.ContentLength?.toString(),
        "Cache-Control": "public, max-age=31536000",
      });

      const stream = response.Body as Readable;
      stream.pipe(res);
    } catch (error: any) {
      if (error.name === "NoSuchKey") {
        res.status(404).json({ error: "Object not found" });
      } else {
        console.error("Error downloading from R2:", error);
        res.status(500).json({ error: "Failed to download object" });
      }
    }
  }

  async deleteObject(objectKey: string): Promise<void> {
    const client = getR2Client();
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
    });
    await client.send(command);
  }
}

export const r2StorageService = new R2StorageService();
