// Entspricht Android: SetupScreen + SetupViewModel
import { useRef } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useNavigate } from 'react-router-dom'
import styles from './SetupPage.module.css'

export default function SetupPage() {
    const { state, onApiKeyChange, onPromptIdChange, onVectorStoreIdsChange, onUserIdChange, onSave, onImportBackup } =
        useSettings()
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleSave() {
        const ok = onSave()
        if (ok) navigate('/rooms', { replace: true })
    }

    function handleImportClick() {
        fileInputRef.current?.click()
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) void onImportBackup(file)
        e.target.value = ''
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

            <section className={styles.importSection}>
                <h2 className={styles.importTitle}>Backup importieren</h2>
                <p className={styles.importHint}>
                    Du hast bereits ein Backup? Importiere es, um deine Konfiguration und Daten wiederherzustellen.
                </p>
                <p className={styles.importWarning}>
                    ⚠ Beim Importieren werden alle lokalen Daten ersetzt. Der API-Schlüssel wird nicht gesichert.
                </p>
                <button
                    className={styles.importBtn}
                    onClick={handleImportClick}
                    disabled={state.isImporting}
                >
                    {state.isImporting ? 'Importiere...' : <><span aria-hidden="true">⬆</span> Backup importieren</>}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className={styles.hiddenInput}
                    onChange={handleFileChange}
                />
                {state.backupError && <p className={styles.backupError}>{state.backupError}</p>}
                {state.backupSuccess && <p className={styles.backupSuccess}>{state.backupSuccess}</p>}
            </section>
        </div>
    )
}
