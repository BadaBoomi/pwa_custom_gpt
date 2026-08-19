import type { Profiling } from '@/db/db'
import {
    addProfilingResponse,
    normalizeAlias,
    updateProfiling,
    getTextBlock,
    findProfilingByAlias,
    createProfiling,
    listProfilingsForChat,
    ensureProfilingTextBlocksSeeded,
} from '@/repositories/profilingRepository'
import { getProfilingWorkbookData, type Phase1Statement, type Phase2Statement } from '@/services/profilingWorkbookService'
import { settingsRepository } from '@/repositories/settingsRepository'

const MANDATORY_CATEGORIES = [
    'Auftreten und Koerpersprache',
    'Die Art der Gespraechseroeffnung',
    'Der Kommunikationsstil',
]

const OPTIONAL_CATEGORIES = [
    'Welche Fragen werden gestellt',
    'Reaktion auf Ihre Einwaende',
    'Verhalten in der Abschlussphase',
]

const ONE_TO_NINE_BUTTONS_TOKEN = '[[buttons:[1|1],[2|2],[3|3],[4|4],[5|5],[6|6],[7|7],[8|8],[9|9]]]'
const ONE_TO_NINE_WITH_SKIP_BUTTONS_TOKEN = '[[buttons:[1|1],[2|2],[3|3],[4|4],[5|5],[6|6],[7|7],[8|8],[9|9],[skip|skip]]]'
const ZERO_TO_FIVE_BUTTONS_TOKEN = '[[buttons:[0|0],[1|1],[2|2],[3|3],[4|4],[5|5]]]'
const YES_NO_BUTTONS_TOKEN = '[[buttons:[ja|ja],[nein|nein]]]'
const YES_BUTTONS_TOKEN = '[[buttons:[ja|ja]]]'
const OPTIONAL_CATEGORY_BUTTONS_TOKEN = '[[buttons:[keine|keine],[alle|alle],[1|1],[2|2],[3|3]]]'
const ALIAS_GET_TOKEN = '[get|Alias]'

function withButtons(text: string, token: string): string {
    return `${text}\n${token}`
}

function withAliasSet(text: string, alias: string): string {
    return `${text}\n[set|Alias|${alias}]`
}

function buildMenuButtonsToken(profilingCount: number): string {
    const numbered = Array.from({ length: profilingCount }, (_, idx) => `[${idx + 1}|${idx + 1}]`).join(',')
    const parts = numbered ? `${numbered},[neu|neu]` : '[neu|neu]'
    return `[[buttons:${parts}]]`
}

export interface RoundItem {
    statementId: number
    wwType: number
    roundValue: number
    statement: string
    answered: boolean
    answerValue?: number
}

export interface ProfilingStateData {
    alias: string
    categoryQueue: string[]
    currentCategoryIndex: number
    phase1Selections: Record<string, number>
    phase1Scores: Record<string, number>
    phase1MandatoryScores: Record<string, number>
    phase1MainType?: number
    phase1SecondaryType?: number
    awaitingOptionalSelection: boolean
    optionalSelectionDone: boolean
    phase2Started: boolean
    phase2CurrentRound: number
    phase2CurrentItemIndex: number
    phase2Rounds: Array<{ roundNumber: number; items: RoundItem[] }>
    phase2Scores: Record<string, number>
    phase2LatestByStatement: Record<string, number>
    phase2MainType?: number
    phase2SecondaryType?: number
    phase2MainHistory: number[]
    phase2SecondaryHistory: number[]
    omittedTypeRound1?: number
}

export interface MenuResolution {
    type: 'menu' | 'create_alias' | 'resume'
    assistantReply: string
    profilingId?: string
}

function parseState(stateJson: string): ProfilingStateData {
    return JSON.parse(stateJson) as ProfilingStateData
}

function stringifyState(state: ProfilingStateData): string {
    return JSON.stringify(state)
}

function toTypeMap(): Record<string, number> {
    const out: Record<string, number> = {}
    for (let i = 1; i <= 9; i++) out[String(i)] = 0
    return out
}

function replaceAlias(text: string, alias: string): string {
    void alias
    return text.replace(/\[Alias\]/g, ALIAS_GET_TOKEN)
}

function normalizeCategoryName(raw: string): string {
    return raw.trim().replace(/\s+/g, ' ').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss')
}

function sortByTypeAndId<T extends { wwType: number; id: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => {
        if (a.wwType !== b.wwType) return a.wwType - b.wwType
        return a.id - b.id
    })
}

function categoryPrompt(alias: string, category: string, statements: Phase1Statement[], isOptional: boolean): string {
    void alias
    const title = isOptional ? `Zusatzkategorie: ${category}` : `Kategorie: ${category}`
    const header = `${title}\n\nBitte waehlen Sie die Aussage, die am besten zu ${ALIAS_GET_TOKEN} passt.`
    const lines = sortByTypeAndId(statements).map((item, idx) => `${idx + 1}. ${item.statement}`)
    const suffix = isOptional
        ? '\n\nAntworten Sie mit 1 bis 9 oder schreiben Sie "skip" zum Ueberspringen.'
        : '\n\nAntworten Sie mit einer Zahl von 1 bis 9.'

    const token = isOptional ? ONE_TO_NINE_WITH_SKIP_BUTTONS_TOKEN : ONE_TO_NINE_BUTTONS_TOKEN
    return `${header}\n\nAussagen:\n${lines.join('\n')}${suffix}\n${token}`
}

function rankTypes(scores: Record<string, number>, mandatoryScores?: Record<string, number>): number[] {
    const allTypes = Array.from({ length: 9 }, (_, idx) => idx + 1)
    return allTypes.sort((a, b) => {
        const sa = scores[String(a)] ?? 0
        const sb = scores[String(b)] ?? 0
        if (sb !== sa) return sb - sa
        if (mandatoryScores) {
            const ma = mandatoryScores[String(a)] ?? 0
            const mb = mandatoryScores[String(b)] ?? 0
            if (mb !== ma) return mb - ma
        }
        return a - b
    })
}

function buildPhase1ResultText(alias: string, mainType: number, secondaryType: number): string {
    void alias
    return [
        `Das Phase-1-Profil fuer ${ALIAS_GET_TOKEN} ist abgeschlossen.`,
        '',
        `Etablierter W&W-Typ nach Phase 1: W&W-Typ ${mainType}`,
        `Nebenauspraegung: W&W-Typ ${secondaryType}`,
        '',
        'Bitte beachten Sie: Dies ist eine vertriebspraktische Arbeitshypothese auf Basis des ersten Eindrucks und keine psychologische Diagnose.',
    ].join('\n')
}

function availableByType(phase2: Phase2Statement[], latestScores: Record<string, number>): Record<number, Phase2Statement[]> {
    const grouped: Record<number, Phase2Statement[]> = {}
    for (let type = 1; type <= 9; type++) {
        grouped[type] = phase2
            .filter((s) => s.wwType === type)
            .filter((s) => (latestScores[String(s.id)] ?? 0) === 0)
            .sort((a, b) => (a.roundValue !== b.roundValue ? a.roundValue - b.roundValue : a.id - b.id))
    }
    return grouped
}

function chooseFirstAvailable(list: Phase2Statement[], usedIds: Set<number>): Phase2Statement | null {
    for (const statement of list) {
        if (!usedIds.has(statement.id)) return statement
    }
    return null
}

function buildRound(
    roundNumber: number,
    phase2: Phase2Statement[],
    mainType: number,
    secondaryType: number,
    latestScores: Record<string, number>,
    omittedTypeRound1?: number,
): { items: RoundItem[]; omittedTypeRound1?: number } {
    const grouped = availableByType(phase2, latestScores)
    const usedIds = new Set<number>()
    const items: RoundItem[] = []

    const pushItem = (candidate: Phase2Statement | null) => {
        if (!candidate) return
        usedIds.add(candidate.id)
        items.push({
            statementId: candidate.id,
            wwType: candidate.wwType,
            roundValue: candidate.roundValue,
            statement: candidate.statement,
            answered: false,
        })
    }

    if (roundNumber === 1) {
        const mainCandidates = grouped[mainType]
        pushItem(mainCandidates.find((s) => s.roundValue === 1) ?? chooseFirstAvailable(mainCandidates, usedIds))
        pushItem(mainCandidates.find((s) => s.roundValue === 2 && !usedIds.has(s.id)) ?? chooseFirstAvailable(mainCandidates, usedIds))

        const otherTypes = Array.from({ length: 9 }, (_, i) => i + 1).filter((type) => type !== mainType)
        let omitted = omittedTypeRound1
        if (!omitted) {
            omitted = otherTypes[otherTypes.length - 1]
        }

        for (const type of otherTypes) {
            if (type === omitted) continue
            if (items.length >= 9) break
            const candidate = grouped[type].find((s) => s.roundValue === 1 && !usedIds.has(s.id)) ?? chooseFirstAvailable(grouped[type], usedIds)
            pushItem(candidate)
        }

        while (items.length < 9) {
            const fallback = phase2
                .filter((s) => (latestScores[String(s.id)] ?? 0) === 0)
                .sort((a, b) => (a.roundValue !== b.roundValue ? a.roundValue - b.roundValue : a.id - b.id))
                .find((item) => !usedIds.has(item.id))
            if (!fallback) break
            pushItem(fallback)
        }

        return { items, omittedTypeRound1: omitted }
    }

    const mainList = grouped[mainType]
    const secondaryList = grouped[secondaryType]
    pushItem(chooseFirstAvailable(mainList, usedIds))
    pushItem(chooseFirstAvailable(mainList, usedIds))
    pushItem(chooseFirstAvailable(secondaryList, usedIds))
    pushItem(chooseFirstAvailable(secondaryList, usedIds))

    const otherTypes = Array.from({ length: 9 }, (_, i) => i + 1).filter((type) => type !== mainType && type !== secondaryType)
    const candidatePool = otherTypes.flatMap((type) => grouped[type]).sort((a, b) => (a.roundValue !== b.roundValue ? a.roundValue - b.roundValue : a.id - b.id))

    for (const candidate of candidatePool) {
        if (items.length >= 9) break
        if (usedIds.has(candidate.id)) continue
        pushItem(candidate)
    }

    while (items.length < 9) {
        const fallback = phase2
            .filter((s) => (latestScores[String(s.id)] ?? 0) === 0)
            .sort((a, b) => (a.roundValue !== b.roundValue ? a.roundValue - b.roundValue : a.id - b.id))
            .find((item) => !usedIds.has(item.id))
        if (!fallback) break
        pushItem(fallback)
    }

    return { items, omittedTypeRound1 }
}

function getStabilityLabel(roundsDone: number, gap: number, mainChangedRecently: boolean): string {
    if (roundsDone < 2 || gap <= 1 || mainChangedRecently) {
        return 'Die Einschaetzung ist derzeit eher schwach abgesichert. Weitere Runden sind sinnvoll.'
    }
    if (roundsDone >= 4 && gap >= 7 && !mainChangedRecently) {
        return 'Die Einschaetzung ist sehr stabil. Weitere Runden wuerden voraussichtlich nur noch feinjustieren.'
    }
    if (roundsDone >= 3 && gap >= 4 && !mainChangedRecently) {
        return 'Die Einschaetzung ist bereits recht stabil. Weitere Runden koennen noch feinjustieren.'
    }
    return 'Die Einschaetzung ist derzeit plausibel, aber noch offen. Weitere Aussagen koennen das Bild noch veraendern.'
}

export async function buildProfilingMenuPrompt(chatId: string): Promise<string> {
    await ensureProfilingTextBlocksSeeded()
    const intro = await getTextBlock('profiling_intro')
    const profilings = await listProfilingsForChat(chatId)

    if (profilings.length === 0) {
        return `${intro?.text ?? ''}\n\nSie haben noch kein Profiling angelegt. Antworten Sie direkt mit einem Alias, um Ihr erstes Profiling zu starten.`.trim()
    }

    const list = profilings
        .map((item, idx) => {
            const mainType = item.phase2MainType ?? item.phase1MainType
            const secondaryType = item.phase2SecondaryType ?? item.phase1SecondaryType
            return `${idx + 1}. ${item.alias} | Status: ${item.status} | Haupttyp: ${mainType ?? 'offen'} | Nebenauspraegung: ${secondaryType ?? 'offen'}`
        })
        .join('\n')

    return withButtons(
        `${intro?.text ?? ''}\n\nProfiling-Uebersicht:\n${list}\n\nAntworten Sie mit der Nummer zum Fortsetzen oder mit "neu", um ein neues Profiling zu starten.`.trim(),
        buildMenuButtonsToken(profilings.length),
    )
}

export async function resolveMenuInput(chatId: string, input: string): Promise<MenuResolution> {
    const profilings = await listProfilingsForChat(chatId)
    const normalized = input.trim().toLowerCase()

    if (profilings.length === 0) {
        return {
            type: 'create_alias',
            assistantReply: 'Bitte geben Sie einen Alias ein.',
        }
    }

    if (normalized === 'neu' || normalized === 'new' || normalized === 'n') {
        return {
            type: 'create_alias',
            assistantReply: 'Bitte geben Sie einen Alias ein.',
        }
    }

    const index = Number(normalized)
    if (Number.isFinite(index) && index >= 1 && index <= profilings.length) {
        const selected = profilings[index - 1]
        return {
            type: 'resume',
            profilingId: selected.id,
            assistantReply: withAliasSet(`Profiling "${selected.alias}" wird fortgesetzt.`, selected.alias),
        }
    }

    return {
        type: 'menu',
        assistantReply: withButtons(
            'Bitte antworten Sie mit "neu" oder mit der Nummer eines vorhandenen Profilings.',
            buildMenuButtonsToken(profilings.length),
        ),
    }
}

export async function createProfilingFromAlias(chatId: string, aliasInput: string): Promise<{ profiling: Profiling | null; assistantReply: string }> {
    const alias = aliasInput.trim()
    if (!alias) {
        return { profiling: null, assistantReply: 'Der Alias darf nicht leer sein. Bitte geben Sie einen Alias ein.' }
    }

    const aliasNormalized = normalizeAlias(alias)
    const duplicate = await findProfilingByAlias(chatId, aliasNormalized)
    if (duplicate) {
        const duplicateText = await getTextBlock('alias_duplicate')
        return { profiling: null, assistantReply: duplicateText?.text ?? 'Alias bereits vorhanden. Bitte waehlen Sie einen anderen Alias.' }
    }

    const workbook = await getProfilingWorkbookData()
    const textVersion = await ensureProfilingTextBlocksSeeded()
    const userScopeId = settingsRepository.getUserEmail()?.trim() || chatId

    const initialState: ProfilingStateData = {
        alias,
        categoryQueue: [...MANDATORY_CATEGORIES],
        currentCategoryIndex: 0,
        phase1Selections: {},
        phase1Scores: toTypeMap(),
        phase1MandatoryScores: toTypeMap(),
        awaitingOptionalSelection: false,
        optionalSelectionDone: false,
        phase2Started: false,
        phase2CurrentRound: 0,
        phase2CurrentItemIndex: 0,
        phase2Rounds: [],
        phase2Scores: toTypeMap(),
        phase2LatestByStatement: {},
        phase2MainHistory: [],
        phase2SecondaryHistory: [],
    }

    const profiling = await createProfiling({
        chatId,
        userScopeId,
        alias,
        aliasNormalized,
        workbookVersion: workbook.version,
        textBlockVersion: textVersion,
        currentStepKey: 'alias_confirm',
        stateJson: stringifyState(initialState),
    })

    const confirmText = await getTextBlock('alias_confirm')
    return {
        profiling,
        assistantReply: withAliasSet(withButtons(
            `Alias "${alias}" wurde angelegt.\n\nBitte bestaetigen Sie mit "ja":\n${confirmText?.text ?? ''}`.trim(),
            YES_BUTTONS_TOKEN,
        ), alias),
    }
}

function resolveCurrentCategory(state: ProfilingStateData): string | null {
    if (state.currentCategoryIndex < 0 || state.currentCategoryIndex >= state.categoryQueue.length) return null
    return state.categoryQueue[state.currentCategoryIndex]
}

function findCategoryStatements(phase1: Phase1Statement[], category: string): Phase1Statement[] {
    const normalizedCategory = normalizeCategoryName(category)
    const matches = phase1.filter((item) => normalizeCategoryName(item.category) === normalizedCategory)
    return sortByTypeAndId(matches)
}

async function getPhase1CategoryPrompt(state: ProfilingStateData): Promise<string> {
    const workbook = await getProfilingWorkbookData()
    const category = resolveCurrentCategory(state)
    if (!category) return 'Phase 1 konnte nicht fortgesetzt werden, da keine offene Kategorie gefunden wurde.'

    const statements = findCategoryStatements(workbook.phase1, category)
    const isOptional = !MANDATORY_CATEGORIES.includes(category)
    return categoryPrompt(state.alias, category, statements, isOptional)
}

function parseOptionalCategorySelection(input: string): string[] | null {
    const normalized = input.trim().toLowerCase()
    if (normalized === 'keine' || normalized === 'none' || normalized === '0') return []
    if (normalized === 'alle' || normalized === 'all') return [...OPTIONAL_CATEGORIES]

    const tokens = normalized.split(/[\s,;]+/).filter(Boolean)
    const out: string[] = []

    for (const token of tokens) {
        const idx = Number(token)
        if (!Number.isFinite(idx) || idx < 1 || idx > OPTIONAL_CATEGORIES.length) {
            return null
        }
        const category = OPTIONAL_CATEGORIES[idx - 1]
        if (!out.includes(category)) out.push(category)
    }

    return out
}

function buildPhase2StatementPrompt(state: ProfilingStateData): string {
    const currentRound = state.phase2Rounds.find((round) => round.roundNumber === state.phase2CurrentRound)
    if (!currentRound) return 'Es wurde keine aktive Runde gefunden.'
    const item = currentRound.items[state.phase2CurrentItemIndex]
    if (!item) return 'Es wurde keine offene Aussage gefunden.'

    return withButtons([
        `Aussage ${state.phase2CurrentItemIndex + 1} von 9:`,
        '',
        item.statement,
        '',
        `Bitte bewerten Sie diese Aussage fuer ${ALIAS_GET_TOKEN} mit 0 bis 5.`,
    ].join('\n'), ZERO_TO_FIVE_BUTTONS_TOKEN)
}

function parseScoreInput(input: string, min: number, max: number): number | null {
    const value = Number(input.trim())
    if (!Number.isFinite(value)) return null
    if (value < min || value > max) return null
    return value
}

function computePhase2Ranking(state: ProfilingStateData): { mainType: number; secondaryType: number } {
    const ranked = rankTypes(state.phase2Scores)
    return {
        mainType: ranked[0],
        secondaryType: ranked[1],
    }
}

function buildIntermediateText(state: ProfilingStateData, roundNumber: number): string {
    const ranking = computePhase2Ranking(state)
    const main = ranking.mainType
    const secondary = ranking.secondaryType
    const gap = (state.phase2Scores[String(main)] ?? 0) - (state.phase2Scores[String(secondary)] ?? 0)
    const previousMain = state.phase2MainHistory[state.phase2MainHistory.length - 2]
    const changed = previousMain !== undefined && previousMain !== main
    const stability = getStabilityLabel(roundNumber, gap, changed)

    state.phase2MainType = main
    state.phase2SecondaryType = secondary

    return withButtons([
        `Zwischenergebnis nach Runde ${roundNumber}:`,
        '',
        `Aktueller Haupttyp: W&W-Typ ${main}`,
        `Aktuelle Nebenauspraegung: W&W-Typ ${secondary}`,
        `Stabilitaet: ${stability}`,
        '',
        'Hinweis: Dies ist eine vertriebspraktische Arbeitshypothese und keine psychologische Diagnose.',
        '',
        'Moechten Sie mit einer weiteren Runde fortfahren? Antworten Sie mit "ja" oder "nein".',
    ].join('\n'), YES_NO_BUTTONS_TOKEN)
}

async function initializePhase2Round(state: ProfilingStateData): Promise<void> {
    const workbook = await getProfilingWorkbookData()
    const roundNumber = state.phase2CurrentRound

    const baseMainType = state.phase2MainType ?? state.phase1MainType ?? 1
    const baseSecondaryType = state.phase2SecondaryType ?? state.phase1SecondaryType ?? ((baseMainType % 9) + 1)

    const round = buildRound(
        roundNumber,
        workbook.phase2,
        baseMainType,
        baseSecondaryType,
        state.phase2LatestByStatement,
        state.omittedTypeRound1,
    )

    state.omittedTypeRound1 = round.omittedTypeRound1

    state.phase2Rounds.push({
        roundNumber,
        items: round.items,
    })
    state.phase2CurrentItemIndex = 0
}

export async function renderCurrentPrompt(profiling: Profiling): Promise<string> {
    const state = parseState(profiling.stateJson)

    if (profiling.currentStepKey === 'alias_confirm') {
        const confirmText = await getTextBlock('alias_confirm')
        return withButtons(`Bitte bestaetigen Sie mit "ja":\n${confirmText?.text ?? ''}`.trim(), YES_BUTTONS_TOKEN)
    }

    if (profiling.currentStepKey === 'phase1_category') {
        return getPhase1CategoryPrompt(state)
    }

    if (profiling.currentStepKey === 'phase1_optional_selection') {
        return withButtons(
            'Die drei Pflichtkategorien sind abgeschlossen. Moechten Sie Zusatzkategorien bearbeiten? Antwortoptionen: "keine", "alle" oder Kombinationen wie "1 3".\n1. Welche Fragen werden gestellt\n2. Reaktion auf Ihre Einwaende\n3. Verhalten in der Abschlussphase',
            OPTIONAL_CATEGORY_BUTTONS_TOKEN,
        )
    }

    if (profiling.currentStepKey === 'phase2_start_decision') {
        const mainType = state.phase1MainType ?? profiling.phase1MainType ?? 1
        const secondaryType = state.phase1SecondaryType ?? profiling.phase1SecondaryType ?? 2
        return withButtons(
            `${buildPhase1ResultText(state.alias, mainType, secondaryType)}\n\nMoechten Sie jetzt mit Phase 2 starten? Antworten Sie mit "ja" oder "nein".`,
            YES_NO_BUTTONS_TOKEN,
        )
    }

    if (profiling.currentStepKey === 'phase2_statement') {
        return buildPhase2StatementPrompt(state)
    }

    if (profiling.currentStepKey === 'phase2_continue_decision') {
        return withButtons('Moechten Sie mit einer weiteren Runde fortfahren? Antworten Sie mit "ja" oder "nein".', YES_NO_BUTTONS_TOKEN)
    }

    if (profiling.currentStepKey === 'completed') {
        return 'Dieses Profiling ist abgeschlossen. Starten Sie ein neues Profiling oder waehlen Sie ein anderes aus der Uebersicht.'
    }

    return 'Profiling-Zustand konnte nicht eindeutig ermittelt werden.'
}

export async function continueProfilingTurn(profiling: Profiling, userInput: string): Promise<{ reply: string; stateJson: string; stepKey: string; status: Profiling['status']; patch: Partial<Profiling> }> {
    const input = userInput.trim()
    const state = parseState(profiling.stateJson)

    if (profiling.currentStepKey === 'alias_confirm') {
        if (input.toLowerCase() !== 'ja') {
            return {
                reply: withButtons('Bitte bestaetigen Sie mit "ja", um fortzufahren.', YES_BUTTONS_TOKEN),
                stateJson: profiling.stateJson,
                stepKey: 'alias_confirm',
                status: 'alias_created',
                patch: {},
            }
        }

        const intro = await getTextBlock('phase1_intro')
        const firstCategoryPrompt = await getPhase1CategoryPrompt(state)

        return {
            reply: `${replaceAlias(intro?.text ?? '', state.alias)}\n\n${firstCategoryPrompt}`.trim(),
            stateJson: stringifyState(state),
            stepKey: 'phase1_category',
            status: 'phase1_running',
            patch: {
                aliasConfirmed: true,
                currentPhase: 1,
            },
        }
    }

    if (profiling.currentStepKey === 'phase1_optional_selection') {
        const selected = parseOptionalCategorySelection(input)
        if (!selected) {
            return {
                reply: withButtons(
                    'Bitte antworten Sie mit "keine", "alle" oder mit einer Liste aus 1,2,3 fuer die Zusatzkategorien.',
                    OPTIONAL_CATEGORY_BUTTONS_TOKEN,
                ),
                stateJson: profiling.stateJson,
                stepKey: 'phase1_optional_selection',
                status: 'phase1_running',
                patch: {},
            }
        }

        state.optionalSelectionDone = true
        state.awaitingOptionalSelection = false
        if (selected.length > 0) {
            state.categoryQueue.push(...selected)
        }

        if (state.currentCategoryIndex >= state.categoryQueue.length) {
            const ranked = rankTypes(state.phase1Scores, state.phase1MandatoryScores)
            state.phase1MainType = ranked[0]
            state.phase1SecondaryType = ranked[1]

            return {
                reply: withButtons(
                    `${buildPhase1ResultText(state.alias, ranked[0], ranked[1])}\n\nMoechten Sie jetzt mit Phase 2 starten? Antworten Sie mit "ja" oder "nein".`,
                    YES_NO_BUTTONS_TOKEN,
                ),
                stateJson: stringifyState(state),
                stepKey: 'phase2_start_decision',
                status: 'phase1_done_phase2_not_started',
                patch: {
                    phase1MainType: ranked[0],
                    phase1SecondaryType: ranked[1],
                    currentPhase: 1,
                },
            }
        }

        const nextPrompt = await getPhase1CategoryPrompt(state)
        return {
            reply: nextPrompt,
            stateJson: stringifyState(state),
            stepKey: 'phase1_category',
            status: 'phase1_running',
            patch: {},
        }
    }

    if (profiling.currentStepKey === 'phase1_category') {
        const category = resolveCurrentCategory(state)
        if (!category) {
            return {
                reply: 'Es ist keine offene Kategorie mehr vorhanden.',
                stateJson: stringifyState(state),
                stepKey: 'phase2_start_decision',
                status: 'phase1_done_phase2_not_started',
                patch: {},
            }
        }

        const workbook = await getProfilingWorkbookData()
        const statements = findCategoryStatements(workbook.phase1, category)
        const isOptional = !MANDATORY_CATEGORIES.includes(category)

        if (isOptional && input.toLowerCase() === 'skip') {
            state.currentCategoryIndex += 1
        } else {
            const pick = parseScoreInput(input, 1, 9)
            if (pick === null) {
                return {
                    reply: isOptional
                        ? `Ungueltige Eingabe. Antworten Sie mit 1 bis 9 oder mit "skip".\n${ONE_TO_NINE_WITH_SKIP_BUTTONS_TOKEN}`
                        : `Ungueltige Eingabe. Antworten Sie mit einer Zahl von 1 bis 9.\n${ONE_TO_NINE_BUTTONS_TOKEN}`,
                    stateJson: profiling.stateJson,
                    stepKey: 'phase1_category',
                    status: 'phase1_running',
                    patch: {},
                }
            }

            const selected = statements[pick - 1]
            if (!selected) {
                return {
                    reply: `Ungueltige Auswahl. Bitte waehlen Sie eine Zahl zwischen 1 und 9.\n${ONE_TO_NINE_BUTTONS_TOKEN}`,
                    stateJson: profiling.stateJson,
                    stepKey: 'phase1_category',
                    status: 'phase1_running',
                    patch: {},
                }
            }

            state.phase1Selections[category] = selected.id
            state.phase1Scores[String(selected.wwType)] = (state.phase1Scores[String(selected.wwType)] ?? 0) + selected.weight
            if (MANDATORY_CATEGORIES.includes(category)) {
                state.phase1MandatoryScores[String(selected.wwType)] =
                    (state.phase1MandatoryScores[String(selected.wwType)] ?? 0) + selected.weight
            }

            await addProfilingResponse({
                profilingId: profiling.id,
                statementId: selected.id,
                statementVersion: profiling.workbookVersion,
                statementTextSnapshot: selected.statement,
                value: pick,
                phase: 1,
                scopeKey: category,
                orderInScope: pick,
                categoryName: category,
            })

            state.currentCategoryIndex += 1
        }

        if (!state.optionalSelectionDone && state.currentCategoryIndex >= MANDATORY_CATEGORIES.length) {
            state.awaitingOptionalSelection = true
            return {
                reply: withButtons(
                    'Die drei Pflichtkategorien sind abgeschlossen. Moechten Sie Zusatzkategorien bearbeiten? Antwortoptionen: "keine", "alle" oder Kombinationen wie "1 3".\n1. Welche Fragen werden gestellt\n2. Reaktion auf Ihre Einwaende\n3. Verhalten in der Abschlussphase',
                    OPTIONAL_CATEGORY_BUTTONS_TOKEN,
                ),
                stateJson: stringifyState(state),
                stepKey: 'phase1_optional_selection',
                status: 'phase1_running',
                patch: {},
            }
        }

        if (state.currentCategoryIndex >= state.categoryQueue.length) {
            const ranked = rankTypes(state.phase1Scores, state.phase1MandatoryScores)
            state.phase1MainType = ranked[0]
            state.phase1SecondaryType = ranked[1]

            return {
                reply: withButtons(
                    `${buildPhase1ResultText(state.alias, ranked[0], ranked[1])}\n\nMoechten Sie jetzt mit Phase 2 starten? Antworten Sie mit "ja" oder "nein".`,
                    YES_NO_BUTTONS_TOKEN,
                ),
                stateJson: stringifyState(state),
                stepKey: 'phase2_start_decision',
                status: 'phase1_done_phase2_not_started',
                patch: {
                    phase1MainType: ranked[0],
                    phase1SecondaryType: ranked[1],
                    currentPhase: 1,
                },
            }
        }

        const nextPrompt = await getPhase1CategoryPrompt(state)
        return {
            reply: nextPrompt,
            stateJson: stringifyState(state),
            stepKey: 'phase1_category',
            status: 'phase1_running',
            patch: {},
        }
    }

    if (profiling.currentStepKey === 'phase2_start_decision') {
        const normalized = input.toLowerCase()
        if (normalized !== 'ja' && normalized !== 'nein') {
            return {
                reply: withButtons('Bitte antworten Sie mit "ja" oder "nein".', YES_NO_BUTTONS_TOKEN),
                stateJson: profiling.stateJson,
                stepKey: 'phase2_start_decision',
                status: 'phase1_done_phase2_not_started',
                patch: {},
            }
        }

        if (normalized === 'nein') {
            return {
                reply: 'Verstanden. Phase 2 wurde noch nicht gestartet. Sie koennen spaeter fortsetzen.',
                stateJson: stringifyState(state),
                stepKey: 'phase2_start_decision',
                status: 'phase1_done_phase2_not_started',
                patch: {
                    currentPhase: 2,
                },
            }
        }

        const phase2Intro = await getTextBlock('phase2_intro')
        state.phase2Started = true
        state.phase2CurrentRound = 1
        state.phase2CurrentItemIndex = 0
        state.phase2MainType = state.phase1MainType
        state.phase2SecondaryType = state.phase1SecondaryType
        await initializePhase2Round(state)

        return {
            reply: `${phase2Intro?.text ?? ''}\n\n${buildPhase2StatementPrompt(state)}`.trim(),
            stateJson: stringifyState(state),
            stepKey: 'phase2_statement',
            status: 'phase2_running',
            patch: {
                currentPhase: 2,
            },
        }
    }

    if (profiling.currentStepKey === 'phase2_continue_decision') {
        const normalized = input.toLowerCase()
        if (normalized !== 'ja' && normalized !== 'nein') {
            return {
                reply: withButtons('Bitte antworten Sie mit "ja" oder "nein".', YES_NO_BUTTONS_TOKEN),
                stateJson: profiling.stateJson,
                stepKey: 'phase2_continue_decision',
                status: 'phase2_running',
                patch: {},
            }
        }

        if (normalized === 'nein') {
            const completion = await getTextBlock('profiling_completion')
            const finalMain = state.phase2MainType ?? state.phase1MainType ?? 1
            const finalSecondary = state.phase2SecondaryType ?? state.phase1SecondaryType ?? 2
            return {
                reply: `${replaceAlias(completion?.text ?? 'Profiling abgeschlossen.', state.alias)}\n\nFinaler W&W-Typ: ${finalMain}\nFinale Nebenauspraegung: ${finalSecondary}`,
                stateJson: stringifyState(state),
                stepKey: 'completed',
                status: 'completed',
                patch: {
                    currentPhase: 2,
                    phase2MainType: finalMain,
                    phase2SecondaryType: finalSecondary,
                },
            }
        }

        if (state.phase2CurrentRound >= 10) {
            return {
                reply: 'Die maximale Anzahl von 10 Runden wurde erreicht. Das Profiling wird abgeschlossen.',
                stateJson: stringifyState(state),
                stepKey: 'completed',
                status: 'completed',
                patch: {},
            }
        }

        state.phase2CurrentRound += 1
        state.phase2CurrentItemIndex = 0
        await initializePhase2Round(state)

        return {
            reply: buildPhase2StatementPrompt(state),
            stateJson: stringifyState(state),
            stepKey: 'phase2_statement',
            status: 'phase2_running',
            patch: {},
        }
    }

    if (profiling.currentStepKey === 'phase2_statement') {
        const score = parseScoreInput(input, 0, 5)
        if (score === null) {
            return {
                reply: withButtons('Ungueltige Eingabe. Bitte bewerten Sie mit einem Wert von 0 bis 5.', ZERO_TO_FIVE_BUTTONS_TOKEN),
                stateJson: profiling.stateJson,
                stepKey: 'phase2_statement',
                status: 'phase2_running',
                patch: {},
            }
        }

        const currentRound = state.phase2Rounds.find((round) => round.roundNumber === state.phase2CurrentRound)
        if (!currentRound) {
            return {
                reply: 'Runde konnte nicht geladen werden. Bitte erneut versuchen.',
                stateJson: profiling.stateJson,
                stepKey: 'phase2_statement',
                status: 'phase2_running',
                patch: {},
            }
        }

        const item = currentRound.items[state.phase2CurrentItemIndex]
        if (!item) {
            return {
                reply: 'Aussage konnte nicht geladen werden. Bitte erneut versuchen.',
                stateJson: profiling.stateJson,
                stepKey: 'phase2_statement',
                status: 'phase2_running',
                patch: {},
            }
        }

        item.answered = true
        item.answerValue = score
        state.phase2Scores[String(item.wwType)] = (state.phase2Scores[String(item.wwType)] ?? 0) + score
        state.phase2LatestByStatement[String(item.statementId)] = score

        await addProfilingResponse({
            profilingId: profiling.id,
            statementId: item.statementId,
            statementVersion: profiling.workbookVersion,
            statementTextSnapshot: item.statement,
            value: score,
            phase: 2,
            scopeKey: `runde_${state.phase2CurrentRound}`,
            orderInScope: state.phase2CurrentItemIndex + 1,
            roundNumber: state.phase2CurrentRound,
        })

        state.phase2CurrentItemIndex += 1

        if (state.phase2CurrentItemIndex < currentRound.items.length) {
            return {
                reply: buildPhase2StatementPrompt(state),
                stateJson: stringifyState(state),
                stepKey: 'phase2_statement',
                status: 'phase2_running',
                patch: {},
            }
        }

        const ranking = computePhase2Ranking(state)
        state.phase2MainType = ranking.mainType
        state.phase2SecondaryType = ranking.secondaryType
        state.phase2MainHistory.push(ranking.mainType)
        state.phase2SecondaryHistory.push(ranking.secondaryType)

        if (state.phase2CurrentRound === 1) {
            state.phase2CurrentRound = 2
            state.phase2CurrentItemIndex = 0
            await initializePhase2Round(state)
            return {
                reply: buildPhase2StatementPrompt(state),
                stateJson: stringifyState(state),
                stepKey: 'phase2_statement',
                status: 'phase2_running',
                patch: {
                    phase2MainType: ranking.mainType,
                    phase2SecondaryType: ranking.secondaryType,
                },
            }
        }

        const summary = buildIntermediateText(state, state.phase2CurrentRound)
        return {
            reply: summary,
            stateJson: stringifyState(state),
            stepKey: 'phase2_continue_decision',
            status: 'phase2_running',
            patch: {
                phase2MainType: ranking.mainType,
                phase2SecondaryType: ranking.secondaryType,
            },
        }
    }

    if (profiling.currentStepKey === 'completed') {
        return {
            reply: 'Dieses Profiling ist bereits abgeschlossen. Sie koennen ein neues Profiling starten oder ein anderes fortsetzen.',
            stateJson: profiling.stateJson,
            stepKey: 'completed',
            status: 'completed',
            patch: {},
        }
    }

    return {
        reply: 'Der Profiling-Status konnte nicht zugeordnet werden. Bitte starten Sie das Profiling erneut.',
        stateJson: profiling.stateJson,
        stepKey: profiling.currentStepKey,
        status: profiling.status,
        patch: {},
    }
}

export async function persistProfilingTransition(
    profilingId: string,
    transition: { stateJson: string; stepKey: string; status: Profiling['status']; patch: Partial<Profiling> },
): Promise<void> {
    await updateProfiling(profilingId, {
        stateJson: transition.stateJson,
        currentStepKey: transition.stepKey,
        status: transition.status,
        ...transition.patch,
    })
}
