import { GoogleGenAI, File as GeminiFile } from "@google/genai";

export interface FileMetadata {
  name: string;
  uri: string;
  mimeType: string;
  size?: number;
  uploadTime?: string;
  previewUrl?: string;
}

export interface FileUploadOptions {
  file: File;
  mimeType?: string;
}

export interface FilesResponse {
  files: FileMetadata[];
  nextPageToken?: string;
}

export class GeminiFilesApi {
  private genAI: GoogleGenAI;
  
  constructor(genAI: GoogleGenAI) {
    this.genAI = genAI;
  }

  async uploadFile(options: FileUploadOptions): Promise<FileMetadata> {
    try {
      const blob = new Blob([options.file], { type: options.mimeType || options.file.type });
      
      const uploadResponse = await this.genAI.files.upload({
        file: blob,
        config: {
          mimeType: options.mimeType || options.file.type
        }
      });
      
      return {
        name: uploadResponse.name || '',
        uri: uploadResponse.uri || '',
        mimeType: options.mimeType || options.file.type,
        size: options.file.size,
        uploadTime: new Date().toISOString()
      };
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  async getFileMetadata(fileName: string): Promise<FileMetadata> {
    try {
      const fileData = await this.genAI.files.get({ name: fileName });
      
      return {
        name: fileData.name || '',
        uri: fileData.uri || '',
        mimeType: fileData.mimeType || "",
        uploadTime: fileData.createTime || ''
      };
    } catch (error) {
      console.error("Get file metadata error:", error);
      throw new Error(`Failed to get file metadata: ${(error as Error).message}`);
    }
  }

  async listFiles(pageSize = 10, pageToken?: string): Promise<FilesResponse> {
    try {
      const config: { pageSize: number; pageToken?: string } = { pageSize };
      if (pageToken) {
        config.pageToken = pageToken;
      }
      
      const files: FileMetadata[] = [];
      let nextPageToken: string | undefined;
      
      const listResponse = await this.genAI.files.list({ config });
      
      for await (const file of listResponse) {
        files.push({
          name: file.name || '',
          uri: file.uri || '',
          mimeType: file.mimeType || "",
          uploadTime: file.createTime || ''
        });
      }
      
      try {
        if (files.length === pageSize) {
          nextPageToken = String(pageSize + 1);
        }
      } catch (paginationError) {
        console.warn("Pagination handling warning:", paginationError);
      }
      
      return {
        files,
        nextPageToken
      };
    } catch (error) {
      console.error("List files error:", error);
      throw new Error(`Failed to list files: ${(error as Error).message}`);
    }
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      await this.genAI.files.delete({ name: fileName });
      return true;
    } catch (error) {
      console.error("Delete file error:", error);
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }
}
