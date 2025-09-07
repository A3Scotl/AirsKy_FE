import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ImageUpload = ({
  label,
  value,
  onChange,
  placeholder = "Chọn ảnh hoặc kéo thả vào đây",
  error,
  className,
  required = false,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  ...props
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(value || "");
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh!");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      alert(
        `File quá lớn! Vui lòng chọn file nhỏ hơn ${Math.round(
          maxSize / 1024 / 1024
        )}MB`
      );
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Truyền cả previewUrl (cho UI) và file object (cho submit form)
      onChange?.(previewUrl, file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Có lỗi xảy ra khi tải ảnh lên!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onChange?.("", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUrlInput = (url) => {
    setPreview(url);
    // Nếu nhập URL thì truyền URL và null cho file
    onChange?.(url, null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <div className="space-y-4 max-w-2xl">
        {/* URL Input */}
        <div className="space-y-2">
          <Label className="text-sm">Nhập url ảnh hoặc chọn file:</Label>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={value || ""}
            onChange={(e) => handleUrlInput(e.target.value)}
          />
        </div>

        {/* File Upload Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25",
            error ? "border-destructive" : "",
            "hover:border-primary hover:bg-primary/5"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            {...props}
          />

          <div className="flex flex-col items-center justify-center text-center">
            {isUploading ? (
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isUploading ? "Đang tải lên..." : placeholder}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF lên đến {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Chọn file
            </Button>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className="relative">
            <div className="relative h-48 border rounded-lg overflow-hidden bg-muted">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="hidden w-full h-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12" />
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2 truncate">
              {preview}
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default ImageUpload;
