import type { Express } from "express";
import { isR2Configured, r2StorageService } from "../../r2Storage";

/**
 * Register object storage routes for file uploads.
 * 
 * Supports both Cloudflare R2 (for production/Railway) and Replit Object Storage (for development).
 * R2 is used when R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set.
 */
export function registerObjectStorageRoutes(app: Express): void {
  const useR2 = isR2Configured();
  const hasReplitStorage = !!process.env.PRIVATE_OBJECT_DIR;
  
  // Lazy-load Replit Object Storage only when needed (avoids crash in production)
  let objectStorageService: any = null;
  let ObjectNotFoundError: any = null;
  
  if (hasReplitStorage && !useR2) {
    try {
      const replitStorage = require("./objectStorage");
      objectStorageService = new replitStorage.ObjectStorageService();
      ObjectNotFoundError = replitStorage.ObjectNotFoundError;
    } catch (error) {
      console.warn("[Storage] Failed to load Replit Object Storage:", error);
    }
  }

  console.log(`[Storage] Using ${useR2 ? 'Cloudflare R2' : hasReplitStorage ? 'Replit Object Storage' : 'No storage configured'} for file uploads`);

  /**
   * Request a presigned URL for file upload.
   */
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      if (useR2) {
        const { uploadUrl, objectKey, publicUrl } = await r2StorageService.getUploadUrl(contentType);
        res.json({
          uploadURL: uploadUrl,
          objectPath: publicUrl,
          objectKey,
          metadata: { name, size, contentType },
        });
      } else if (objectStorageService) {
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
        res.json({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        });
      } else {
        return res.status(503).json({ error: "No storage service configured" });
      }
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  /**
   * Serve uploaded objects from Replit Object Storage.
   * Only available when Replit Object Storage is configured.
   */
  if (objectStorageService) {
    app.get("/objects/:objectPath(*)", async (req, res) => {
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(req.path);
        await objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        console.error("Error serving object:", error);
        if (ObjectNotFoundError && error instanceof ObjectNotFoundError) {
          return res.status(404).json({ error: "Object not found" });
        }
        return res.status(500).json({ error: "Failed to serve object" });
      }
    });
  }

  /**
   * Serve uploaded objects from Cloudflare R2.
   */
  app.get("/r2/:objectPath(*)", async (req, res) => {
    if (!useR2) {
      return res.status(404).json({ error: "R2 storage not configured" });
    }

    try {
      const objectKey = req.params.objectPath;
      await r2StorageService.downloadObject(objectKey, res);
    } catch (error) {
      console.error("Error serving R2 object:", error);
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
