// Entspricht Android: SettingsScreen + SettingsViewModel
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '@/hooks/useSettings'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
    const {
        state,
        onApiKeyChange,
        onPromptIdChange,
        onVectorStoreIdsChange,
        onUserIdChange,
        onSave,
        reloadConfiguration,
        onExportBackup,
        onImportBackup,
    } =
        useSettings()
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)

    function handleSave() {
        onSave()
    }

    function handleImportClick() {
        fileInputRef.current?.click()
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) void onImportBackup(file)
        // Reset so the same file can be re-selected if needed
        e.target.value = ''
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

            {/* ── Backup section ─────────────────────────────────────── */}
            <section className={styles.backupSection}>
                <h2 className={styles.backupTitle}>Backup</h2>

                <div className={styles.backupIndicators}>
                    <span className={state.configBackedUp ? styles.badgeSaved : styles.badgeUnsaved}>
                        {state.configBackedUp ? '✓ Konfiguration gesichert' : '⚠ Konfiguration nicht gesichert'}
                    </span>
                    <span className={state.contentBackedUp ? styles.badgeSaved : styles.badgeUnsaved}>
                        {state.contentBackedUp ? '✓ Räume & Dialoge gesichert' : '⚠ Räume & Dialoge nicht gesichert'}
                    </span>
                </div>

                <p className={styles.backupWarning}>
                    ⚠ Beim Importieren werden alle lokalen Daten ersetzt. Der API-Schlüssel wird nicht gesichert.
                </p>

                <div className={styles.backupActions}>
                    <button
                        className={styles.backupBtn}
                        onClick={() => void onExportBackup()}
                        disabled={state.isExporting || state.isImporting}
                    >
                        {state.isExporting ? 'Exportiere...' : '⬇ Backup exportieren'}
                    </button>
                    <button
                        className={styles.backupBtn}
                        onClick={handleImportClick}
                        disabled={state.isExporting || state.isImporting}
                    >
                        {state.isImporting ? 'Importiere...' : '⬆ Backup importieren'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/json"
                        className={styles.hiddenInput}
                        onChange={handleFileChange}
                    />
                </div>

                {state.backupError && <p className={styles.backupError}>{state.backupError}</p>}
                {state.backupSuccess && <p className={styles.backupSuccess}>{state.backupSuccess}</p>}
            </section>

            <section className={styles.configSection}>
                <div className={styles.configHeader}>
                    <h2>Aktuelle Konfigurationsdaten</h2>
                    <button
                        className={styles.refreshBtn}
                        onClick={() => void reloadConfiguration()}
                        disabled={state.isConfigurationLoading}
                    >
                        {state.isConfigurationLoading ? 'Lese neu...' : 'Konfigurationsdaten neu lesen'}
                    </button>
                </div>

                {state.configurationError && <p className={styles.configError}>{state.configurationError}</p>}

                {state.configurationPrompts.length === 0 ? (
                    <p className={styles.emptyConfig}>
                        Keine Konfiguration geladen. Über den Button kann die Tabelle per API neu gelesen werden.
                    </p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.configTable}>
                            <thead>
                                <tr>
                                    <th>Zweck</th>
                                    <th>Prompt</th>
                                    <th>Prompt-ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.configurationPrompts.map((row, idx) => (
                                    <tr key={`${row.label}-${idx}`}>
                                        <td>{row.label}</td>
                                        <td>{row.prompt}</td>
                                        <td>{row.promptId ?? '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <p className={styles.readOnlyHint}>Die Tabelle ist schreibgeschuetzt und kann nicht direkt editiert werden.</p>
            </section>
        </div>
    )
}
