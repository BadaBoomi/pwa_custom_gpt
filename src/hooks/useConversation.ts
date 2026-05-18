// Entspricht Android: ConversationViewModel
import { useState, useEffect, useCallback } from 'react'
import { chatRepository } from '@/repositories/chatRepository'
import { settingsRepository } from '@/repositories/settingsRepository'
import { parseStarterPrompts } from '@/utils/messageUtils'
import type { Chat, Message } from '@/db/db'

interface ConversationState {
    chat: Chat | null
    roomName: string
    messages: Message[]
    inputText: string
    isLoading: boolean
    error: string | null
}

export function useConversation(chatId: string) {
    const [state, setState] = useState<ConversationState>({
        chat: null,
        roomName: '',
        messages: [],
        inputText: '',
        isLoading: true,
        error: null,
    })

    const loadMessages = useCallback(async () => {
        const messages = await chatRepository.getMessagesForChat(chatId)
        setState((s) => ({ ...s, messages }))
    }, [chatId])

    useEffect(() => {
        const init = async () => {
            try {
                const chat = await chatRepository.getChatById(chatId)
                let roomName = ''
                if (chat) {
                    const rooms = await chatRepository.getAllRooms()
                    roomName = rooms.find((r) => r.id === chat.roomId)?.name ?? ''
                }
                const messages = await chatRepository.getMessagesForChat(chatId)
                setState((s) => ({ ...s, chat: chat ?? null, roomName, messages, isLoading: false }))
            } catch (e) {
                setState((s) => ({ ...s, isLoading: false, error: String(e) }))
            }
        }
        void init()
    }, [chatId])

    const onInputChange = useCallback((text: string) => {
        setState((s) => ({ ...s, inputText: text }))
    }, [])

    // Android: ConversationViewModel.getStarterPrompts()
    const getStarterPrompts = useCallback(() => {
        const md = settingsRepository.getStarters() ?? ''
        return parseStarterPrompts(md)
    }, [])

    const sendMessage = useCallback(async () => {
        const chat = state.chat
        const text = state.inputText.trim()
        if (!chat || !text) return

        const promptId = settingsRepository.getPromptId()
        if (!promptId) return

        const vectorStoreIds = settingsRepository.getVectorStoreIds()

        setState((s) => ({ ...s, inputText: '', isLoading: true, error: null }))

        try {
            await chatRepository.sendMessage(chat, text, promptId, vectorStoreIds)
            await loadMessages()
        } catch (e) {
            setState((s) => ({ ...s, error: String(e) }))
        } finally {
            setState((s) => ({ ...s, isLoading: false }))
        }
    }, [state.chat, state.inputText, loadMessages])

    const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), [])

    return { ...state, onInputChange, sendMessage, getStarterPrompts, clearError }
}
