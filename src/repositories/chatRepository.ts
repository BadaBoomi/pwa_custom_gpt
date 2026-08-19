// Entspricht Android: ChatRepositoryImpl
// Enthält CRUD für Rooms, Chats, Messages sowie sendMessage (API-Aufruf delegiert an openAiService).

import { db, type Chat, type FlowSession, type Message, type Room } from '@/db/db'
import { getRuleFlowHandler } from '@/flows/flowRegistry'
import { createInitialFlowSession, parseRuleFlowDirective } from '@/flows/ruleFlowEngine'
import { openAiService, getTextContent } from '@/services/openAiService'
import { settingsRepository } from '@/repositories/settingsRepository'
import { splitAssistantResponse } from '@/utils/messageUtils'

function uuid(): string {
    return crypto.randomUUID()
}

const RESPONSE_STATUS_COMPLETED = 'completed'

function createAssistantMessage(chatId: string, content: string, createdAt = Date.now()): Message {
    return {
        id: uuid(),
        chatId,
        role: 'assistant',
        content,
        createdAt,
    }
}

function getMissingFlowScriptMessage(flowType: string): string {
    return `Deterministic flow script "${flowType}" was not found. AI mode resumed.`
}

function toFlowStepLabel(step: string): string {
    switch (step) {
        case 'ask_name':
            return 'Name'
        case 'ask_contact_method':
            return 'Contact Method'
        case 'confirm':
            return 'Confirmation'
        default:
            return 'In Progress'
    }
}

function getFlowPreview(session: FlowSession) {
    return {
        flowId: session.flowId,
        flowType: session.flowType,
        status: session.status,
        currentStep: session.currentStep,
        stepLabel: toFlowStepLabel(session.currentStep),
        updatedAt: session.updatedAt,
    }
}

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
            await db.flowSessions.where('chatId').anyOf(chatIds).delete()
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
        await db.flowSessions.delete(chat.id)
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

    async getActiveFlowForChat(chatId: string): Promise<ReturnType<typeof getFlowPreview> | null> {
        const session = await db.flowSessions.get(chatId)
        if (!session || session.status !== 'running') return null
        return getFlowPreview(session)
    },

    async abortFlowForChat(chatId: string, reason?: string): Promise<void> {
        const existing = await db.flowSessions.get(chatId)
        if (!existing || existing.status !== 'running') return

        await db.flowSessions.update(chatId, {
            status: 'aborted',
            updatedAt: Date.now(),
        })

        const assistantText = reason
            ? `Deterministic flow aborted: ${reason}`
            : 'Deterministic flow aborted.'

        await db.messages.add(createAssistantMessage(chatId, assistantText))
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

        const activeFlow = await db.flowSessions.get(chat.id)
        if (activeFlow && activeFlow.status === 'running') {
            const flowHandler = getRuleFlowHandler(activeFlow.flowType)
            if (!flowHandler) {
                await db.flowSessions.update(chat.id, {
                    status: 'aborted',
                    updatedAt: Date.now(),
                })

                await db.messages.add(
                    createAssistantMessage(chat.id, getMissingFlowScriptMessage(activeFlow.flowType)),
                )
                return
            }

            const handled = flowHandler.handleTurn(activeFlow, userText)
            await db.flowSessions.update(chat.id, {
                currentStep: handled.nextStep,
                status: handled.status,
                answers: handled.answers,
                resultSummary: handled.resultSummary,
                updatedAt: Date.now(),
            })

            await db.messages.add(createAssistantMessage(chat.id, handled.assistantReply))

            if (handled.status === 'completed') {
                await db.flowSessions.delete(chat.id)
            }
            return
        }

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
        const newMessages: Message[] = []
        let requestedFlowType: string | null = null

        response.output
            .filter((item) => item.type === 'message' && item.role === 'assistant')
            .forEach((item, msgIndex) => {
                const rawText = getTextContent(item)
                const directive = parseRuleFlowDirective(rawText)
                const contentForDisplay = directive ? directive.cleanedText : rawText

                if (directive && !requestedFlowType) {
                    requestedFlowType = directive.flowType
                }

                const parts = splitAssistantResponse(contentForDisplay)
                parts.forEach((part, partIndex) => {
                    if (!part.trim()) return
                    newMessages.push({
                        id: partIndex === 0 ? item.id : `${item.id}_${partIndex}`,
                        chatId: chat.id,
                        role: 'assistant',
                        content: part,
                        createdAt: now + msgIndex * 10 + partIndex,
                    })
                })
            })

        if (newMessages.length > 0) {
            await db.messages.bulkAdd(newMessages)
        }

        if (requestedFlowType) {
            const flowSession = createInitialFlowSession(chat.id, requestedFlowType)
            const flowHandler = getRuleFlowHandler(flowSession.flowType)
            if (!flowHandler) {
                await db.messages.add(
                    createAssistantMessage(chat.id, getMissingFlowScriptMessage(flowSession.flowType), Date.now() + 1),
                )
                return
            }

            await db.flowSessions.put(flowSession)

            const initialPrompt = flowHandler.getInitialPrompt(flowSession.flowType)
            await db.messages.add(createAssistantMessage(chat.id, initialPrompt, Date.now() + 1))
        }
    },
}
