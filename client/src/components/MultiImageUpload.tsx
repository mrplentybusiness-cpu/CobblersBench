import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, Image as ImageIcon, Plus, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  label?: string;
  className?: string;
  maxImages?: number;
  testId?: string;
}

export default function MultiImageUpload({
  values = [],
  onChange,
  folder = "cobblers-bench",
  label = "Images",
  className = "",
  maxImages = 10,
  testId = "multi-image-upload",
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - values.length;
    if (remainingSlots <= 0) {
      toast({ title: "Limit reached", description: `Maximum ${maxImages} images allowed`, variant: "destructive" });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map((file) => {
        return new Promise<string>((resolve, reject) => {
          if (!file.type.startsWith("image/")) {
            reject(new Error("Not an image"));
            return;
          }
          if (file.size > 10 * 1024 * 1024) {
            reject(new Error("File too large"));
            return;
          }

          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64 = reader.result as string;
              const response = await fetch("/api/uploads/cloudinary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64, folder }),
              });

              if (!response.ok) throw new Error("Upload failed");

              const data = await response.json();
              resolve(data.url);
            } catch (err) {
              reject(err);
            }
          };
          reader.readAsDataURL(file);
        });
      });

      const newUrls = await Promise.all(uploadPromises);
      onChange([...values, ...newUrls]);
      toast({ title: "Success", description: `${newUrls.length} image(s) uploaded` });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Some images failed to upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    if (values.length >= maxImages) {
      toast({ title: "Limit reached", description: `Maximum ${maxImages} images allowed`, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch("/api/uploads/cloudinary-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: urlInput, folder }),
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      onChange([...values, data.url]);
      setUrlInput("");
      setShowUrlInput(false);
      toast({ title: "Success", description: "Image added successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to upload image from URL", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= values.length) return;
    const newValues = [...values];
    const [moved] = newValues.splice(fromIndex, 1);
    newValues.splice(toIndex, 0, moved);
    onChange(newValues);
  };

  return (
    <div className={`space-y-3 ${className}`} data-testid={testId}>
      {label && <Label>{label}</Label>}

      {values.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {values.map((url, index) => (
            <div key={`${url}-${index}`} className="relative group">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
                data-testid={`${testId}-image-${index}`}
              />
              <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                  data-testid={`${testId}-move-up-${index}`}
                >
                  <span className="text-xs">←</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => moveImage(index, index + 1)}
                  disabled={index === values.length - 1}
                  data-testid={`${testId}-move-down-${index}`}
                >
                  <span className="text-xs">→</span>
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
                data-testid={`${testId}-remove-${index}`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {values.length < maxImages && (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
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
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Images
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUrlInput(!showUrlInput)}
              disabled={isUploading}
              data-testid={`${testId}-url-toggle`}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Add from URL
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

          <p className="text-xs text-muted-foreground">
            {values.length} of {maxImages} images
          </p>
        </div>
      )}
    </div>
  );
}
