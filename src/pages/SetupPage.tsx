// Entspricht Android: SetupScreen + SetupViewModel
import { useSettings } from '@/hooks/useSettings'
import { useNavigate } from 'react-router-dom'
import styles from './SetupPage.module.css'

export default function SetupPage() {
    const { state, onApiKeyChange, onPromptIdChange, onVectorStoreIdsChange, onUserIdChange, onSave } =
        useSettings()
    const navigate = useNavigate()

    function handleSave() {
        const ok = onSave()
        if (ok) navigate('/rooms', { replace: true })
    }

    return (
        <div className={styles.page}>
            <h1>Einrichtung</h1>
            <p className={styles.hint}>
                Bitte gib deine OpenAI-Zugangsdaten ein, um die App zu verwenden.
            </p>

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
                <label>Vector Store IDs (kommagetrennt, optional)</label>
                <input
                    type="text"
                    value={state.vectorStoreIds}
                    onChange={(e) => onVectorStoreIdsChange(e.target.value)}
                    placeholder="vs_..., vs_..."
                />
            </div>

            <div className={styles.field}>
                <label>Benutzer-E-Mail (optional)</label>
                <input
                    type="email"
                    value={state.userId}
                    onChange={(e) => onUserIdChange(e.target.value)}
                    placeholder="user@example.com"
                />
            </div>

            <button className={styles.saveBtn} onClick={handleSave}>
                Speichern & starten
            </button>
        </div>
    )
}
