/**
 * File operations types
 * Defines types for file system operations
 */

export interface FileOperation {
  type: FileOperationType
  nodeId: string
  data?: any
}

export type FileOperationType = 
  | 'create' 
  | 'delete' 
  | 'rename' 
  | 'move' 
  | 'update'
