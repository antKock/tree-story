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
  }, [commitState])

  const applyDecay = useCallback(() => {
    engineRef.current!.applyDecay()
    commitState()
  }, [commitState])

  const resetEngine = useCallback(() => {
    persistence.clear()
    engineRef.current!.reset()
    commitState()
  }, [commitState])

  const setStats = useCallback((stats: Record<string, number>) => {
    engineRef.current!.setStats(stats)
    commitState()
  }, [commitState])

  return { engineState, resolveChoice, applyDecay, resetEngine, setStats }
}
