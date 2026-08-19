// Backup service: export/import of all local data (rooms, chats, messages, flow sessions, settings).
// API key is intentionally excluded from the backup payload.

import { db, type Chat, type FlowSession, type Message, type Room } from '@/db/db'
import { settingsRepository } from '@/repositories/settingsRepository'
import { normalizeRoomCustomAttributes } from '@/utils/roomUtils'

const BACKUP_VERSION = 1

// ── Freshness markers ─────────────────────────────────────────────────────────
const KEY_CONFIG_MARKER = 'backup_config_marker'
const KEY_CONTENT_MARKER = 'backup_content_marker'

const SELECTED_CONFIG_PREFIX = 'selected_config_'

// ── Payload shape ─────────────────────────────────────────────────────────────

export interface SettingsSnapshot {
    promptId: string | null
    vectorStoreIds: string[]
    userEmail: string | null
    starters: string | null
}

export interface SelectedConfigEntry {
    key: string
    value: string
}

export interface BackupPayload {
    version: number
    exportedAt: string // ISO timestamp
    settings: SettingsSnapshot
    rooms: Room[]
    chats: Chat[]
    messages: Message[]
    flowSessions: FlowSession[]
    selectedConfigs: SelectedConfigEntry[]
}

// ── Freshness marker computation ──────────────────────────────────────────────

function computeConfigSignature(): string {
    return JSON.stringify({
        promptId: settingsRepository.getPromptId(),
        vectorStoreIds: settingsRepository.getVectorStoreIds(),
        userEmail: settingsRepository.getUserEmail(),
        starters: settingsRepository.getStarters(),
    })
}

async function computeContentSignature(): Promise<string> {
    const [rooms, chats, messages, flowSessions] = await Promise.all([
        db.rooms.toArray(),
        db.chats.toArray(),
        db.messages.toArray(),
        db.flowSessions.toArray(),
    ])
    return JSON.stringify({
        rooms: rooms.map((r) => ({
            id: r.id,
            name: r.name,
            customAttributes: normalizeRoomCustomAttributes(r.customAttributes),
            createdAt: r.createdAt,
        })),
        chats: chats.map((c) => ({
            id: c.id,
            roomId: c.roomId,
            name: c.name,
            threadId: c.threadId,
            createdAt: c.createdAt,
        })),
        messages: messages.map((m) => ({
            id: m.id,
            chatId: m.chatId,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
        })),
        flowSessions: flowSessions.map((f) => ({
            chatId: f.chatId,
            status: f.status,
            currentStep: f.currentStep,
            updatedAt: f.updatedAt,
        })),
    })
}

export function updateConfigMarker(): void {
    localStorage.setItem(KEY_CONFIG_MARKER, computeConfigSignature())
}

export async function updateContentMarker(): Promise<void> {
    const sig = await computeContentSignature()
    localStorage.setItem(KEY_CONTENT_MARKER, sig)
}

export function isConfigSaved(): boolean {
    const stored = localStorage.getItem(KEY_CONFIG_MARKER)
    return stored !== null && stored === computeConfigSignature()
}

export async function isContentSaved(): Promise<boolean> {
    const stored = localStorage.getItem(KEY_CONTENT_MARKER)
    if (stored === null) return false
    const current = await computeContentSignature()
    return stored === current
}

// ── Selected configs (localStorage keys with selected_config_ prefix) ─────────

function getSelectedConfigEntries(): SelectedConfigEntry[] {
    const entries: SelectedConfigEntry[] = []
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(SELECTED_CONFIG_PREFIX)) {
            const value = localStorage.getItem(key)
            if (value !== null) entries.push({ key, value })
        }
    }
    return entries
}

function restoreSelectedConfigEntries(entries: SelectedConfigEntry[]): void {
    // Remove old selected_config_ entries
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(SELECTED_CONFIG_PREFIX)) toRemove.push(key)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
    // Restore from backup
    entries.forEach(({ key, value }) => localStorage.setItem(key, value))
}

// ── Export ─────────────────────────────────────────────────────────────────────

export async function exportBackup(): Promise<void> {
    const [rooms, chats, messages, flowSessions] = await Promise.all([
        db.rooms.toArray(),
        db.chats.toArray(),
        db.messages.toArray(),
        db.flowSessions.toArray(),
    ])

    const payload: BackupPayload = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        settings: {
            promptId: settingsRepository.getPromptId(),
            vectorStoreIds: settingsRepository.getVectorStoreIds(),
            userEmail: settingsRepository.getUserEmail(),
            starters: settingsRepository.getStarters(),
        },
        rooms,
        chats,
        messages,
        flowSessions,
        selectedConfigs: getSelectedConfigEntries(),
    }

    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().slice(0, 10)
    a.download = `acustomgpt_backup_${date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    // Update both markers after successful export
    updateConfigMarker()
    await updateContentMarker()
}

// ── Payload validation ────────────────────────────────────────────────────────

function validatePayload(raw: unknown): BackupPayload {
    if (!raw || typeof raw !== 'object') throw new Error('Ungültige Backup-Datei: kein JSON-Objekt')
    const obj = raw as Record<string, unknown>

    if (obj.version !== BACKUP_VERSION) {
        throw new Error(`Nicht unterstützte Backup-Version: ${obj.version ?? 'unbekannt'}`)
    }
    if (!obj.settings || typeof obj.settings !== 'object') {
        throw new Error('Ungültige Backup-Datei: settings fehlt')
    }
    for (const field of ['rooms', 'chats', 'messages', 'flowSessions'] as const) {
        if (!Array.isArray(obj[field])) {
            throw new Error(`Ungültige Backup-Datei: ${field} muss ein Array sein`)
        }
    }
    if (!Array.isArray(obj.selectedConfigs)) {
        obj.selectedConfigs = []
    }

    obj.rooms = (obj.rooms as unknown[]).map((room) => {
        if (!room || typeof room !== 'object') return room
        const typedRoom = room as Room
        return {
            ...typedRoom,
            customAttributes: normalizeRoomCustomAttributes(typedRoom.customAttributes),
        }
    })

    return obj as unknown as BackupPayload
}

// ── Import ─────────────────────────────────────────────────────────────────────

export async function importBackup(file: File): Promise<void> {
    const text = await file.text()
    let raw: unknown
    try {
        raw = JSON.parse(text)
    } catch {
        throw new Error('Datei ist kein gültiges JSON')
    }

    const payload = validatePayload(raw)

    // Replace all Dexie data in a single transaction (safe order)
    await db.transaction('rw', db.rooms, db.chats, db.messages, db.flowSessions, async () => {
        await db.rooms.clear()
        await db.chats.clear()
        await db.messages.clear()
        await db.flowSessions.clear()

        if (payload.rooms.length > 0) await db.rooms.bulkAdd(payload.rooms)
        if (payload.chats.length > 0) await db.chats.bulkAdd(payload.chats)
        if (payload.messages.length > 0) await db.messages.bulkAdd(payload.messages)
        if (payload.flowSessions.length > 0) await db.flowSessions.bulkAdd(payload.flowSessions)
    })

    // Restore settings (without API key)
    const s = payload.settings
    if (s.promptId !== null && s.promptId !== undefined) settingsRepository.savePromptId(s.promptId)
    if (s.vectorStoreIds) settingsRepository.saveVectorStoreIds(s.vectorStoreIds)
    if (s.userEmail !== null && s.userEmail !== undefined) settingsRepository.saveUserEmail(s.userEmail)
    if (s.starters !== null && s.starters !== undefined) settingsRepository.saveStarters(s.starters)

    // Restore selected config entries
    restoreSelectedConfigEntries(payload.selectedConfigs ?? [])

    // Update both markers after successful import
    updateConfigMarker()
    await updateContentMarker()
}
