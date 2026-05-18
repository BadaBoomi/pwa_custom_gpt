// Entspricht Android: ConversationScreen + ConversationViewModel
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useConversation } from '@/hooks/useConversation'
import styles from './ConversationPage.module.css'

export default function ConversationPage() {
    const { chatId } = useParams<{ chatId: string }>()
    const navigate = useNavigate()
    const { chat, roomName, messages, inputText, isLoading, error, onInputChange, sendMessage, getStarterPrompts, clearError } =
        useConversation(chatId!)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const starters = getStarterPrompts()

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(`/rooms/${chat?.roomId ?? ''}`)}>
                    ←
                </button>
                <div className={styles.titles}>
                    <span className={styles.chatName}>{chat?.name ?? '…'}</span>
                    <span className={styles.roomName}>{roomName}</span>
                </div>
            </header>

            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={clearError}>✕</button>
                </div>
            )}

            <div className={styles.messages}>
                {messages.length === 0 && !isLoading && starters.length > 0 && (
                    <div className={styles.starters}>
                        {starters.map((s) => (
                            <button
                                key={s.label}
                                className={styles.starterChip}
                                onClick={() => {
                                    onInputChange(s.prompt)
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${styles.bubble} ${msg.role === 'user' ? styles.user : styles.assistant}`}
                    >
                        <p>{msg.content}</p>
                    </div>
                ))}

                {isLoading && (
                    <div className={`${styles.bubble} ${styles.assistant}`}>
                        <span className={styles.typing}>…</span>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            <div className={styles.inputRow}>
                <textarea
                    value={inputText}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            void sendMessage()
                        }
                    }}
                    placeholder="Nachricht eingeben…"
                    rows={1}
                    disabled={isLoading}
                />
                <button onClick={() => void sendMessage()} disabled={isLoading || !inputText.trim()}>
                    ➤
                </button>
            </div>
        </div>
    )
}
