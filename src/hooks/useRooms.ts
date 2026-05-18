// Entspricht Android: RoomListViewModel
import { useState, useEffect, useCallback } from 'react'
import { chatRepository } from '@/repositories/chatRepository'
import type { Room } from '@/db/db'

interface RoomListState {
    rooms: Room[]
    isLoading: boolean
    error: string | null
}

export function useRooms() {
    const [state, setState] = useState<RoomListState>({ rooms: [], isLoading: true, error: null })

    const load = useCallback(async () => {
        try {
            const rooms = await chatRepository.getAllRooms()
            setState({ rooms, isLoading: false, error: null })
        } catch (e) {
            setState((s) => ({ ...s, isLoading: false, error: String(e) }))
        }
    }, [])

    useEffect(() => { void load() }, [load])

    const createRoom = useCallback(async (name: string) => {
        try {
            await chatRepository.createRoom(name)
            await load()
        } catch (e) {
            setState((s) => ({ ...s, error: String(e) }))
        }
    }, [load])

    const renameRoom = useCallback(async (room: Room, newName: string) => {
        try {
            await chatRepository.renameRoom(room, newName)
            await load()
        } catch (e) {
            setState((s) => ({ ...s, error: String(e) }))
        }
    }, [load])

    const deleteRoom = useCallback(async (room: Room) => {
        try {
            await chatRepository.deleteRoom(room)
            await load()
        } catch (e) {
            setState((s) => ({ ...s, error: String(e) }))
        }
    }, [load])

    const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), [])

    return { ...state, createRoom, renameRoom, deleteRoom, clearError }
}
