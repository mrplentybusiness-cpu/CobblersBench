import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, Image as ImageIcon, Loader2, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onPreviewChange?: (preview: string) => void;
  disabled?: boolean;
}

interface UploadStatus {
  imgbb: boolean;
  replitStorage: boolean;
}

export function ImageUploader({ value, onChange, onPreviewChange, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>(value || "");
  const [urlInput, setUrlInput] = useState("");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ imgbb: false, replitStorage: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/uploads/status')
      .then(res => res.json())
      .then(status => setUploadStatus(status))
      .catch(() => setUploadStatus({ imgbb: false, replitStorage: false }));
  }, []);

  const canUpload = uploadStatus.imgbb || uploadStatus.replitStorage;

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      onPreviewChange?.(previewUrl);

      try {
        let imageUrl: string;

        if (uploadStatus.imgbb) {
          const base64Data = previewUrl.split(',')[1];
          const response = await fetch('/api/uploads/imgbb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              name: file.name.replace(/\.[^.]+$/, ''),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload to ImgBB');
          }

          const data = await response.json();
          imageUrl = data.url;
        } else if (uploadStatus.replitStorage) {
          const presignedResponse = await fetch('/api/uploads/request-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              size: file.size,
              contentType: file.type,
            }),
          });

          if (!presignedResponse.ok) {
            throw new Error('Failed to get upload URL');
          }

          const { uploadURL, objectPath } = await presignedResponse.json();

          const uploadResponse = await fetch(uploadURL, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type },
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload image');
          }

          imageUrl = objectPath;
        } else {
          throw new Error('No upload method available. Please use URL input instead.');
        }

        onChange(imageUrl);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Upload failed. Try using URL input instead.');
        setPreview("");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onChange, onPreviewChange, uploadStatus]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onChange("");
    setUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setError('Please enter an image URL');
      return;
    }
    
    if (!urlInput.match(/^https?:\/\/.+/)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setError(null);
    setPreview(urlInput);
    onChange(urlInput);
  };

  if (preview || value) {
    return (
      <div className="space-y-2">
        <div className="relative inline-block">
          <img 
            src={preview || value} 
            alt="Preview" 
            className="h-32 w-32 rounded-lg object-cover bg-muted border"
            data-testid="product-image-preview"
            onError={() => setError('Failed to load image')}
          />
          {!disabled && !isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
              data-testid="button-remove-image"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>
        {value && !isUploading && !error && (
          <p className="text-sm text-green-600 flex items-center gap-1" data-testid="image-upload-success">
            ✓ Image ready
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" data-testid="image-upload-error">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        data-testid="input-product-image-hidden"
      />
      
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">
            <LinkIcon className="h-4 w-4 mr-2" /> Image URL
          </TabsTrigger>
          <TabsTrigger value="upload" disabled={!canUpload}>
            <Upload className="h-4 w-4 mr-2" /> Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          {canUpload ? (
            <div
              onClick={handleClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                (disabled || isUploading) && "opacity-50 cursor-not-allowed"
              )}
              data-testid="dropzone-product-image"
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    {isDragging ? (
                      <ImageIcon className="h-6 w-6 text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {isDragging ? "Drop image here" : "Drag & drop an image"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
              Image upload is not configured. Please use the URL tab to add an image.
            </div>
          )}
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <div className="space-y-3">
            <div>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={disabled}
                data-testid="input-image-url"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste a direct image link. Free hosting: <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="underline text-primary">Imgur</a>, <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="underline text-primary">Postimages</a>
              </p>
            </div>
            <Button
              type="button"
              onClick={handleUrlSubmit}
              disabled={disabled || !urlInput.trim()}
              className="w-full"
              data-testid="button-submit-url"
            >
              Use This Image
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <p className="text-sm text-destructive" data-testid="image-upload-error">{error}</p>
      )}
    </div>
  );
}
