import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import { Chat, ChatMessage } from '@/domains/conversations/types/conversation.types';
import { FileNode } from '@/domains/writing-projects/storage/project-store';

type ChatStore = Omit<Chat, 'messages'>;

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

interface ChatMessageStore extends ChatMessage {
  chatId: string;
}

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

export class ChatDatabase extends Dexie {
  chats!: Dexie.Table<ChatStore, string>;
  messages!: Dexie.Table<ChatMessageStore, string>;
  files!: Dexie.Table<FileNode, string>;

  constructor() {
    super('ChatDatabase');
    
    this.version(1).stores({
      chats: 'id, title, model, createdAt, updatedAt',
      messages: 'id, chatId, role, timestamp, [chatId+timestamp]',
      files: 'id, name, type, parentId, path, lastModified'
    });

    this.on('ready', () => {
      this.chats.mapToClass(ChatStoreClass);
      this.messages.mapToClass(MessageStoreClass);
      this.files.mapToClass(FileNodeClass);
    });
  }
}

export const db = new ChatDatabase();

export async function getAllChats(): Promise<Chat[]> {
  const chatStores = await db.chats.toArray();
  
  const chats: Chat[] = [];
  
  for (const chatStore of chatStores) {
    const messages = await db.messages
      .where('chatId')
      .equals(chatStore.id)
      .toArray();
    
    messages.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return a.id.localeCompare(b.id);
    });
    
    const chat: Chat = {
      ...chatStore,
      messages: messages.map(({ chatId, ...message }) => message as ChatMessage)
    };
    
    chats.push(chat);
  }
  
  return chats;
}

export async function getChatById(id: string): Promise<Chat | undefined> {
  const chatStore = await db.chats.get(id);
  
  if (!chatStore) {
    return undefined;
  }
  
  const messages = await db.messages
    .where('chatId')
    .equals(id)
    .sortBy('timestamp');
  
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
  
  messages.sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp;
    }
    return a.id.localeCompare(b.id);
  });
  
  return messages;
}

export async function saveChat(chat: Chat): Promise<string> {
  const { messages, ...chatWithoutMessages } = chat;
  
  await db.chats.put(chatWithoutMessages as ChatStore);
  
  if (messages && messages.length > 0) {
    const messagesWithChatId = messages.map(message => ({
      ...message,
      chatId: chat.id
    }));
    
    await db.transaction('rw', db.messages, async () => {
      await db.messages.where('chatId').equals(chat.id).delete();
      await db.messages.bulkPut(messagesWithChatId as ChatMessageStore[]);
    });
  }
  
  return chat.id;
}

export async function deleteChat(id: string): Promise<void> {
  await db.transaction('rw', db.chats, db.messages, async () => {
    await db.chats.delete(id);
    await db.messages.where('chatId').equals(id).delete();
  });
}

export async function migrateFromLocalStorage(): Promise<boolean> {
  try {
    const chatsMigrated = await migrateChatData();
    
    const filesMigrated = await migrateFileData();
    
    return chatsMigrated || filesMigrated;
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
    return false;
  }
}

async function migrateChatData(): Promise<boolean> {
  try {
    const storageKey = 'gemini-chatbox-storage';
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) return false;
    
    const parsedData = JSON.parse(storedData);
    const chats = parsedData.state?.chats || [];
    
    for (const chat of chats) {
      const messages = [...(chat.messages || [])];
      const chatWithoutMessages = { ...chat };
      delete chatWithoutMessages.messages;
      
      await saveChat(chatWithoutMessages);
      
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
    const storageKey = 'files-storage';
    const storedData = localStorage.getItem(storageKey);
    if (!storedData) return false;
    
    const parsedData = JSON.parse(storedData);
    const files = parsedData.state?.files || {};
    
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
