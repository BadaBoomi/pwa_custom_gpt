// Entspricht Android: SettingsRepository + EncryptedPrefsManager + UserRepository
// Persistenz: localStorage (kein Web-Äquivalent zu EncryptedSharedPreferences ohne Backend)
// Hinweis: API-Key liegt unverschlüsselt im localStorage – akzeptiertes Tradeoff für Local-First-PWA.

const KEY_API_KEY = 'api_key'
const KEY_PROMPT_ID = 'prompt_id'
const KEY_USER_EMAIL = 'user_email'
const KEY_STARTERS = 'starters'
const KEY_VECTOR_STORE_IDS = 'vector_store_ids'

export const settingsRepository = {
    // ── API Key ──────────────────────────────────────────────────────────────
    getApiKey(): string | null {
        return localStorage.getItem(KEY_API_KEY)
    },
    saveApiKey(apiKey: string): void {
        localStorage.setItem(KEY_API_KEY, apiKey)
    },

    // ── Prompt ID ─────────────────────────────────────────────────────────────
    getPromptId(): string | null {
        return localStorage.getItem(KEY_PROMPT_ID)
    },
    savePromptId(promptId: string): void {
        localStorage.setItem(KEY_PROMPT_ID, promptId)
    },

    // ── Vector Store IDs ─────────────────────────────────────────────────────
    getVectorStoreIds(): string[] {
        const raw = localStorage.getItem(KEY_VECTOR_STORE_IDS)
        if (!raw) return []
        return raw.split(',').map((s) => s.trim()).filter(Boolean)
    },
    saveVectorStoreIds(ids: string[]): void {
        localStorage.setItem(KEY_VECTOR_STORE_IDS, ids.join(','))
    },

    // ── Starters (Markdown-Tabelle) ───────────────────────────────────────────
    getStarters(): string | null {
        return localStorage.getItem(KEY_STARTERS)
    },
    saveStarters(starters: string): void {
        localStorage.setItem(KEY_STARTERS, starters)
    },

    // ── User e-mail / ID (Android: UserRepository) ───────────────────────────
    getUserEmail(): string | null {
        return localStorage.getItem(KEY_USER_EMAIL)
    },
    saveUserEmail(email: string): void {
        localStorage.setItem(KEY_USER_EMAIL, email)
    },

    // ── Setup guard ───────────────────────────────────────────────────────────
    // Android: EncryptedPrefsManager.isSetupComplete()
    isSetupComplete(): boolean {
        const key = settingsRepository.getApiKey()
        const id = settingsRepository.getPromptId()
        return Boolean(key?.trim()) && Boolean(id?.trim())
    },
}
