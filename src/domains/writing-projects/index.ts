export { FileTree, FileTreeContainer } from './components/ProjectTree';
export { FileEditor } from './components/FileEditor';
export { DiffViewer } from './components/DiffViewer';
export { FilesTab } from './components/ProjectTab';
export { FileExport } from './components/file-export';

export { useFilesStore } from './storage/project-store';
export { useFileContextStore } from './storage/file-context-store';
export type { FileNode, FilesState } from './storage/project-store';
export type { FileContextState } from './storage/file-context-store';

export { 
  collectFilesRecursively,
  prepareFileContext,
  enhanceMessageWithContext,
  generateFileContextSummary,
  getFileContextDescription,
  generateThinkingContentWithContext
} from './services/file-context-service';

export {
  handleFileEdit,
  handleFileCreation,
  generateFileOperationMessage
} from './services/file-operations-service';
export type { FileOperationResult } from './services/file-operations-service';

export {
  parseFileIntent,
  generateEditSystemInstruction
} from './services/intent-parser-service';
export type { FileCreationIntent, FileEditIntent, IntentResult } from './services/intent-parser-service';

export {
  selectBestPreset,
  getPresetSelectionMessage
} from './services/preset-selector-service';
export type { PresetSelectionResult } from './services/preset-selector-service';

export { PROMPT_PRESETS } from './services/presets';
export type { PromptPreset } from './services/presets';
