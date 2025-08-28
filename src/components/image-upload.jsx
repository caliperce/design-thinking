import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useImageUpload } from "./ui/use-image-upload"
import { ImagePlus, X, Upload, Trash2 } from "lucide-react"
import Image from "next/image"
import { useCallback, useState } from "react"
import { cn } from "../lib/utils"

export function ImageUploadDemo() {
  const {
    previewUrl,
    fileName,
    selectedFile,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove,
  } = useImageUpload({
    onUpload: (url) => console.log("Uploaded image URL:", url),
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const fakeEvent = {
          target: {
            files: [file],
          },
        }
        handleFileChange(fakeEvent)
      }
    },
    [handleFileChange],
  )

  const handleUpload = async () => {
    // Check if we have a file selected
    if (!selectedFile) {
      alert("Please select an image first!");
      return;
    }

    setIsUploading(true);
    
    try {
      // Step 1: Get the pre-signed URL from your API
      console.log("Getting pre-signed URL...");
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get upload URL: ${response.statusText}`);
      }

      const { uploadUrl, publicUrl } = await response.json();
      console.log("Got pre-signed URL:", uploadUrl);
      console.log("Public URL will be:", publicUrl);

      // Step 2: Upload the actual file to R2 using the pre-signed URL
      console.log("Uploading file to R2...");
      console.log("Upload URL:", uploadUrl);
      console.log("File details:", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });
      
      try {
        console.log("About to make PUT request...");
        
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": selectedFile.type,
          },

        });

        console.log("PUT request completed!");
        console.log("Upload response status:", uploadResponse.status);
        console.log("Upload response headers:", Object.fromEntries(uploadResponse.headers.entries()));

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("Upload error response:", errorText);
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
        }
        
        console.log("Upload successful!");
      } catch (fetchError) {
        console.error("Fetch error details:", fetchError);
        console.error("Error name:", fetchError.name);
        console.error("Error message:", fetchError.message);
        console.error("Error stack:", fetchError.stack);
        throw new Error(`Network error during upload: ${fetchError.message}`);
      }

      // Step 3: Success! Store the public URL
      console.log("Upload successful! Image available at:", publicUrl);
      setUploadedUrl(publicUrl);
      alert(`Upload successful! Your image is now available at: ${publicUrl}`);
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border-0.5 border-white/50  bg-[#1d2221] p-6 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Image Upload</h3>
        <p className="text-sm text-muted-foreground">
          Supported formats: JPG, PNG
        </p>
      </div>

      <Input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!previewUrl ? (
        <div
          onClick={handleThumbnailClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-[#2d343a] transition-colors hover:bg-none",
            isDragging && "border-primary/50 bg-primary/5",
          )}
        >
          <div className="rounded-full bg-background p-3 shadow-sm">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Click to select</p>
            <p className="text-xs text-muted-foreground">
              or drag and drop file here
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="group relative h-64 overflow-hidden rounded-lg border">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleThumbnailClick}
                className="h-9 w-9 p-0"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                className="h-9 w-9 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {fileName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{fileName}</span>
              <button
                onClick={handleRemove}
                className="ml-auto rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex justify-center mt-4">
            <Button 
              className="bg-[#2d343a] text-white hover:bg-[#2d343a]/80 w-full cursor-pointer" 
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload image"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}