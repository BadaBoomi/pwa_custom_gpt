// Entspricht Android: ChatListViewModel
import { useState, useEffect, useCallback } from 'react'
import { chatRepository } from '@/repositories/chatRepository'
import type { Chat, Room } from '@/db/db'

interface ChatListState {
    chats: Chat[]
    rooms: Room[]
    roomName: string | null
    isLoading: boolean
    error: string | null
}

export function useChats(roomId: string) {
    const [state, setState] = useState<ChatListState>({
        chats: [],
        rooms: [],
        roomName: null,
        isLoading: true,
        error: null,
    })

    const load = useCallback(async () => {
        try {
            const [chats, rooms] = await Promise.all([
                chatRepository.getChatsForRoom(roomId),
                chatRepository.getAllRooms(),
            ])
            const roomName = rooms.find((r) => r.id === roomId)?.name ?? null
            setState({ chats, rooms, roomName, isLoading: false, error: null })
        } catch (e) {
            setState((s) => ({ ...s, isLoading: false, error: String(e) }))
        }
    }, [roomId])

    useEffect(() => { void load() }, [load])

    const createChat = useCallback(
        async (name: string, onCreated: (chatId: string) => void) => {
            setState((s) => ({ ...s, isLoading: true }))
            try {
                const chat = await chatRepository.createChat(roomId, name)
                setState((s) => ({ ...s, isLoading: false }))
                onCreated(chat.id)
                await load()
            } catch (e) {
                setState((s) => ({ ...s, isLoading: false, error: String(e) }))
            }
        },
        [roomId, load],
    )

    const renameChat = useCallback(async (chat: Chat, newName: string) => {
        try {
            await chatRepository.renameChat(chat, newName)
            await load()
        } catch (e) {
            setState((s) => ({ ...s, error: String(e) }))
        }
    }, [load])

    const deleteChat = useCallback(async (chat: Chat) => {
        try {
            await chatRepository.deleteChat(chat)
            await load()
        } catch (e) {
            setState((s) => ({ ...s, error: String(e) }))
        }
    }, [load])

    const moveChatToRoom = useCallback(async (chat: Chat, targetRoomId: string) => {
        try {
            await chatRepository.moveChatToRoom(chat, targetRoomId)
            await load()
        } catch (e) {
            setState((s) => ({ ...s, error: String(e) }))
        }
    }, [load])

    const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), [])

    return { ...state, createChat, renameChat, deleteChat, moveChatToRoom, clearError }
}
