'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { StoryConfig, EngineState } from '../engine/types'
import { createEngine, type Engine } from '../engine/storyEngine'
import * as persistence from '../engine/persistence'
import * as themeManager from '../engine/themeManager'

export function useStoryEngine(config: StoryConfig) {
  const engineRef = useRef<Engine | null>(null)

  if (engineRef.current === null) {
    const savedState = persistence.load()
    engineRef.current = createEngine(config, savedState ?? undefined)
  }

  const [engineState, setEngineState] = useState<EngineState>(
    () => engineRef.current!.getState()
  )
  const [animKey, setAnimKey] = useState(0)

  useEffect(() => {
    themeManager.apply(engineState.act, config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const commitState = useCallback(() => {
    const newState = engineRef.current!.getState()
    setEngineState(newState)
    persistence.save(newState, config.id)
    themeManager.apply(newState.act, config)
  }, [config])

  const resolveChoice = useCallback((choiceId: string) => {
    engineRef.current!.resolveChoice(choiceId)
    commitState()
    setAnimKey(k => k + 1)
  }, [commitState])

  const applyDecay = useCallback(() => {
    engineRef.current!.applyDecay()
    commitState()
    // Increment animKey so the delta pill remounts and re-animates after decay.
    // The pill continues to show the most recent choice's lastGaugeDeltas (not decay amounts),
    // which is intentional — decay is a silent background process.
    setAnimKey(k => k + 1)
  }, [commitState])

  const resetEngine = useCallback(() => {
    persistence.clear()
    engineRef.current!.reset()
    commitState()
    // animKey intentionally not reset — keeps incrementing across sessions
  }, [commitState])

  const setStats = useCallback((stats: Record<string, number>) => {
    engineRef.current!.setStats(stats)
    commitState()
  }, [commitState])

  return { engineState, resolveChoice, applyDecay, resetEngine, setStats, animKey }
}
