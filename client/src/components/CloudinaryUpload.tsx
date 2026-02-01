import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CloudinaryUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: () => void;
  folder?: string;
  label?: string;
  className?: string;
  showPreview?: boolean;
  testId?: string;
}

export default function CloudinaryUpload({
  value,
  onChange,
  onDelete,
  folder = "cobblers-bench",
  label = "Image",
  className = "",
  showPreview = true,
  testId = "cloudinary-upload",
}: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      // Get upload signature from server
      const signatureResponse = await fetch("/api/uploads/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });

      if (!signatureResponse.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { signature, timestamp, cloudName, apiKey, folder: uploadFolder, publicId } = await signatureResponse.json();

      // Upload directly to Cloudinary (bypasses server size limits)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", apiKey);
      formData.append("folder", uploadFolder);
      formData.append("public_id", publicId);

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error("Upload to Cloudinary failed");
      }

      const data = await cloudinaryResponse.json();
      onChange(data.secure_url);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setIsUploading(true);
    try {
      const response = await fetch("/api/uploads/cloudinary-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: urlInput, folder }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onChange(data.url);
      setUrlInput("");
      setShowUrlInput(false);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to upload image from URL", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (onDelete) onDelete();
  };

  return (
    <div className={`space-y-2 ${className}`} data-testid={testId}>
      {label && <Label>{label}</Label>}
      
      {value && showPreview ? (
        <div className="relative group">
          <img
            src={value}
            alt="Uploaded"
            className="w-full max-w-xs h-32 object-cover rounded-lg border"
            data-testid={`${testId}-preview`}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            data-testid={`${testId}-remove`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid={`${testId}-file-input`}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid={`${testId}-upload-btn`}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload File
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={isUploading}
              data-testid={`${testId}-url-toggle`}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Use URL
            </Button>
          </div>

          {showUrlInput && (
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isUploading}
                data-testid={`${testId}-url-input`}
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={isUploading || !urlInput.trim()}
                data-testid={`${testId}-url-submit`}
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
