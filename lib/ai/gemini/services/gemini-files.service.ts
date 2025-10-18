/**
 * Gemini Files API service
 * Handles file uploads and management for multimodal inputs
 */

import { GoogleGenAI } from "@google/genai";
import { FileMetadata, FileUploadOptions, FilesResponse } from "../types";

/**
 * Files API service for handling multimodal inputs in Gemini chatbox
 */
export class GeminiFilesService {
  private genAI: GoogleGenAI;
  
  constructor(genAI: GoogleGenAI) {
    this.genAI = genAI;
  }

  /**
   * Upload a file to the Gemini Files API
   * @param options File upload options
   * @returns File metadata including the URI for use in requests
   */
  async uploadFile(options: FileUploadOptions): Promise<FileMetadata> {
    try {
      // Create a Blob from the file to match the expected API signature
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

  /**
   * Get metadata for a specific file
   * @param fileName The file name/ID to retrieve
   * @returns File metadata
   */
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

  /**
   * List all uploaded files
   * @param pageSize Number of files to retrieve per page
   * @param pageToken Token for pagination
   * @returns List of files and next page token if available
   */
  async listFiles(pageSize = 10, pageToken?: string): Promise<FilesResponse> {
    try {
      const config: { pageSize: number; pageToken?: string } = { pageSize };
      if (pageToken) {
        config.pageToken = pageToken;
      }
      
      const files: FileMetadata[] = [];
      let nextPageToken: string | undefined;
      
      const listResponse = await this.genAI.files.list({ config });
      
      // Iterate through file list and collect metadata
      for await (const file of listResponse) {
        files.push({
          name: file.name || '',
          uri: file.uri || '',
          mimeType: file.mimeType || "",
          uploadTime: file.createTime || ''
        });
      }
      
      // Handle pagination token
      // Since the Pager API might vary between versions, we'll use a more compatible approach
      // that doesn't rely on specific methods that might not exist
      try {
        // Track if we have more pages by checking if we got the full page size
        if (files.length === pageSize) {
          // If we have a full page, there might be more
          nextPageToken = String(pageSize + 1); // Simple page number approach
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

  /**
   * Delete a file from the Gemini Files API
   * @param fileName The file name/ID to delete
   * @returns Whether deletion was successful
   */
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
