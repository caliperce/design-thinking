import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { useImageUpload } from "./ui/use-image-upload"
import { ImagePlus, X, Upload, Trash2 } from "lucide-react"
import Image from "next/image"
import { useCallback, useState } from "react"
import { cn } from "../lib/utils"
import { useRouter } from "next/router"

export function ImageUploadDemo() {
  const router = useRouter()
  
  // Get email from query params passed from hero.jsx
  const userEmail = router.query.userEmail || ''
  
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

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
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log("Uploading file...", {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      });

      // Send the file directly to your upload API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData, // Send as FormData, not JSON
        // Don't set Content-Type header - let the browser set it automatically for FormData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error:", errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      // Get the response with the public URL
      const result = await response.json();
      console.log("Upload successful!", result);
     

      // Store the public URL
      setUploadedUrl(result.publicUrl);
      alert(`Upload successful! Your image is now available at: ${result.publicUrl}`);
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  }

  const handleAnalyzeImage = async () => {
    if (!uploadedUrl) {
      alert("Please upload an image first!");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      
      const response = await fetch("/api/ai-input", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: uploadedUrl,
          email: userEmail
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("Analysis result:", result);
      
      setAnalysisResult(result.response);
      
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="w-full translate-y-[13%] max-w-md space-y-6 rounded-xl border-0.5 border-white/50  bg-[#1d2221] p-6 shadow-sm">
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

          {/* Image Analysis Section - Only show after successful upload */}
          {uploadedUrl && (
            <div className="mt-6 space-y-4 border-t border-white/10 pt-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Find Expiry Date</h4>
                <p className="text-xs text-muted-foreground">
                  AI will analyze the image to find the expiry date
                </p>
              </div>
              
              <Button
                onClick={handleAnalyzeImage}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              >
                {isAnalyzing ? "Analyzing..." : "Find Expiry Date"}
              </Button>

              {/* Analysis Result */}
              {analysisResult && (
                <div className=" mt-4 p-4 bg-[#2d343a] rounded-lg border border-white/10">
                  <h5 className="text-sm font-medium text-white mb-2">Expiry Date Found:</h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {analysisResult}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}