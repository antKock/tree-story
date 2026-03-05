// Pure engine module — zero imports from components/, hooks/, or app/
// This is the ONLY file in the codebase that calls document.documentElement.style.setProperty
import type { StoryConfig } from './types'

const THEME_STORAGE_KEY = 'tree-story:theme'

// Track every property that has been set so resetToDefaults() can clear exactly those — no hardcoded list.
const appliedProperties = new Set<string>()

export function apply(actId: string, config: StoryConfig): void {
  if (typeof document === 'undefined') return

  const act = config.acts.find(a => a.id === actId)
  if (!act) return

  const themeTokens: Record<string, string> = {}
  for (const [propertyName, value] of Object.entries(act.theme)) {
    document.documentElement.style.setProperty(propertyName, value)
    appliedProperties.add(propertyName)
    themeTokens[propertyName] = value
  }

  // Persist theme for landing page restoration
  if (typeof globalThis.localStorage !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeTokens))
  }
}

export function restoreFromStorage(): void {
  if (typeof document === 'undefined') return
  if (typeof globalThis.localStorage === 'undefined') return

  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return
    const theme = JSON.parse(raw) as Record<string, unknown>
    for (const [prop, value] of Object.entries(theme)) {
      if (typeof value === 'string' && value) {
        document.documentElement.style.setProperty(prop, value)
        appliedProperties.add(prop)
      }
    }
  } catch {
    // Defaults apply
  }
}

export function resetToDefaults(): void {
  if (typeof document === 'undefined') return

  // Remove every inline override that was applied via apply(), so :root CSS vars take effect.
  for (const prop of appliedProperties) {
    document.documentElement.style.removeProperty(prop)
  }
  appliedProperties.clear()

  // Clear persisted theme so it doesn't get restored later
  if (typeof globalThis.localStorage !== 'undefined') {
    localStorage.removeItem(THEME_STORAGE_KEY)
  }
}
