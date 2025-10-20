/**
 * File node types
 * Defines the structure of files and folders in the virtual file system
 */

export interface FileNode {
  id: string
  name: string
  type: FileNodeType
  content?: string
  parentId: string | null
  path: string
  lastModified: number
  size?: number
  children?: string[] // IDs of child nodes
  editedContent?: string // AI-generated edited content for diff view
  editPrompt?: string // The edit prompt used to generate the edited content
}

export type FileNodeType = "file" | "folder"
