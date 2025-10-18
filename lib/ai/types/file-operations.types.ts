/**
 * File operations types for AI-assisted file management
 */

/**
 * Result of a file operation
 */
export interface FileOperationResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  error?: string;
  messageType?: 'FILE_EDIT_SUCCESS' | 'FILE_EDIT_ERROR' | 'FILE_EDIT_PROCESSING' | 'FILE_CREATION_SUCCESS' | 'FILE_CREATION_PROCESSING';
}
