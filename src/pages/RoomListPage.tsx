// Entspricht Android: RoomListScreen + RoomListViewModel
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRooms } from '@/hooks/useRooms'
import type { Room } from '@/db/db'
import styles from './RoomListPage.module.css'

export default function RoomListPage() {
    const { rooms, isLoading, error, createRoom, renameRoom, deleteRoom, clearError } = useRooms()
    const navigate = useNavigate()
    const [newRoomName, setNewRoomName] = useState('')
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [editName, setEditName] = useState('')

    async function handleCreate() {
        const name = newRoomName.trim()
        if (!name) return
        await createRoom(name)
        setNewRoomName('')
    }

    function startEdit(room: Room) {
        setEditingRoom(room)
        setEditName(room.name)
    }

    async function handleRename() {
        if (!editingRoom) return
        await renameRoom(editingRoom, editName.trim())
        setEditingRoom(null)
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1>Räume</h1>
                <button className={styles.settingsBtn} onClick={() => navigate('/settings')}>
                    ⚙
                </button>
            </header>

            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={clearError}>✕</button>
                </div>
            )}

            <div className={styles.newRow}>
                <input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
                    placeholder="Neuer Raum..."
                />
                <button onClick={() => void handleCreate()}>+</button>
            </div>

            {isLoading ? (
                <p className={styles.loading}>Lade...</p>
            ) : (
                <ul className={styles.list}>
                    {rooms.map((room) => (
                        <li key={room.id} className={styles.item}>
                            {editingRoom?.id === room.id ? (
                                <div className={styles.editRow}>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && void handleRename()}
                                        autoFocus
                                    />
                                    <button onClick={() => void handleRename()}>✓</button>
                                    <button onClick={() => setEditingRoom(null)}>✕</button>
                                </div>
                            ) : (
                                <>
                                    <span className={styles.name} onClick={() => navigate(`/rooms/${room.id}`)}>
                                        {room.name}
                                    </span>
                                    <div className={styles.actions}>
                                        <button onClick={() => startEdit(room)}>✎</button>
                                        <button onClick={() => void deleteRoom(room)}>🗑</button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
