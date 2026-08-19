import { db, type Profiling, type ProfilingResponse, type ProfilingStatus, type ProfilingTextBlock } from '@/db/db'

export interface CreateProfilingInput {
    chatId: string
    userScopeId: string
    alias: string
    aliasNormalized: string
    workbookVersion: string
    textBlockVersion: string
    currentStepKey: string
    stateJson: string
}

const DEFAULT_TEXT_VERSION = 'v1'

const DEFAULT_TEXT_BLOCKS: Array<Omit<ProfilingTextBlock, 'id' | 'updatedAt'>> = [
    {
        key: 'profiling_intro',
        version: DEFAULT_TEXT_VERSION,
        active: true,
        text: 'Wir erstellen nun ein Werry&Werry-Profil fuer einen konkreten Gespraechspartner. Ziel ist es, eine belastbare Arbeitshypothese zu entwickeln, welcher W&W-Typ bei dieser Person im Vordergrund steht und welche Nebenauspraegung zusaetzlich eine Rolle spielen koennte.',
    },
    {
        key: 'alias_prompt',
        version: DEFAULT_TEXT_VERSION,
        active: true,
        text: 'Bitte vergeben Sie zuerst einen Alias-Namen fuer die Person, die wir einschaetzen. Nutzen Sie keinesfalls den echten Namen einer realen Person, damit Persoenlichkeitsrechte geschuetzt bleiben.',
    },
    {
        key: 'alias_duplicate',
        version: DEFAULT_TEXT_VERSION,
        active: true,
        text: 'Dieser Alias existiert bereits in Ihrer Profiling-Uebersicht. Bitte waehlen Sie einen anderen Alias oder oeffnen Sie das bestehende Profiling.',
    },
    {
        key: 'alias_confirm',
        version: DEFAULT_TEXT_VERSION,
        active: true,
        text: 'Ich bestaetige hiermit, die AGBs gelesen und verstanden zu haben – insbesondere bestaetige ich, dass der vergebene Alias-Name keine Rueckschluesse auf echte Personen geben kann.',
    },
    {
        key: 'phase1_intro',
        version: DEFAULT_TEXT_VERSION,
        active: true,
        text: 'In der ersten Phase arbeiten wir mit dem ersten Eindruck. Ich zeige Ihnen nacheinander mehrere Kategorien mit jeweils 9 Aussagen. Bitte waehlen Sie jeweils eine der 9 Aussagen aus, die am besten zu [Alias] passt.',
    },
    {
        key: 'phase2_intro',
        version: DEFAULT_TEXT_VERSION,
        active: true,
        text: 'Im Finetuning werden weitere Aussagen bewertet. Jede Aussage bewerten Sie mit 0 bis 5 Punkten. Insgesamt koennen bis zu 90 Aussagen bearbeitet werden, in maximal 10 Runden mit jeweils 9 Aussagen.',
    },
    {
        key: 'profiling_completion',
        version: DEFAULT_TEXT_VERSION,
        active: true,
        text: 'Sehr gut, das Profiling fuer [Alias] ist nun abgeschlossen. Auf dieser Grundlage koennen Verkaufstraining und Gespraechsstrategie deutlich zielgerichteter ausgerichtet werden.',
    },
]

function now(): number {
    return Date.now()
}

export function normalizeAlias(alias: string): string {
    return alias.trim().toLowerCase().replace(/\s+/g, ' ')
}

export async function ensureProfilingTextBlocksSeeded(): Promise<string> {
    const existing = await db.profilingTextBlocks.count()
    if (existing > 0) {
        return DEFAULT_TEXT_VERSION
    }

    const timestamp = now()
    const blocks: ProfilingTextBlock[] = DEFAULT_TEXT_BLOCKS.map((block) => ({
        ...block,
        id: `${block.key}:${block.version}`,
        updatedAt: timestamp,
    }))

    await db.profilingTextBlocks.bulkAdd(blocks)
    return DEFAULT_TEXT_VERSION
}

export async function getTextBlock(key: string): Promise<ProfilingTextBlock | null> {
    const records = await db.profilingTextBlocks.where('key').equals(key).toArray()
    const active = records.filter((item) => item.active)
    if (active.length === 0) return null
    active.sort((a, b) => b.updatedAt - a.updatedAt)
    return active[0]
}

export async function listProfilingsForChat(chatId: string): Promise<Profiling[]> {
    return db.profilings.where('chatId').equals(chatId).reverse().sortBy('updatedAt')
}

export async function findProfilingByAlias(chatId: string, aliasNormalized: string): Promise<Profiling | null> {
    const matches = await db.profilings.where('chatId').equals(chatId).toArray()
    return matches.find((item) => item.aliasNormalized === aliasNormalized) ?? null
}

export async function createProfiling(input: CreateProfilingInput): Promise<Profiling> {
    const timestamp = now()
    const profiling: Profiling = {
        id: crypto.randomUUID(),
        chatId: input.chatId,
        userScopeId: input.userScopeId,
        alias: input.alias,
        aliasNormalized: input.aliasNormalized,
        aliasConfirmed: false,
        status: 'alias_created',
        currentPhase: 1,
        workbookVersion: input.workbookVersion,
        textBlockVersion: input.textBlockVersion,
        currentStepKey: input.currentStepKey,
        stateJson: input.stateJson,
        createdAt: timestamp,
        updatedAt: timestamp,
    }

    await db.profilings.add(profiling)
    return profiling
}

export async function getProfilingById(id: string): Promise<Profiling | null> {
    return (await db.profilings.get(id)) ?? null
}

export async function updateProfiling(
    profilingId: string,
    patch: Partial<Profiling> & { status?: ProfilingStatus },
): Promise<void> {
    await db.profilings.update(profilingId, {
        ...patch,
        updatedAt: now(),
    })
}

export async function addProfilingResponse(response: Omit<ProfilingResponse, 'id' | 'answeredAt'>): Promise<void> {
    await db.profilingResponses.add({
        ...response,
        id: crypto.randomUUID(),
        answeredAt: now(),
    })
}

export async function getProfilingResponses(profilingId: string): Promise<ProfilingResponse[]> {
    return db.profilingResponses.where('profilingId').equals(profilingId).toArray()
}
