"use client"

import { useState, useRef, ChangeEvent } from "react"
import { Button } from "@/shared/ui-components/button"
import { FileX, FileUp, Image, File, Upload, X, Loader2 } from "lucide-react"
import { FileMetadata } from "@/domains/conversations/types/conversation.types"
import { toast } from "sonner"
import { cn } from "@/shared/utilities/class-name-merger"
import { useChatStore } from "@/domains/conversations/storage/conversation-store"

interface FileUploadProps {
  onFileUploaded: (file: FileMetadata) => void
  onRemoveFile?: (fileUri: string) => void
  disabled?: boolean
  acceptedTypes?: string
  maxSizeMB?: number
  className?: string
}

export function FileAttachment({
  onFileUploaded,
  onRemoveFile,
  disabled = false,
  acceptedTypes = "image/*,audio/*,video/*,application/pdf",
  maxSizeMB = 20,
  className
}: FileUploadProps) {
  const { apiKey } = useChatStore()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  
  const createFormData = (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mimeType', file.type)
    return formData
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeBytes) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const tempId = previewUrl;

    const tempFileMetadata: FileMetadata = {
      name: file.name,
      mimeType: file.type,
      size: file.size,
      previewUrl: previewUrl,
      uri: '',
      uploadTime: new Date().toISOString()
    };

    setUploadedFiles(prev => [...prev, tempFileMetadata]);
    setIsUploading(true);

    try {
      const response = await fetch('/api/gemini/files/upload', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: createFormData(file)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = 
          errorData?.error?.message || `Upload failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const finalFileData: FileMetadata = await response.json();
      finalFileData.previewUrl = previewUrl;

      setUploadedFiles(prev => 
        prev.map(f => (f.previewUrl === tempId ? finalFileData : f))
      );
      onFileUploaded(finalFileData);
      toast.success("File uploaded successfully");

    } catch (error) {
      console.error("Upload failed:", error);
      toast.error((error as Error).message);
      setUploadedFiles(prev => prev.filter(f => f.previewUrl !== tempId));
      URL.revokeObjectURL(previewUrl);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const removeFile = async (fileIdentifier: string) => {
    const fileToRemove = uploadedFiles.find(
      f => f.uri === fileIdentifier || f.previewUrl === fileIdentifier
    );

    if (!fileToRemove || !fileToRemove.uri) {
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
        setUploadedFiles(files => files.filter(f => f.previewUrl !== fileIdentifier));
      }
      return;
    }

    try {
      const response = await fetch(`/api/gemini/files/delete?name=${fileToRemove.name}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = 
          errorData?.error?.message || 'Failed to delete file.';
        throw new Error(errorMessage);
      }

      toast.success('File deleted successfully.');

      if (fileToRemove.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
  
      setUploadedFiles(files =>
        files.filter(f => f.uri !== fileIdentifier)
      );
  
      if (onRemoveFile) {
        onRemoveFile(fileToRemove.uri);
      }

    } catch (error) {
      console.error('Deletion failed:', error);
      toast.error((error as Error).message);
    }
  };

  const getFilePreview = (file: FileMetadata) => {
    if (file.mimeType.startsWith('image/') && file.previewUrl) {
      return (
        <div className="relative w-6 h-6 overflow-hidden rounded">
          <img 
            src={file.previewUrl} 
            alt="Preview" 
            className="object-cover w-full h-full" 
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              
              const sibling = target.nextElementSibling as HTMLDivElement;
              if (sibling) sibling.style.display = 'flex';
            }} 
          />
          <div className="absolute inset-0 items-center justify-center hidden">
            <Image className="h-4 w-4" />
          </div>
        </div>
      );
    } else if (file.mimeType.startsWith('video/')) {
      return <FileX className="h-4 w-4 text-orange-500" />;
    } else if (file.mimeType.startsWith('audio/')) {
      return <FileX className="h-4 w-4 text-blue-500" />;
    } else if (file.mimeType.includes('pdf')) {
      return <FileX className="h-4 w-4 text-red-500" />;
    }
    return <File className="h-4 w-4" />;
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={acceptedTypes}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />
        <Button 
          type="button"
          size="sm"
          variant="outline"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
          className="gap-2 text-xs"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-3 w-3" />
              Attach file
            </>
          )}
        </Button>
        
        {uploadedFiles.length > 0 && uploadedFiles.map((file) => (
          <div 
            key={file.uri} 
            className="flex items-center bg-muted rounded-md px-2 py-1 text-xs gap-1.5 group border border-border/50 hover:border-border transition-colors"
          >
            {getFilePreview(file)}
            <span className="max-w-[100px] truncate">
              {file.mimeType.split('/')[1]}
            </span>
            <button
              type="button"
              onClick={() => removeFile(file.uri || file.previewUrl!)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Remove file"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
