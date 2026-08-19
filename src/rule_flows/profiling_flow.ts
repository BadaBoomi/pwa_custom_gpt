import type { FlowSession } from '@/db/db'
import type { FlowHandlingResult, RuleFlowHandler } from '@/flows/flowTypes'
import {
    buildProfilingMenuPrompt,
    resolveMenuInput,
    createProfilingFromAlias,
    continueProfilingTurn,
    persistProfilingTransition,
    renderCurrentPrompt,
} from '@/services/profilingEngine'
import { getProfilingById } from '@/repositories/profilingRepository'

function running(
    session: FlowSession,
    assistantReply: string,
    answers?: Record<string, string>,
    nextStep = session.currentStep,
): FlowHandlingResult {
    return {
        nextStep,
        status: 'running',
        answers: answers ?? session.answers,
        assistantReply,
    }
}

const profilingFlow: RuleFlowHandler = {
    async getInitialPrompt(_flowType: string, session: FlowSession): Promise<string> {
        const menu = await buildProfilingMenuPrompt(session.chatId)
        return `${menu}\n\nUm ein neues Profiling zu starten, antworten Sie mit "neu" oder direkt mit einem Alias.`
    },

    async handleTurn(session: FlowSession, userInput: string): Promise<FlowHandlingResult> {
        const input = userInput.trim()
        if (!input) {
            return running(session, 'Bitte geben Sie eine Eingabe ein, damit wir das Profiling fortsetzen koennen.', undefined, 'profiling_menu')
        }

        const answers = { ...session.answers }
        const activeProfilingId = answers.activeProfilingId
        const pendingAlias = answers.pendingAliasInput === '1'

        if (!activeProfilingId) {
            if (pendingAlias) {
                const created = await createProfilingFromAlias(session.chatId, input)
                if (!created.profiling) {
                    return running(session, created.assistantReply, answers, 'profiling_alias_input')
                }

                answers.activeProfilingId = created.profiling.id
                delete answers.pendingAliasInput
                return running(session, created.assistantReply, answers, 'profiling_alias_confirm')
            }

            const resolution = await resolveMenuInput(session.chatId, input)
            if (resolution.type === 'create_alias') {
                answers.pendingAliasInput = '1'
                return running(session, resolution.assistantReply, answers, 'profiling_alias_input')
            }

            if (resolution.type === 'resume' && resolution.profilingId) {
                answers.activeProfilingId = resolution.profilingId
                const profiling = await getProfilingById(resolution.profilingId)
                if (!profiling) {
                    delete answers.activeProfilingId
                    return running(session, 'Das ausgewaehlte Profiling konnte nicht geladen werden.', answers)
                }

                const currentPrompt = await renderCurrentPrompt(profiling)
                return {
                    nextStep: profiling.currentStepKey,
                    status: profiling.status === 'completed' ? 'completed' : 'running',
                    answers,
                    assistantReply: `${resolution.assistantReply}\n\n${currentPrompt}`,
                }
            }

            return running(
                session,
                `${resolution.assistantReply}\n\n${await buildProfilingMenuPrompt(session.chatId)}`,
                answers,
                'profiling_menu',
            )
        }

        const profiling = await getProfilingById(activeProfilingId)
        if (!profiling) {
            delete answers.activeProfilingId
            return running(
                session,
                'Das aktive Profiling wurde nicht gefunden. Wir zeigen die Uebersicht erneut.\n\n' +
                (await buildProfilingMenuPrompt(session.chatId)),
                answers,
                'profiling_menu',
            )
        }

        const transition = await continueProfilingTurn(profiling, input)
        await persistProfilingTransition(profiling.id, transition)

        if (transition.status === 'completed') {
            delete answers.activeProfilingId
            delete answers.pendingAliasInput
        }

        return {
            nextStep: transition.stepKey,
            status: transition.status === 'completed' ? 'completed' : 'running',
            answers,
            assistantReply: transition.reply,
            resultSummary: transition.status === 'completed' ? `profilingId=${profiling.id}` : undefined,
        }
    },
}

export default profilingFlow
