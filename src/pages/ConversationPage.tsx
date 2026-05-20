// Entspricht Android: ConversationScreen + ConversationViewModel
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useConversation } from '@/hooks/useConversation'
import styles from './ConversationPage.module.css'

export default function ConversationPage() {
    const { chatId } = useParams<{ chatId: string }>()
    const navigate = useNavigate()
    const {
        chat,
        roomName,
        messages,
        inputText,
        configurationEntries,
        selectedConfiguration,
        isLoading,
        error,
        onInputChange,
        selectConfigurationEntry,
        sendMessage,
        requiresConfigurationSelection,
        clearError,
    } =
        useConversation(chatId!)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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

            <div className={styles.configSelector}>
                <div className={styles.configHeaderLine}>
                    <span className={styles.configTitle}>Was möchten Sie tun?</span>
                    {selectedConfiguration && (
                        <span className={styles.selectedInfo}>Aktiv: {selectedConfiguration.label}</span>
                    )}
                </div>

                <div className={styles.starters}>
                    {configurationEntries.map((entry) => (
                        <button
                            key={`${entry.label}-${entry.promptId ?? 'none'}`}
                            className={`${styles.starterChip} ${selectedConfiguration?.label === entry.label && selectedConfiguration?.promptId === entry.promptId ? styles.starterChipActive : ''}`}
                            onClick={() => {
                                selectConfigurationEntry(entry)
                            }}
                        >
                            {entry.label}
                        </button>
                    ))}
                </div>

                {requiresConfigurationSelection && (
                    <p className={styles.selectionHint}>
                        Vor dem Senden muss ein Zweck ausgewaehlt werden. Die aktive Auswahl steuert die verwendete Prompt-ID.
                    </p>
                )}
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
                <button
                    onClick={() => void sendMessage()}
                    disabled={isLoading || !inputText.trim() || requiresConfigurationSelection}
                >
                    ➤
                </button>
            </div>
        </div>
    )
}
