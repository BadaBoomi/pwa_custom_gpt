import Dexie, { type EntityTable } from 'dexie'

// ── Domain types ──────────────────────────────────────────────────────────────
// Entsprechen 1:1 den Android-Entities (RoomEntity, ChatEntity, MessageEntity)

export interface Room {
    id: string       // UUID
    name: string
    createdAt: number // Unix ms
}

export interface Chat {
    id: string       // UUID
    roomId: string
    name: string
    threadId: string // OpenAI conversation/thread ID
    createdAt: number
}

export interface Message {
    id: string       // UUID (or OpenAI output item id)
    chatId: string
    role: 'user' | 'assistant'
    content: string
    createdAt: number
}

// ── Database ──────────────────────────────────────────────────────────────────
// Android: AppDatabase (Room) version 1
// PWA:     AppDb (Dexie)     version 1

class AppDb extends Dexie {
    rooms!: EntityTable<Room, 'id'>
    chats!: EntityTable<Chat, 'id'>
    messages!: EntityTable<Message, 'id'>

    constructor() {
        super('acustomgpt_db')

        // Version 1 — mirrors Android Room schema
        this.version(1).stores({
            rooms: 'id, createdAt',
            chats: 'id, roomId, createdAt',
            messages: 'id, chatId, createdAt',
        })
    }
}

export const db = new AppDb()
