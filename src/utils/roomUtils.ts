export interface RoomWithAttributes {
    name: string
    customAttributes?: Record<string, string>
}

export function normalizeRoomCustomAttributes(customAttributes?: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {}
    if (!customAttributes) return normalized

    for (const [rawKey, rawValue] of Object.entries(customAttributes)) {
        if (typeof rawValue !== 'string') continue

        const key = rawKey.trim()
        const value = rawValue.trim()
        if (!key || !value) continue

        normalized[key] = value
    }

    return normalized
}

export function formatRoomLabel(room: RoomWithAttributes | null | undefined): string {
    if (!room) return ''

    const attributes = Object.entries(normalizeRoomCustomAttributes(room.customAttributes))
    if (attributes.length === 0) return room.name

    const attributeLabel = attributes.map(([key, value]) => `${key}: ${value}`).join(', ')
    return `${room.name} (${attributeLabel})`
}
