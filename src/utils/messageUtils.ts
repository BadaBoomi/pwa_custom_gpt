// Entspricht Android: ChatRepositoryImpl.splitAssistantResponse + extractLeadingJsonObject
// Und: ConversationViewModel.getStarterPrompts

/**
 * Splitte Antworten mit führendem JSON-Objekt wie {"message":"..."} in
 * 1) Begrüßungstext aus "message" und 2) den restlichen Freitext.
 */
export function splitAssistantResponse(text: string): string[] {
    const leading = extractLeadingJsonObject(text.trim())
    if (!leading) return [text]

    const [jsonPart, remaining] = leading

    let messageFromJson = ''
    try {
        const parsed = JSON.parse(jsonPart) as unknown
        if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'message' in parsed &&
            typeof (parsed as Record<string, unknown>).message === 'string'
        ) {
            messageFromJson = ((parsed as Record<string, unknown>).message as string).trim()
        }
    } catch {
        // malformed JSON — return original
    }

    if (!messageFromJson) return [text]

    const result: string[] = [messageFromJson]
    if (remaining.trim()) result.push(remaining.trim())
    return result
}

export interface InlineResponseButton {
    label: string
    content: string
}

export function applyRoomAttributeDirectives(
    text: string,
    currentAttributes: Record<string, string>,
): {
    cleanedText: string
    customAttributes: Record<string, string>
    didUpdateAttributes: boolean
} {
    const nextAttributes = { ...currentAttributes }
    let didUpdateAttributes = false

    const withoutSetDirectives = text.replace(
        /\[set\|([^|\]]+?)\|([^\]]*?)\]/gi,
        (_, rawKey: string, rawValue: string) => {
            const key = rawKey.trim()
            const value = rawValue.trim()
            if (!key || !value) return ''

            if (nextAttributes[key] !== value) {
                nextAttributes[key] = value
                didUpdateAttributes = true
            }

            return ''
        },
    )

    const cleanedText = withoutSetDirectives
        .replace(/\[get\|([^|\]]+?)\]/gi, (_, rawKey: string) => {
            const key = rawKey.trim()
            return key ? nextAttributes[key] ?? '' : ''
        })
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    return {
        cleanedText,
        customAttributes: nextAttributes,
        didUpdateAttributes,
    }
}

export function extractInlineResponseButtons(text: string): {
    cleanedText: string
    buttons: InlineResponseButton[]
} {
    const pattern = /\[\[buttons:\s*([\s\S]*?)\]\]/gi
    const matches = Array.from(text.matchAll(pattern))
    if (matches.length === 0) {
        return { cleanedText: text, buttons: [] }
    }

    let parsedButtons: InlineResponseButton[] = []

    for (const match of matches) {
        const body = match[1] ?? ''
        const entryPattern = /\[\s*([^|\]]+?)\s*\|\s*([^\]]*?)\s*\]/g
        const entries = Array.from(body.matchAll(entryPattern))
            .map((entry) => ({
                label: (entry[1] ?? '').trim(),
                content: (entry[2] ?? '').trim(),
            }))
            .filter((entry) => entry.label && entry.content)

        if (entries.length > 0) {
            parsedButtons = entries
        }
    }

    const cleanedText = text
        .replace(pattern, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()

    return {
        cleanedText,
        buttons: parsedButtons,
    }
}

/**
 * Extrahiert ein führendes JSON-Objekt inkl. Resttext durch einfache Klammerzählung.
 * Entspricht Android: ChatRepositoryImpl.extractLeadingJsonObject
 */
function extractLeadingJsonObject(text: string): [string, string] | null {
    const start = [...text].findIndex((ch) => ch.trim() !== '')
    if (start === -1 || text[start] !== '{') return null

    let depth = 0
    let inString = false
    let escaped = false

    for (let i = start; i < text.length; i++) {
        const ch = text[i]
        if (escaped) { escaped = false; continue }
        if (ch === '\\' && inString) { escaped = true; continue }
        if (ch === '"') { inString = !inString; continue }
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

/**
 * Parst die Starters-Markdown-Tabelle.
 * Entspricht Android: ConversationViewModel.getStarterPrompts()
 *
 * Format:
 * |Zweck|Prompt|
 * |--|--|
 * |Label|Prompt text|
 */
export function parseStarterPrompts(startersMd: string): Array<{ label: string; prompt: string; promptId?: string }> {
    return startersMd
        .split('\n')
        .slice(2) // Header-Zeile + Trennzeile überspringen
        .flatMap((line) => {
            const cols = line.split('|').map((s) => s.trim()).filter(Boolean)
            if (cols.length >= 2) {
                return [{
                    label: cols[0],
                    prompt: cols[1],
                    promptId: cols[2] || undefined,
                }]
            }
            return []
        })
}
