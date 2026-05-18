// Entspricht Android: SettingsScreen + SettingsViewModel
import { useNavigate } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
    const { state, onApiKeyChange, onPromptIdChange, onVectorStoreIdsChange, onUserIdChange, onSave } =
        useSettings()
    const navigate = useNavigate()

    function handleSave() {
        onSave()
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/rooms')}>
                    ←
                </button>
                <h1>Einstellungen</h1>
            </header>

            <div className={styles.field}>
                <label>API-Schlüssel</label>
                <input
                    type="password"
                    value={state.apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder="sk-..."
                    autoComplete="off"
                />
                {state.apiKeyError && <span className={styles.error}>{state.apiKeyError}</span>}
            </div>

            <div className={styles.field}>
                <label>Prompt-ID</label>
                <input
                    type="text"
                    value={state.promptId}
                    onChange={(e) => onPromptIdChange(e.target.value)}
                    placeholder="asst_..."
                    autoComplete="off"
                />
                {state.promptIdError && <span className={styles.error}>{state.promptIdError}</span>}
            </div>

            <div className={styles.field}>
                <label>Vector Store IDs (kommagetrennt)</label>
                <input
                    type="text"
                    value={state.vectorStoreIds}
                    onChange={(e) => onVectorStoreIdsChange(e.target.value)}
                    placeholder="vs_..., vs_..."
                />
            </div>

            <div className={styles.field}>
                <label>Benutzer-E-Mail</label>
                <input
                    type="email"
                    value={state.userId}
                    onChange={(e) => onUserIdChange(e.target.value)}
                    placeholder="user@example.com"
                />
            </div>

            <button className={styles.saveBtn} onClick={handleSave}>
                Speichern
            </button>

            {state.isSaved && <p className={styles.saved}>✓ Gespeichert</p>}
        </div>
    )
}
