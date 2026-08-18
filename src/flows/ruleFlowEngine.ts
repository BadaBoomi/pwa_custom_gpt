import type { FlowSession } from '@/db/db'

export const START_RULE_FLOW_TOOL = 'start_rule_flow'
export const DEFAULT_RULE_FLOW_TYPE = 'collect_contact'

export interface RuleFlowDirective {
    flowType: string
    cleanedText: string
}

interface FlowHandlingResult {
    nextStep: string
    status: FlowSession['status']
    answers: Record<string, string>
    assistantReply: string
    resultSummary?: string
}

const TRIGGER_TOKEN_REGEX = /\[\[start_rule_flow(?::([a-z0-9_\-]+))?\]\]/i
const EMAIL_OR_PHONE = new Set(['email', 'phone'])

function normalizeFlowType(value: unknown): string {
    if (typeof value === 'string' && value.trim()) {
        return value.trim().toLowerCase()
    }
    return DEFAULT_RULE_FLOW_TYPE
}

function extractLeadingJsonObject(text: string): [string, string] | null {
    const start = [...text].findIndex((ch) => ch.trim() !== '')
    if (start === -1 || text[start] !== '{') return null

    let depth = 0
    let inString = false
    let escaped = false

    for (let i = start; i < text.length; i++) {
        const ch = text[i]
        if (escaped) {
            escaped = false
            continue
        }
        if (ch === '\\' && inString) {
            escaped = true
            continue
        }
        if (ch === '"') {
            inString = !inString
            continue
        }
        if (inString) continue
        if (ch === '{') depth++
        if (ch === '}') {
            depth--
            if (depth === 0) {
                return [text.slice(start, i + 1), text.slice(i + 1).trim()]
            }
        }
    }

    return null
}

function parseDirectiveFromJson(jsonPart: string): string | null {
    try {
        const parsed = JSON.parse(jsonPart) as Record<string, unknown>

        if (parsed.start_rule_flow && typeof parsed.start_rule_flow === 'object') {
            return normalizeFlowType((parsed.start_rule_flow as Record<string, unknown>).flowType)
        }

        if (parsed.tool === START_RULE_FLOW_TOOL) {
            return normalizeFlowType(parsed.flowType)
        }

        if (
            parsed.function_call &&
            typeof parsed.function_call === 'object' &&
            (parsed.function_call as Record<string, unknown>).name === START_RULE_FLOW_TOOL
        ) {
            const args = (parsed.function_call as Record<string, unknown>).arguments
            if (typeof args === 'string' && args.trim().startsWith('{')) {
                try {
                    const parsedArgs = JSON.parse(args) as Record<string, unknown>
                    return normalizeFlowType(parsedArgs.flowType)
                } catch {
                    return DEFAULT_RULE_FLOW_TYPE
                }
            }
            if (args && typeof args === 'object') {
                return normalizeFlowType((args as Record<string, unknown>).flowType)
            }
            return DEFAULT_RULE_FLOW_TYPE
        }
    } catch {
        return null
    }

    return null
}

export function parseRuleFlowDirective(text: string): RuleFlowDirective | null {
    const trimmed = text.trim()
    const triggerMatch = TRIGGER_TOKEN_REGEX.exec(trimmed)
    if (triggerMatch) {
        const flowType = normalizeFlowType(triggerMatch[1])
        const cleanedText = trimmed.replace(triggerMatch[0], '').trim()
        return { flowType, cleanedText }
    }

    const leading = extractLeadingJsonObject(trimmed)
    if (!leading) return null

    const [jsonPart, remaining] = leading
    const flowType = parseDirectiveFromJson(jsonPart)
    if (!flowType) return null

    return {
        flowType,
        cleanedText: remaining,
    }
}

export function createInitialFlowSession(chatId: string, flowType: string): FlowSession {
    const now = Date.now()
    return {
        chatId,
        flowId: crypto.randomUUID(),
        flowType: normalizeFlowType(flowType),
        status: 'running',
        currentStep: 'ask_name',
        answers: {},
        createdAt: now,
        updatedAt: now,
    }
}

export function getInitialPrompt(flowType: string): string {
    const normalized = normalizeFlowType(flowType)
    if (normalized !== DEFAULT_RULE_FLOW_TYPE) {
        return 'Deterministic flow started. Please tell me your name.'
    }
    return 'Deterministic flow started. What is your name?'
}

export function handleFlowTurn(session: FlowSession, userInput: string): FlowHandlingResult {
    const input = userInput.trim()

    if (!input) {
        return {
            nextStep: session.currentStep,
            status: 'running',
            answers: session.answers,
            assistantReply: 'Please provide a value so we can continue.',
        }
    }

    if (session.currentStep === 'ask_name') {
        if (input.length < 2) {
            return {
                nextStep: 'ask_name',
                status: 'running',
                answers: session.answers,
                assistantReply: 'Please enter a name with at least 2 characters.',
            }
        }

        return {
            nextStep: 'ask_contact_method',
            status: 'running',
            answers: { ...session.answers, name: input },
            assistantReply: 'Preferred contact method: email or phone?',
        }
    }

    if (session.currentStep === 'ask_contact_method') {
        const method = input.toLowerCase()
        if (!EMAIL_OR_PHONE.has(method)) {
            return {
                nextStep: 'ask_contact_method',
                status: 'running',
                answers: session.answers,
                assistantReply: 'Please reply with exactly "email" or "phone".',
            }
        }

        const answers: Record<string, string> = { ...session.answers, contactMethod: method }
        return {
            nextStep: 'confirm',
            status: 'running',
            answers,
            assistantReply: `Confirm: name=${answers.name}, contact=${answers.contactMethod}. Reply yes or no.`,
        }
    }

    if (session.currentStep === 'confirm') {
        const answer = input.toLowerCase()
        if (answer === 'yes') {
            const resultSummary = `name=${session.answers.name ?? ''}; contact=${session.answers.contactMethod ?? ''}`
            return {
                nextStep: 'confirm',
                status: 'completed',
                answers: session.answers,
                resultSummary,
                assistantReply: 'Saved. Deterministic flow completed. AI mode resumed.',
            }
        }

        if (answer === 'no') {
            return {
                nextStep: 'ask_name',
                status: 'running',
                answers: {},
                assistantReply: 'Okay, let us restart. What is your name?',
            }
        }

        return {
            nextStep: 'confirm',
            status: 'running',
            answers: session.answers,
            assistantReply: 'Please answer with yes or no.',
        }
    }

    return {
        nextStep: 'ask_name',
        status: 'running',
        answers: {},
        assistantReply: 'Flow state was reset. What is your name?',
    }
}
