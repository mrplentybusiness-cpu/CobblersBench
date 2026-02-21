import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";

// Read env vars at runtime, not module load time
function getCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
}

export function isCloudinaryConfigured(): boolean {
  const config = getCloudinaryConfig();
  return !!(config.cloudName && config.apiKey && config.apiSecret);
}

function configureCloudinary() {
  const config = getCloudinaryConfig();
  if (!config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET");
  }
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
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
    const config = getCloudinaryConfig();
    configureCloudinary();
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${folder}/${randomUUID()}`;
    
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        public_id: publicId,
      },
      config.apiSecret!
    );

    return {
      signature,
      timestamp,
      cloudName: config.cloudName!,
      apiKey: config.apiKey!,
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

  async uploadVideo(filePath: string, folder: string = "cobblers-bench/videos"): Promise<{ url: string; publicId: string; thumbnailUrl: string }> {
    try {
      configureCloudinary();
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        public_id: randomUUID(),
        resource_type: "video",
        eager: [
          { width: 300, height: 533, crop: "fill", gravity: "auto", format: "jpg" }
        ],
        eager_async: false,
      });
      const thumbnailUrl = result.eager?.[0]?.secure_url || 
        result.secure_url.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
      return {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnailUrl,
      };
    } catch (error) {
      console.error("[Cloudinary] Video upload failed:", error);
      throw new Error("Failed to upload video to Cloudinary");
    }
  }

  async uploadVideoFromBase64(base64Data: string, folder: string = "cobblers-bench/videos"): Promise<{ url: string; publicId: string; thumbnailUrl: string }> {
    try {
      configureCloudinary();
      const dataUri = base64Data.startsWith("data:") ? base64Data : `data:video/mp4;base64,${base64Data}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: randomUUID(),
        resource_type: "video",
        eager: [
          { width: 300, height: 533, crop: "fill", gravity: "auto", format: "jpg" }
        ],
        eager_async: false,
      });
      const thumbnailUrl = result.eager?.[0]?.secure_url || 
        result.secure_url.replace(/\.(mp4|mov|avi|webm)$/i, '.jpg');
      return {
        url: result.secure_url,
        publicId: result.public_id,
        thumbnailUrl,
      };
    } catch (error) {
      console.error("[Cloudinary] Video base64 upload failed:", error);
      throw new Error("Failed to upload video to Cloudinary");
    }
  }

  async deleteResource(publicId: string, resourceType: string = "image"): Promise<void> {
    try {
      configureCloudinary();
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      console.error(`[Cloudinary] Delete ${resourceType} failed:`, error);
      throw new Error(`Failed to delete ${resourceType} from Cloudinary`);
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
    const match = url.match(/\/v\d+\/(.+)\.[a-z0-9]+$/i);
    return match ? match[1] : null;
  }

  getVideoSignature(folder: string = "cobblers-bench/videos"): {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
    publicId: string;
  } {
    const config = getCloudinaryConfig();
    configureCloudinary();
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${folder}/${randomUUID()}`;
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, public_id: publicId },
      config.apiSecret!
    );
    return { signature, timestamp, cloudName: config.cloudName!, apiKey: config.apiKey!, folder, publicId };
  }
}

export const cloudinaryService = new CloudinaryStorageService();
