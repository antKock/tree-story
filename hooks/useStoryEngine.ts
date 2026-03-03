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
    // Intentionally do NOT increment animKey here: decay is a silent background process.
    // The delta pill keeps showing the last choice's deltas without re-animating.
  }, [commitState])

  const resetEngine = useCallback(() => {
    persistence.clear()
    engineRef.current!.reset()
    setEngineState(engineRef.current!.getState())
    // Do NOT call commitState() here — it would re-save a fresh state to localStorage,
    // causing a refresh to skip the landing/profile screens and jump straight into the story.
  }, [])

  const setStats = useCallback((stats: Record<string, number>) => {
    engineRef.current!.setStats(stats)
    commitState()
  }, [commitState])

  return { engineState, resolveChoice, applyDecay, resetEngine, setStats, animKey }
}
