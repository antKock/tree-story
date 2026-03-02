// Pure engine module — zero imports from components/, hooks/, or app/
// This is the ONLY file in the codebase that calls document.documentElement.style.setProperty
import type { StoryConfig } from './types'

// Track every property that has been set so resetToDefaults() can clear exactly those — no hardcoded list.
const appliedProperties = new Set<string>()

export function apply(actId: string, config: StoryConfig): void {
  if (typeof document === 'undefined') return

  const act = config.acts.find(a => a.id === actId)
  if (!act) return

  for (const [propertyName, value] of Object.entries(act.theme)) {
    document.documentElement.style.setProperty(propertyName, value)
    appliedProperties.add(propertyName)
  }
}

export function resetToDefaults(): void {
  if (typeof document === 'undefined') return

  // Remove every inline override that was applied via apply(), so :root CSS vars take effect.
  for (const prop of appliedProperties) {
    document.documentElement.style.removeProperty(prop)
  }
  appliedProperties.clear()
}
