// Pure engine module — zero imports from components/, hooks/, or app/
// This is the ONLY file in the codebase that calls document.documentElement.style.setProperty
import type { StoryConfig } from './types'

export function apply(actId: string, config: StoryConfig): void {
  if (typeof document === 'undefined') return

  const act = config.acts.find(a => a.id === actId)
  if (!act) return

  for (const [propertyName, value] of Object.entries(act.theme)) {
    document.documentElement.style.setProperty(propertyName, value)
  }
}

export function resetToDefaults(): void {
  if (typeof document === 'undefined') return

  // Remove all act theme inline overrides so :root CSS custom properties take effect
  const themeProperties = ['--color-bg', '--color-surface', '--color-text-primary', '--color-text-muted', '--color-accent', '--color-danger']
  for (const prop of themeProperties) {
    document.documentElement.style.removeProperty(prop)
  }
}
