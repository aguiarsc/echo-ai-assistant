/**
 * File-related types for Gemini API
 */

export interface FileMetadata {
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
  uploadTime?: string;
  previewUrl?: string; // For client-side image previews
}

export interface FileUploadOptions {
  file: File;
  mimeType?: string;
}

export interface FilesResponse {
  files: FileMetadata[];
  nextPageToken?: string;
}
