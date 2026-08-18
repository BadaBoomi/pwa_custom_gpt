// Entspricht Android: ConversationViewModel
import { useState, useEffect, useCallback } from 'react'
import { chatRepository } from '@/repositories/chatRepository'
import { settingsRepository } from '@/repositories/settingsRepository'
import { parseStarterPrompts } from '@/utils/messageUtils'
import type { Chat, Message } from '@/db/db'

interface ConfigurationEntry {
    label: string
    prompt: string
    promptId?: string
}

interface ActiveFlow {
    flowId: string
    flowType: string
    status: string
    currentStep: string
    stepLabel: string
    updatedAt: number
}

const SELECTED_CONFIG_STORAGE_PREFIX = 'selected_config_'

interface ConversationState {
    chat: Chat | null
    roomName: string
    messages: Message[]
    activeFlow: ActiveFlow | null
    inputText: string
    configurationEntries: ConfigurationEntry[]
    selectedConfiguration: ConfigurationEntry | null
    isLoading: boolean
    error: string | null
}

export function useConversation(chatId: string) {
    const [state, setState] = useState<ConversationState>({
        chat: null,
        roomName: '',
        messages: [],
        activeFlow: null,
        inputText: '',
        configurationEntries: [],
        selectedConfiguration: null,
        isLoading: true,
        error: null,
    })

    const loadMessages = useCallback(async () => {
        const messages = await chatRepository.getMessagesForChat(chatId)
        setState((s) => ({ ...s, messages }))
    }, [chatId])

    const loadActiveFlow = useCallback(async () => {
        const activeFlow = await chatRepository.getActiveFlowForChat(chatId)
        setState((s) => ({ ...s, activeFlow }))
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
                const activeFlow = await chatRepository.getActiveFlowForChat(chatId)
                const configurationEntries = parseStarterPrompts(settingsRepository.getStarters() ?? '')

                const persisted = localStorage.getItem(`${SELECTED_CONFIG_STORAGE_PREFIX}${chatId}`)
                let selectedConfiguration: ConfigurationEntry | null = null
                if (persisted) {
                    try {
                        const parsed = JSON.parse(persisted) as ConfigurationEntry
                        selectedConfiguration = configurationEntries.find(
                            (entry) =>
                                entry.label === parsed.label &&
                                entry.prompt === parsed.prompt &&
                                entry.promptId === parsed.promptId,
                        ) ?? null
                    } catch {
                        selectedConfiguration = null
                    }
                }

                setState((s) => ({
                    ...s,
                    chat: chat ?? null,
                    roomName,
                    messages,
                    activeFlow,
                    configurationEntries,
                    selectedConfiguration,
                    isLoading: false,
                }))
            } catch (e) {
                setState((s) => ({ ...s, isLoading: false, error: String(e) }))
            }
        }
        void init()
    }, [chatId])

    const onInputChange = useCallback((text: string) => {
        setState((s) => ({ ...s, inputText: text }))
    }, [])

    const selectConfigurationEntry = useCallback((entry: ConfigurationEntry) => {
        localStorage.setItem(`${SELECTED_CONFIG_STORAGE_PREFIX}${chatId}`, JSON.stringify(entry))
        setState((s) => ({
            ...s,
            selectedConfiguration: entry,
            inputText: entry.prompt,
            error: null,
        }))
    }, [chatId])

    const sendMessage = useCallback(async () => {
        const chat = state.chat
        const text = state.inputText.trim()
        if (!chat || !text) return

        if (!state.selectedConfiguration) {
            setState((s) => ({
                ...s,
                error: 'Bitte zuerst einen Zweck aus, bevor eine Nachricht gesendet wird.',
            }))
            return
        }

        const selectedPromptId = state.selectedConfiguration?.promptId?.trim()
        const promptId = selectedPromptId || null

        if (!promptId) {
            setState((s) => ({
                ...s,
                error: 'Die ausgewaehlte Konfiguration enthaelt keine Prompt-ID. Bitte Konfigurationsdaten neu lesen und erneut wählen.',
            }))
            return
        }

        const vectorStoreIds = settingsRepository.getVectorStoreIds()

        setState((s) => ({ ...s, inputText: '', isLoading: true, error: null }))

        try {
            await chatRepository.sendMessage(chat, text, promptId, vectorStoreIds)
            await Promise.all([loadMessages(), loadActiveFlow()])
        } catch (e) {
            setState((s) => ({ ...s, error: String(e) }))
        } finally {
            setState((s) => ({ ...s, isLoading: false }))
        }
    }, [state.chat, state.inputText, state.selectedConfiguration, loadActiveFlow, loadMessages])

    const requiresConfigurationSelection = !state.selectedConfiguration

    const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), [])

    return {
        ...state,
        onInputChange,
        selectConfigurationEntry,
        sendMessage,
        requiresConfigurationSelection,
        clearError,
    }
}
