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
