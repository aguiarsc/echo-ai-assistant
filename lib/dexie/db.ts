import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Chat, ChatMessage } from '../gemini';
import { FileNode } from '../files/store';

// Extended Chat type without messages for DB storage
type ChatStore = Omit<Chat, 'messages'>;

// Class for Dexie to use for mapping chat objects
class ChatStoreClass implements ChatStore {
  id!: string;
  title!: string;
  model!: "gemini-2.5-flash" | "gemini-2.0-flash";
  createdAt!: number;
  updatedAt!: number;
  avatarUrl?: string;
  systemInstruction?: string;
  generationParams?: Record<string, any>;

  constructor(init?: Partial<ChatStore>) {
    if (init) Object.assign(this, init);
    this.id = this.id || uuidv4();
    this.createdAt = this.createdAt || Date.now();
    this.updatedAt = this.updatedAt || Date.now();
  }
}

// Extended ChatMessage type with chatId for DB storage
interface ChatMessageStore extends ChatMessage {
  chatId: string;
}

// Class for Dexie to use for mapping message objects
class MessageStoreClass implements ChatMessageStore {
  id!: string;
  chatId!: string;
  role!: "model" | "user" | "system" | "thinking";
  content!: string;
  timestamp!: number;
  status?: string;
  tokenCount?: number;

  constructor(init?: Partial<ChatMessageStore>) {
    if (init) Object.assign(this, init);
    this.id = this.id || uuidv4();
    this.timestamp = this.timestamp || Date.now();
  }
}

// Class for Dexie to use for mapping file objects
class FileNodeClass implements FileNode {
  id!: string;
  name!: string;
  type!: "file" | "folder";
  parentId!: string | null;
  path!: string;
  lastModified!: number;
  content?: string;
  size?: number;
  children?: string[];
  
  constructor(init?: Partial<FileNode>) {
    if (init) Object.assign(this, init);
    this.lastModified = this.lastModified || Date.now();
  }
}

// Define the database schema
export class ChatDatabase extends Dexie {
  // Define tables
  chats!: Dexie.Table<ChatStore, string>; // string = type of the primary key
  messages!: Dexie.Table<ChatMessageStore, string>; // string = type of the primary key
  files!: Dexie.Table<FileNode, string>;

  constructor() {
    super('ChatDatabase');
    
    // Define database schema with version number
    this.version(1).stores({
      // Define table schemas
      chats: 'id, title, model, createdAt, updatedAt',
      messages: 'id, chatId, role, timestamp, [chatId+timestamp]',
      files: 'id, name, type, parentId, path, lastModified'
    });

    // Version hooks are safer than table hooks for type safety
    this.on('ready', () => {
      // Set default handlers for chats
      this.chats.mapToClass(ChatStoreClass);
      // Set default handlers for messages
      this.messages.mapToClass(MessageStoreClass);
      // Set default handlers for files
      this.files.mapToClass(FileNodeClass);
    });
  }
}

// Create database instance
export const db = new ChatDatabase();

// Helper functions
export async function getAllChats(): Promise<Chat[]> {
  // Get all chats from the database
  const chatStores = await db.chats.toArray();
  
  // Load messages for each chat
  const chats: Chat[] = [];
  
  for (const chatStore of chatStores) {
    // Get messages for this chat, sorted by timestamp then by ID for stable ordering
    const messages = await db.messages
      .where('chatId')
      .equals(chatStore.id)
      .toArray();
    
    // Sort by timestamp first, then by ID for stable ordering
    messages.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      // If timestamps are equal, sort by ID for consistent ordering
      return a.id.localeCompare(b.id);
    });
    
    // Create a complete chat object
    const chat: Chat = {
      ...chatStore,
      messages: messages.map(({ chatId, ...message }) => message as ChatMessage)
    };
    
    chats.push(chat);
  }
  
  return chats;
}

export async function getChatById(id: string): Promise<Chat | undefined> {
  // Get chat from database
  const chatStore = await db.chats.get(id);
  
  if (!chatStore) {
    return undefined;
  }
  
  // Get messages for this chat
  const messages = await db.messages
    .where('chatId')
    .equals(id)
    .sortBy('timestamp');
  
  // Create a complete chat object
  const chat: Chat = {
    ...chatStore,
    messages: messages.map(({ chatId, ...message }) => message as ChatMessage)
  };
  
  return chat;
}

export async function getMessagesByChatId(chatId: string): Promise<ChatMessage[]> {
  const messages = await db.messages
    .where('chatId')
    .equals(chatId)
    .toArray();
  
  // Sort by timestamp first, then by ID for stable ordering
  messages.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    // If timestamps are equal, sort by ID for consistent ordering
    return a.id.localeCompare(b.id);
  });
  
  return messages;
}

export async function saveChat(chat: Chat): Promise<string> {
  // Create a modified chat object without the messages field
  const { messages, ...chatWithoutMessages } = chat;
  
  // Save chat
  await db.chats.put(chatWithoutMessages as ChatStore);
  
  // Save messages separately if they exist
  if (messages && messages.length > 0) {
    // Add chatId field to each message for indexing
    const messagesWithChatId = messages.map(message => ({
      ...message,
      chatId: chat.id
    }));
    
    // Put all messages in a transaction
    await db.transaction('rw', db.messages, async () => {
      // Clear existing messages for this chat to avoid duplicates
      await db.messages.where('chatId').equals(chat.id).delete();
      // Add all new messages
      await db.messages.bulkPut(messagesWithChatId as ChatMessageStore[]);
    });
  }
  
  return chat.id;
}

export async function deleteChat(id: string): Promise<void> {
  await db.transaction('rw', db.chats, db.messages, async () => {
    // Delete chat
    await db.chats.delete(id);
    // Delete all messages associated with the chat
    await db.messages.where('chatId').equals(id).delete();
  });
}

export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    // Step 1: Migrate chat data
    const chatsMigrated = await migrateChatData();
    
    // Step 2: Migrate file data
    const filesMigrated = await migrateFileData();
    
    return chatsMigrated || filesMigrated;
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
    return false;
  }
}

async function migrateChatData(): Promise<boolean> {
  try {
    // Check if we have existing data in localStorage
    const storageKey = 'gemini-chatbox-storage';
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) return false;
    
    // Parse the stored data
    const parsedData = JSON.parse(storedData);
    const chats = parsedData.state?.chats || [];
    
    // For each chat, save it and its messages to IndexedDB
    for (const chat of chats) {
      // Extract messages and save them separately
      const messages = [...(chat.messages || [])];
      const chatWithoutMessages = { ...chat };
      delete chatWithoutMessages.messages;
      
      // Save chat to IndexedDB
      await saveChat(chatWithoutMessages);
      
      // Save each message linked to the chat
      for (const msg of messages) {
        await db.messages.put({
          ...msg,
          chatId: chat.id
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error migrating chat data from localStorage:', error);
    return false;
  }
}

async function migrateFileData(): Promise<boolean> {
  try {
    // Check if we have existing file data in localStorage
    const storageKey = 'files-storage';
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) return false;
    
    // Parse the stored data
    const parsedData = JSON.parse(storedData);
    const files = parsedData.state?.files || {};
    
    // Save all files to IndexedDB
    for (const fileId in files) {
      const file = files[fileId];
      await saveFile(file);
    }
    
    return true;
  } catch (error) {
    console.error('Error migrating file data from localStorage:', error);
    return false;
  }
}

// File storage helper functions
export async function saveFile(file: FileNode): Promise<string> {
  return await db.files.put(file);
}

export async function getAllFiles(): Promise<Record<string, FileNode>> {
  const files = await db.files.toArray();
  return files.reduce((acc, file) => {
    acc[file.id] = file;
    return acc;
  }, {} as Record<string, FileNode>);
}

export async function deleteFile(fileId: string): Promise<void> {
  await db.files.delete(fileId);
}

export async function getFileById(fileId: string): Promise<FileNode | undefined> {
  return await db.files.get(fileId);
}
