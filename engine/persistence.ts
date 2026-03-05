// Pure engine module — zero imports from components/, hooks/, or app/
import type { EngineState, SaveState } from './types'

const LEGACY_SAVE_KEY = 'tree-story:save'

function getSaveKey(storyId: string): string {
  return `tree-story:save:${storyId}`
}

export function migrateToPerStoryKey(storyId: string): void {
  if (typeof globalThis.localStorage === 'undefined') return
  const legacyData = localStorage.getItem(LEGACY_SAVE_KEY)
  const newKey = getSaveKey(storyId)
  if (legacyData && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, legacyData)
    localStorage.removeItem(LEGACY_SAVE_KEY)
  }
}

export function save(engineState: EngineState, storyId: string): void {
  if (typeof globalThis.localStorage === 'undefined') return

  const saveState: SaveState = {
    storyId,
    version: 1,
    savedAt: Date.now(),
    engineState,
  }

  localStorage.setItem(getSaveKey(storyId), JSON.stringify(saveState))
}

export function load(storyId: string): SaveState | null {
  if (typeof globalThis.localStorage === 'undefined') return null

  try {
    const item = localStorage.getItem(getSaveKey(storyId))
    if (item === null) return null

    const parsed = JSON.parse(item)
    if (parsed.version !== 1) return null
    if (typeof parsed.storyId !== 'string') return null
    if (typeof parsed.savedAt !== 'number') return null

    const es = parsed.engineState
    if (!es || typeof es !== 'object') return null
    if (typeof es.storyId !== 'string') return null
    if (typeof es.paragraphId !== 'string') return null
    if (typeof es.act !== 'string') return null
    if (typeof es.score !== 'number') return null
    if (typeof es.isGameOver !== 'boolean') return null
    if (typeof es.isComplete !== 'boolean') return null
    if (!es.gauges || typeof es.gauges !== 'object') return null
    if (!es.stats || typeof es.stats !== 'object') return null
    if (!Array.isArray(es.inventory)) return null
    if (es.gameOverParagraphId !== null && typeof es.gameOverParagraphId !== 'string') return null

    return parsed as SaveState
  } catch {
    return null
  }
}

export function clear(storyId: string): void {
  if (typeof globalThis.localStorage === 'undefined') return
  localStorage.removeItem(getSaveKey(storyId))
}
