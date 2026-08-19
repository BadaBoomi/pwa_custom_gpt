import type { FlowSession } from '@/db/db'
import type { FlowHandlingResult, RuleFlowHandler } from '@/flows/flowTypes'
import { DEFAULT_RULE_FLOW_TYPE } from '@/flows/ruleFlowEngine'

const EMAIL_OR_PHONE = new Set(['email', 'phone'])
const EMAIL_PHONE_BUTTONS_TOKEN = '[[buttons:[email|email],[phone|phone]]]'
const YES_NO_BUTTONS_TOKEN = '[[buttons:[yes|yes],[no|no]]]'

function withButtons(text: string, token: string): string {
    return `${text}\n${token}`
}

function runningReply(session: FlowSession, assistantReply: string): FlowHandlingResult {
    return {
        nextStep: session.currentStep,
        status: 'running',
        answers: session.answers,
        assistantReply,
    }
}

const collectContactFlow: RuleFlowHandler = {
    getInitialPrompt(flowType: string, _session: FlowSession): string {
        if (flowType !== DEFAULT_RULE_FLOW_TYPE) {
            return 'Deterministic flow started. Please tell me your name.'
        }
        return 'Deterministic flow started. What is your name?'
    },

    handleTurn(session: FlowSession, userInput: string): FlowHandlingResult {
        const input = userInput.trim()

        if (!input) {
            return runningReply(session, 'Please provide a value so we can continue.')
        }

        if (session.currentStep === 'ask_name') {
            if (input.length < 2) {
                return runningReply(session, 'Please enter a name with at least 2 characters.')
            }

            return {
                nextStep: 'ask_contact_method',
                status: 'running',
                answers: { ...session.answers, name: input },
                assistantReply: withButtons('Preferred contact method: email or phone?', EMAIL_PHONE_BUTTONS_TOKEN),
            }
        }

        if (session.currentStep === 'ask_contact_method') {
            const method = input.toLowerCase()
            if (!EMAIL_OR_PHONE.has(method)) {
                return runningReply(session, withButtons('Please reply with exactly "email" or "phone".', EMAIL_PHONE_BUTTONS_TOKEN))
            }

            const answers: Record<string, string> = { ...session.answers, contactMethod: method }
            return {
                nextStep: 'confirm',
                status: 'running',
                answers,
                assistantReply: withButtons(
                    `Confirm: name=${answers.name}, contact=${answers.contactMethod}. Reply yes or no.`,
                    YES_NO_BUTTONS_TOKEN,
                ),
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

            return runningReply(session, withButtons('Please answer with yes or no.', YES_NO_BUTTONS_TOKEN))
        }

        return {
            nextStep: 'ask_name',
            status: 'running',
            answers: {},
            assistantReply: 'Flow state was reset. What is your name?',
        }
    },
}

export default collectContactFlow
