import type { RuleFlowHandler } from '@/flows/flowTypes'
import { normalizeFlowType } from '@/flows/ruleFlowEngine'

const flowModules = import.meta.glob<{ default: RuleFlowHandler }>('../rule_flows/*.ts', {
    eager: true,
})

const handlersByFlowType = new Map<string, RuleFlowHandler>()

for (const [modulePath, moduleValue] of Object.entries(flowModules)) {
    const parts = modulePath.split('/')
    const fileName = parts[parts.length - 1]
    if (!fileName) continue

    const flowType = fileName.replace(/\.ts$/, '')
    handlersByFlowType.set(flowType, moduleValue.default)
}

export function getRuleFlowHandler(flowType: string): RuleFlowHandler | null {
    const normalized = normalizeFlowType(flowType)
    return handlersByFlowType.get(normalized) ?? null
}
