import * as XLSX from 'xlsx'
import profilingWorkbookUrl from '../../resources/Profilingfragen Phase 1 und Phase 2.xlsx?url'

export interface Phase1Statement {
    id: number
    category: string
    statement: string
    wwType: number
    weight: number
}

export interface Phase2Statement {
    id: number
    roundValue: number
    statement: string
    wwType: number
}

export interface ProfilingWorkbookData {
    version: string
    phase1: Phase1Statement[]
    phase2: Phase2Statement[]
}

const PHASE1_SHEET = 'Phase_1'
const PHASE2_SHEET = 'Phase_2'

let cachedWorkbookPromise: Promise<ProfilingWorkbookData> | null = null

function normalizeKey(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9]+/g, '')
        .toLowerCase()
}

function stableStringId(value: string): number {
    let hash = 0
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0
    }
    return Math.abs(hash)
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const trimmed = value.trim().replace(',', '.')
        if (trimmed === '') return Number.NaN
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
            return Number(trimmed)
        }
        return stableStringId(trimmed)
    }
    return Number.NaN
}

function rowToRecord(headers: string[], row: unknown[]): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    headers.forEach((header, idx) => {
        out[normalizeKey(header)] = row[idx]
    })
    return out
}

function simpleHash(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) | 0
    }
    return `xlsx_${Math.abs(hash)}`
}

function isBlankValue(value: unknown): boolean {
    return value === undefined || value === null || String(value).trim() === ''
}

function isEmptyRow(row: unknown[]): boolean {
    return row.length === 0 || row.every(isBlankValue)
}

function getRequired(record: Record<string, unknown>, keys: string[], rowIdx: number, sheet: string): unknown {
    for (const key of keys) {
        if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') {
            return record[key]
        }
    }
    throw new Error(`Missing required column in ${sheet} row ${rowIdx + 2}`)
}

function parsePhase1(sheet: XLSX.WorkSheet): Phase1Statement[] {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })
    if (rows.length < 2) return []

    const headers = (rows[0] ?? []).map((cell) => String(cell ?? ''))
    const parsed: Phase1Statement[] = []

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!Array.isArray(row) || isEmptyRow(row)) continue

        try {
            const record = rowToRecord(headers, row)

            const id = toNumber(getRequired(record, ['id'], i, PHASE1_SHEET))
            const category = String(getRequired(record, ['kategorie', 'category'], i, PHASE1_SHEET)).trim()
            const statement = String(getRequired(record, ['aussage', 'statement', 'text'], i, PHASE1_SHEET)).trim()
            const wwType = toNumber(getRequired(record, ['wwtyp', 'wtyp', 'typ'], i, PHASE1_SHEET))
            const weight = toNumber(getRequired(record, ['gewichtung', 'weight'], i, PHASE1_SHEET))

            if (!Number.isFinite(id) || !Number.isFinite(wwType) || !Number.isFinite(weight) || !statement || !category) {
                continue
            }

            parsed.push({
                id,
                category,
                statement,
                wwType,
                weight,
            })
        } catch {
            continue
        }
    }

    return parsed
}

function parsePhase2(sheet: XLSX.WorkSheet): Phase2Statement[] {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 })
    if (rows.length < 2) return []

    const headers = (rows[0] ?? []).map((cell) => String(cell ?? ''))
    const parsed: Phase2Statement[] = []

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        if (!Array.isArray(row) || isEmptyRow(row)) continue

        try {
            const record = rowToRecord(headers, row)

            const id = toNumber(getRequired(record, ['id'], i, PHASE2_SHEET))
            const roundValue = toNumber(getRequired(record, ['runde', 'round'], i, PHASE2_SHEET))
            const statement = String(getRequired(record, ['aussage', 'statement', 'text'], i, PHASE2_SHEET)).trim()
            const wwType = toNumber(getRequired(record, ['wwtyp', 'wtyp', 'typ'], i, PHASE2_SHEET))

            if (!Number.isFinite(id) || !Number.isFinite(roundValue) || !Number.isFinite(wwType) || !statement) {
                continue
            }

            parsed.push({
                id,
                roundValue,
                statement,
                wwType,
            })
        } catch {
            continue
        }
    }

    return parsed
}

async function loadWorkbookData(): Promise<ProfilingWorkbookData> {
    const response = await fetch(profilingWorkbookUrl)
    if (!response.ok) {
        throw new Error(`Profiling workbook could not be loaded (status=${response.status}).`)
    }

    const content = await response.arrayBuffer()
    const workbook = XLSX.read(content, { type: 'array' })

    const phase1Sheet = workbook.Sheets[PHASE1_SHEET]
    const phase2Sheet = workbook.Sheets[PHASE2_SHEET]

    if (!phase1Sheet || !phase2Sheet) {
        throw new Error('Profiling workbook must contain sheets "Phase_1" and "Phase_2".')
    }

    const phase1 = parsePhase1(phase1Sheet)
    const phase2 = parsePhase2(phase2Sheet)

    if (phase1.length === 0 || phase2.length === 0) {
        throw new Error('Profiling workbook parsing returned no statements.')
    }

    const version = simpleHash(JSON.stringify({ phase1, phase2 }))
    return { version, phase1, phase2 }
}

export function getProfilingWorkbookData(): Promise<ProfilingWorkbookData> {
    if (!cachedWorkbookPromise) {
        cachedWorkbookPromise = loadWorkbookData()
    }
    return cachedWorkbookPromise
}
