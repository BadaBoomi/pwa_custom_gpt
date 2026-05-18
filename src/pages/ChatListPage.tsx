// Entspricht Android: ChatListScreen + ChatListViewModel
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useChats } from '@/hooks/useChats'
import type { Chat } from '@/db/db'
import styles from './ChatListPage.module.css'

export default function ChatListPage() {
    const { roomId } = useParams<{ roomId: string }>()
    const navigate = useNavigate()
    const { chats, rooms, roomName, isLoading, error, createChat, renameChat, deleteChat, moveChatToRoom, clearError } =
        useChats(roomId!)

    const [newChatName, setNewChatName] = useState('')
    const [editingChat, setEditingChat] = useState<Chat | null>(null)
    const [editName, setEditName] = useState('')
    const [movingChat, setMovingChat] = useState<Chat | null>(null)

    async function handleCreate() {
        const name = newChatName.trim()
        if (!name) return
        setNewChatName('')
        await createChat(name, (chatId) => navigate(`/chat/${chatId}`))
    }

    async function handleRename() {
        if (!editingChat) return
        await renameChat(editingChat, editName.trim())
        setEditingChat(null)
    }

    const otherRooms = rooms.filter((r) => r.id !== roomId)

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/rooms')}>
                    ←
                </button>
                <h1>{roomName ?? 'Konversationen'}</h1>
            </header>

            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={clearError}>✕</button>
                </div>
            )}

            <div className={styles.newRow}>
                <input
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleCreate()}
                    placeholder="Neue Konversation..."
                    disabled={isLoading}
                />
                <button onClick={() => void handleCreate()} disabled={isLoading}>
                    {isLoading ? '…' : '+'}
                </button>
            </div>

            {isLoading && !chats.length ? (
                <p className={styles.loading}>Lade...</p>
            ) : (
                <ul className={styles.list}>
                    {chats.map((chat) => (
                        <li key={chat.id} className={styles.item}>
                            {editingChat?.id === chat.id ? (
                                <div className={styles.editRow}>
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && void handleRename()}
                                        autoFocus
                                    />
                                    <button onClick={() => void handleRename()}>✓</button>
                                    <button onClick={() => setEditingChat(null)}>✕</button>
                                </div>
                            ) : movingChat?.id === chat.id ? (
                                <div className={styles.moveRow}>
                                    <span>Verschieben nach:</span>
                                    {otherRooms.map((r) => (
                                        <button
                                            key={r.id}
                                            onClick={async () => {
                                                await moveChatToRoom(chat, r.id)
                                                setMovingChat(null)
                                            }}
                                        >
                                            {r.name}
                                        </button>
                                    ))}
                                    <button onClick={() => setMovingChat(null)}>✕</button>
                                </div>
                            ) : (
                                <>
                                    <span className={styles.name} onClick={() => navigate(`/chat/${chat.id}`)}>
                                        {chat.name}
                                    </span>
                                    <div className={styles.actions}>
                                        <button onClick={() => { setEditingChat(chat); setEditName(chat.name) }}>✎</button>
                                        {otherRooms.length > 0 && (
                                            <button onClick={() => setMovingChat(chat)}>↗</button>
                                        )}
                                        <button onClick={() => void deleteChat(chat)}>🗑</button>
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
