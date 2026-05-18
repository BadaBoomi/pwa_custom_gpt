// Entspricht Android: ChatRepositoryImpl
// Enthält CRUD für Rooms, Chats, Messages sowie sendMessage (API-Aufruf delegiert an openAiService).

import { db, type Chat, type Message, type Room } from '@/db/db'
import { openAiService, getTextContent } from '@/services/openAiService'
import { settingsRepository } from '@/repositories/settingsRepository'
import { splitAssistantResponse } from '@/utils/messageUtils'

function uuid(): string {
    return crypto.randomUUID()
}

const RESPONSE_STATUS_COMPLETED = 'completed'

export const chatRepository = {
    // ── Rooms ─────────────────────────────────────────────────────────────────

    async getAllRooms(): Promise<Room[]> {
        return db.rooms.orderBy('createdAt').reverse().toArray()
    },

    async createRoom(name: string): Promise<Room> {
        const room: Room = { id: uuid(), name, createdAt: Date.now() }
        await db.rooms.add(room)
        return room
    },

    async renameRoom(room: Room, newName: string): Promise<void> {
        await db.rooms.update(room.id, { name: newName })
    },

    async deleteRoom(room: Room): Promise<void> {
        // Kaskaden-Delete: Chats und Messages zuerst löschen (Android: chatDao.deleteChatsForRoom)
        const chats = await db.chats.where('roomId').equals(room.id).toArray()
        const chatIds = chats.map((c) => c.id)
        if (chatIds.length > 0) {
            await db.messages.where('chatId').anyOf(chatIds).delete()
            await db.chats.where('roomId').equals(room.id).delete()
        }
        await db.rooms.delete(room.id)
    },

    // ── Chats ─────────────────────────────────────────────────────────────────

    async getChatsForRoom(roomId: string): Promise<Chat[]> {
        return db.chats.where('roomId').equals(roomId).reverse().sortBy('createdAt')
    },

    async createChat(roomId: string, name: string): Promise<Chat> {
        const conversation = await openAiService.createConversation()
        const chat: Chat = {
            id: uuid(),
            roomId,
            name,
            threadId: conversation.id,
            createdAt: Date.now(),
        }
        await db.chats.add(chat)
        return chat
    },

    async renameChat(chat: Chat, newName: string): Promise<void> {
        await db.chats.update(chat.id, { name: newName })
    },

    async deleteChat(chat: Chat): Promise<void> {
        await db.messages.where('chatId').equals(chat.id).delete()
        await db.chats.delete(chat.id)
    },

    async moveChatToRoom(chat: Chat, newRoomId: string): Promise<void> {
        await db.chats.update(chat.id, { roomId: newRoomId })
    },

    async getChatById(chatId: string): Promise<Chat | undefined> {
        return db.chats.get(chatId)
    },

    // ── Messages ──────────────────────────────────────────────────────────────

    async getMessagesForChat(chatId: string): Promise<Message[]> {
        return db.messages.where('chatId').equals(chatId).sortBy('createdAt')
    },

    async sendMessage(
        chat: Chat,
        userText: string,
        promptId: string,
        vectorStoreIds: string[],
    ): Promise<void> {
        // 1. Nutzernachricht sofort lokal speichern
        const userMessage: Message = {
            id: uuid(),
            chatId: chat.id,
            role: 'user',
            content: userText,
            createdAt: Date.now(),
        }
        await db.messages.add(userMessage)

        // 2. API-Request zusammenbauen
        const userId = settingsRepository.getUserEmail()?.trim() ?? ''
        const contentWithUser = `[user-id: ${userId}] ${userText}`

        const tools =
            vectorStoreIds.length > 0
                ? [{ type: 'file_search', vector_store_ids: vectorStoreIds }]
                : undefined

        const response = await openAiService.createResponse({
            prompt: { id: promptId },
            input: [{ role: 'user', content: contentWithUser }],
            conversation: chat.threadId,
            tools,
        })

        if (response.status !== RESPONSE_STATUS_COMPLETED) {
            throw new Error(`Response did not complete (status=${response.status})`)
        }

        // 3. Antwort-Nachrichten lokal speichern
        const now = Date.now()
        const newMessages: Message[] = response.output
            .filter((item) => item.type === 'message' && item.role === 'assistant')
            .flatMap((item, msgIndex) => {
                const parts = splitAssistantResponse(getTextContent(item))
                return parts.map((part, partIndex) => ({
                    id: partIndex === 0 ? item.id : `${item.id}_${partIndex}`,
                    chatId: chat.id,
                    role: 'assistant' as const,
                    content: part,
                    createdAt: now + msgIndex * 10 + partIndex,
                }))
            })

        if (newMessages.length > 0) {
            await db.messages.bulkAdd(newMessages)
        }
    },
}
