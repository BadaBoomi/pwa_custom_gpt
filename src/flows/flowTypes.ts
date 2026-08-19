import type { FlowSession } from '@/db/db'

export interface FlowHandlingResult {
    nextStep: string
    status: FlowSession['status']
    answers: Record<string, string>
    assistantReply: string
    resultSummary?: string
}

export interface RuleFlowHandler {
    getInitialPrompt(flowType: string, session: FlowSession): Promise<string> | string
    handleTurn(session: FlowSession, userInput: string): Promise<FlowHandlingResult> | FlowHandlingResult
}
