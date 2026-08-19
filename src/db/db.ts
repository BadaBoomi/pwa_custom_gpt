import Dexie, { type EntityTable } from 'dexie'

// ── Domain types ──────────────────────────────────────────────────────────────
// Entsprechen 1:1 den Android-Entities (RoomEntity, ChatEntity, MessageEntity)

export interface Room {
    id: string
    name: string
    customAttributes?: Record<string, string>
    createdAt: number // Unix ms
}

export interface Chat {
    id: string
    roomId: string
    name: string
    threadId: string
    createdAt: number
}

export interface Message {
    id: string
    chatId: string
    role: 'user' | 'assistant'
    content: string
    createdAt: number
}

export type FlowStatus = 'running' | 'completed' | 'aborted'

export interface FlowSession {
    chatId: string
    flowId: string
    flowType: string
    status: FlowStatus
    currentStep: string
    answers: Record<string, string>
    resultSummary?: string
    createdAt: number
    updatedAt: number
}

export type ProfilingStatus =
    | 'alias_created'
    | 'phase1_running'
    | 'phase1_done_phase2_not_started'
    | 'phase2_running'
    | 'paused'
    | 'completed'

export interface Profiling {
    id: string
    chatId: string
    userScopeId: string
    alias: string
    aliasNormalized: string
    aliasConfirmed: boolean
    status: ProfilingStatus
    currentPhase: 1 | 2
    phase1MainType?: number
    phase1SecondaryType?: number
    phase2MainType?: number
    phase2SecondaryType?: number
    stabilityLabel?: string
    workbookVersion: string
    textBlockVersion: string
    currentStepKey: string
    stateJson: string
    createdAt: number
    updatedAt: number
}

export interface ProfilingResponse {
    id: string
    profilingId: string
    statementId: number
    statementVersion: string
    statementTextSnapshot: string
    value: number
    answeredAt: number
    phase: 1 | 2
    scopeKey: string
    orderInScope: number
    roundNumber?: number
    categoryName?: string
}

export interface ProfilingTextBlock {
    id: string
    key: string
    version: string
    text: string
    active: boolean
    updatedAt: number
}

// ── Database ──────────────────────────────────────────────────────────────────

class AppDb extends Dexie {
    rooms!: EntityTable<Room, 'id'>
    chats!: EntityTable<Chat, 'id'>
    messages!: EntityTable<Message, 'id'>
    flowSessions!: EntityTable<FlowSession, 'chatId'>
    profilings!: EntityTable<Profiling, 'id'>
    profilingResponses!: EntityTable<ProfilingResponse, 'id'>
    profilingTextBlocks!: EntityTable<ProfilingTextBlock, 'id'>

    constructor() {
        super('acustomgpt_db')

        this.version(1).stores({
            rooms: 'id, createdAt',
            chats: 'id, roomId, createdAt',
            messages: 'id, chatId, createdAt',
        })

        this.version(2).stores({
            rooms: 'id, createdAt',
            chats: 'id, roomId, createdAt',
            messages: 'id, chatId, createdAt',
            flowSessions: 'chatId, status, updatedAt',
        })

        // Version 3 — adds room-level custom attributes.
        this.version(3)
            .stores({
                rooms: 'id, createdAt',
                chats: 'id, roomId, createdAt',
                messages: 'id, chatId, createdAt',
                flowSessions: 'chatId, status, updatedAt',
            })
            .upgrade(async (tx) => {
                await tx.table('rooms').toCollection().modify((room: Room) => {
                    room.customAttributes ??= {}
                })
            })
    }
}

export const db = new AppDb()
