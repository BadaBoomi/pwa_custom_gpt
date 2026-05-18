// Entspricht Android: OpenAiApiService (Retrofit) + DTOs
// Strikt von lokaler Persistenz getrennt — kein Dexie-Zugriff hier.

import { settingsRepository } from '@/repositories/settingsRepository'

const BASE_URL = 'https://api.openai.com/v1'

// ── Request / Response DTOs ───────────────────────────────────────────────────
// Entsprechen Android: CreateResponseRequest, ConversationResponse, ResponseApiResult

export interface ConversationResponse {
    id: string
}

export interface CreateResponseRequest {
    model?: string
    input: InputItem[]
    conversation?: string
    prompt?: PromptRef
    tools?: Tool[]
}

export interface InputItem {
    role: string
    content: string
}

export interface PromptRef {
    id: string
}

export interface Tool {
    type: string
    vector_store_ids?: string[]
}

export interface ResponseApiResult {
    id: string
    object: string
    created_at: number
    status: string
    output: OutputItem[]
}

export interface OutputItem {
    id: string
    type: string
    role?: string
    status?: string
    content?: ContentItem[]
}

export interface ContentItem {
    type: string
    text?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTextContent(item: OutputItem): string {
    return item.content?.find((c) => c.type === 'output_text')?.text ?? ''
}

function buildHeaders(): Record<string, string> {
    const apiKey = settingsRepository.getApiKey() ?? ''
    const userEmail = settingsRepository.getUserEmail() ?? ''
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'user-id': userEmail,
    }
}

async function apiFetch<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            ...buildHeaders(),
            ...(init.headers as Record<string, string> | undefined),
        },
    })
    if (!response.ok) {
        const text = await response.text()
        throw new Error(`OpenAI API error ${response.status}: ${text}`)
    }
    return response.json() as Promise<T>
}

// ── Service ───────────────────────────────────────────────────────────────────

export const openAiService = {
    // Android: apiService.createConversation()
    createConversation(): Promise<ConversationResponse> {
        return apiFetch<ConversationResponse>('/conversations', { method: 'POST', body: '{}' })
    },

    // Android: apiService.createResponse(request)
    createResponse(request: CreateResponseRequest): Promise<ResponseApiResult> {
        return apiFetch<ResponseApiResult>('/responses', {
            method: 'POST',
            body: JSON.stringify(request),
        })
    },
}

export { getTextContent }
