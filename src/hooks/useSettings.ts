// Entspricht Android: SetupViewModel + SettingsViewModel
import { useState, useCallback } from 'react'
import { settingsRepository } from '@/repositories/settingsRepository'
import { openAiService, getTextContent } from '@/services/openAiService'
import { parseStarterPrompts } from '@/utils/messageUtils'

interface ConfigurationPrompt {
    label: string
    prompt: string
    promptId?: string
}

export interface SettingsState {
    apiKey: string
    promptId: string
    vectorStoreIds: string
    userId: string
    apiKeyError: string | null
    promptIdError: string | null
    isSaved: boolean
    configurationPrompts: ConfigurationPrompt[]
    isConfigurationLoading: boolean
    configurationError: string | null
}

function initialState(): SettingsState {
    const startersMd = settingsRepository.getStarters() ?? ''

    return {
        apiKey: settingsRepository.getApiKey() ?? '',
        promptId: settingsRepository.getPromptId() ?? '',
        vectorStoreIds: settingsRepository.getVectorStoreIds().join(', '),
        userId: settingsRepository.getUserEmail() ?? '',
        apiKeyError: null,
        promptIdError: null,
        isSaved: false,
        configurationPrompts: parseStarterPrompts(startersMd),
        isConfigurationLoading: false,
        configurationError: null,
    }
}

function rowsToStartersMarkdown(rows: ConfigurationPrompt[]): string {
    const header = '| Zweck | Prompt |'
    const separator = '|---|---|'
    const body = rows.map((row) => `| ${row.label} | ${row.prompt} |`)
    return [header, separator, ...body].join('\n')
}

function normalizeConfigRowsFromUnknown(value: unknown): ConfigurationPrompt[] {
    if (!value || typeof value !== 'object') return []

    const obj = value as Record<string, unknown>
    const labelRaw = obj.Zweck ?? obj.Desc ?? obj.Description ?? obj.label ?? obj.name ?? obj.title
    const promptRaw = obj.Prompt ?? obj.prompt ?? obj.text ?? obj.value
    const promptIdRaw = obj['Pmpt-ID'] ?? obj['Prompt-ID'] ?? obj.promptId ?? obj.pmptId

    const label = typeof labelRaw === 'string' ? labelRaw.trim() : ''
    const prompt = typeof promptRaw === 'string' ? promptRaw.trim() : ''
    const promptId = typeof promptIdRaw === 'string' ? promptIdRaw.trim() : undefined

    if (!label && !prompt) return []
    return [{ label: label || 'Ohne Bezeichnung', prompt, promptId }]
}

function parseConfigurationPrompts(rawText: string): ConfigurationPrompt[] {
    const trimmed = rawText.trim()

    // 1) JSON-Codeblock aus output_text erkennen
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
    const jsonCandidate = codeBlockMatch?.[1]?.trim() ?? trimmed

    // 2) JSON-Formate akzeptieren: { configuration: [...] } oder direkt [...]
    try {
        const parsed = JSON.parse(jsonCandidate) as unknown

        if (Array.isArray(parsed)) {
            const rows = parsed.flatMap((item) => normalizeConfigRowsFromUnknown(item))
            if (rows.length > 0) return rows
        }

        if (parsed && typeof parsed === 'object') {
            const parsedObj = parsed as Record<string, unknown>
            const listCandidate = parsedObj.configuration ?? parsedObj.prompts ?? parsedObj.starters ?? parsedObj.data
            if (Array.isArray(listCandidate)) {
                const rows = listCandidate.flatMap((item) => normalizeConfigRowsFromUnknown(item))
                if (rows.length > 0) return rows
            }
        }
    } catch {
        // Kein JSON, dann ggf. Markdown-Tabelle
    }

    // 3) Fallback: bestehende Markdown-Tabellenlogik
    return parseStarterPrompts(rawText).map((row) => ({ label: row.label, prompt: row.prompt }))
}

export function useSettings() {
    const [state, setState] = useState<SettingsState>(initialState)

    const onApiKeyChange = useCallback((value: string) => {
        const cleaned = value.split('\n').map((l) => l.trim()).filter(Boolean).join('')
        setState((s) => ({ ...s, apiKey: cleaned, apiKeyError: null, isSaved: false }))
    }, [])

    const onPromptIdChange = useCallback((value: string) => {
        const cleaned = value.split('\n').map((l) => l.trim()).filter(Boolean).join('')
        setState((s) => ({ ...s, promptId: cleaned, promptIdError: null, isSaved: false }))
    }, [])

    const onVectorStoreIdsChange = useCallback((value: string) => {
        setState((s) => ({ ...s, vectorStoreIds: value, isSaved: false }))
    }, [])

    const onUserIdChange = useCallback((value: string) => {
        setState((s) => ({ ...s, userId: value, isSaved: false }))
    }, [])

    // Android: SetupViewModel.onSave / SettingsViewModel.onSave
    const onSave = useCallback((): boolean => {
        const s = state
        const apiKeyError = !s.apiKey.startsWith('sk-') ? "API-Schlüssel muss mit 'sk-' beginnen" : null
        const promptIdError = !s.promptId.trim() ? 'Prompt-ID darf nicht leer sein' : null

        if (apiKeyError || promptIdError) {
            setState((prev) => ({ ...prev, apiKeyError, promptIdError }))
            return false
        }

        const parsedVsIds = s.vectorStoreIds.split(',').map((v) => v.trim()).filter(Boolean)
        settingsRepository.saveApiKey(s.apiKey.trim())
        settingsRepository.savePromptId(s.promptId.trim())
        settingsRepository.saveVectorStoreIds(parsedVsIds)
        if (s.userId.trim()) settingsRepository.saveUserEmail(s.userId.trim())
        setState((prev) => ({ ...prev, isSaved: true, apiKeyError: null, promptIdError: null }))
        return true
    }, [state])

    const reloadConfiguration = useCallback(async () => {
        const promptId = state.promptId.trim()
        if (!promptId) {
            setState((prev) => ({ ...prev, configurationError: 'Prompt-ID darf nicht leer sein' }))
            return
        }

        const vectorStoreIds = state.vectorStoreIds.split(',').map((v) => v.trim()).filter(Boolean)
        const userEmail = state.userId.trim()

        setState((prev) => ({ ...prev, isConfigurationLoading: true, configurationError: null }))

        try {
            const response = await openAiService.readConfiguration(promptId, vectorStoreIds, userEmail)
            const assistantMessages = response.output.filter(
                (item) => item.type === 'message' && item.role === 'assistant',
            )

            const mergedText = assistantMessages.map((item) => getTextContent(item)).join('\n').trim()
            const rows = parseConfigurationPrompts(mergedText)

            if (rows.length === 0) {
                throw new Error('Keine Konfigurationstabelle in der Antwort gefunden')
            }

            const startersMd = rowsToStartersMarkdown(rows)

            settingsRepository.saveStarters(startersMd)

            setState((prev) => ({
                ...prev,
                configurationPrompts: rows,
                isConfigurationLoading: false,
                configurationError: null,
            }))
        } catch (e) {
            setState((prev) => ({
                ...prev,
                isConfigurationLoading: false,
                configurationError: e instanceof Error ? e.message : 'Konfiguration konnte nicht gelesen werden',
            }))
        }
    }, [state.promptId, state.vectorStoreIds, state.userId])

    return {
        state,
        onApiKeyChange,
        onPromptIdChange,
        onVectorStoreIdsChange,
        onUserIdChange,
        onSave,
        reloadConfiguration,
    }
}
