import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

export function isCloudinaryConfigured(): boolean {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

function configureCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET");
  }
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export class CloudinaryStorageService {
  async getUploadSignature(folder: string = "cobblers-bench"): Promise<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
    publicId: string;
  }> {
    configureCloudinary();
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${folder}/${randomUUID()}`;
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
      },
      CLOUDINARY_API_SECRET!
    );

    return {
      signature,
      timestamp,
      cloudName: CLOUDINARY_CLOUD_NAME!,
      apiKey: CLOUDINARY_API_KEY!,
      folder,
      publicId,
    };
  }

  async uploadFromUrl(imageUrl: string, folder: string = "cobblers-bench"): Promise<string> {
    try {
      configureCloudinary();
      const result = await cloudinary.uploader.upload(imageUrl, {
        folder,
        public_id: randomUUID(),
      });
      return result.secure_url;
    } catch (error) {
      console.error("[Cloudinary] Upload from URL failed:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  }

  async uploadFromBase64(base64Data: string, folder: string = "cobblers-bench"): Promise<string> {
    try {
      configureCloudinary();
      const dataUri = base64Data.startsWith("data:") ? base64Data : `data:image/jpeg;base64,${base64Data}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: randomUUID(),
      });
      return result.secure_url;
    } catch (error) {
      console.error("[Cloudinary] Upload from base64 failed:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      configureCloudinary();
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("[Cloudinary] Delete image failed:", error);
      throw new Error("Failed to delete image from Cloudinary");
    }
  }

  getPublicIdFromUrl(url: string): string | null {
    const match = url.match(/\/v\d+\/(.+)\.[a-z]+$/i);
    return match ? match[1] : null;
  }
}

export const cloudinaryService = new CloudinaryStorageService();
