// Entspricht Android: SetupViewModel + SettingsViewModel
import { useState, useCallback } from 'react'
import { settingsRepository } from '@/repositories/settingsRepository'

export interface SettingsState {
    apiKey: string
    promptId: string
    vectorStoreIds: string
    userId: string
    apiKeyError: string | null
    promptIdError: string | null
    isSaved: boolean
}

function initialState(): SettingsState {
    return {
        apiKey: settingsRepository.getApiKey() ?? '',
        promptId: settingsRepository.getPromptId() ?? '',
        vectorStoreIds: settingsRepository.getVectorStoreIds().join(', '),
        userId: settingsRepository.getUserEmail() ?? '',
        apiKeyError: null,
        promptIdError: null,
        isSaved: false,
    }
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

    return { state, onApiKeyChange, onPromptIdChange, onVectorStoreIdsChange, onUserIdChange, onSave }
}
