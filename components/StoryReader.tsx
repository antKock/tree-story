'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import type { StoryConfig } from '@/engine/types'
import { useStoryEngine } from '@/hooks/useStoryEngine'
import GaugeStrip from './GaugeStrip'
import ParagraphDisplay from './ParagraphDisplay'
import ChoiceCards from './ChoiceCards'
import CharacterSheet from './CharacterSheet'
import EndScreen from './EndScreen'

interface StoryReaderProps {
  config: StoryConfig
  initialStats: Record<string, number> | null
  playerName?: string | null
  onReplay: () => void
}

export default function StoryReader({ config, initialStats, playerName, onReplay }: StoryReaderProps) {
  const { engineState, resolveChoice, applyDecay, resetEngine, setStats, setPlayerName } = useStoryEngine(config)
  const [sheetOpen, setSheetOpen] = useState(false)
  const prevParagraphId = useRef(engineState.paragraphId)
  const statsApplied = useRef(false)
  const nameApplied = useRef(false)

  // Apply initial stats once on mount
  useEffect(() => {
    if (initialStats && !statsApplied.current) {
      setStats(initialStats)
      statsApplied.current = true
    }
  }, [initialStats, setStats])

  // Apply player name once on mount
  useEffect(() => {
    if (playerName && !nameApplied.current) {
      setPlayerName(playerName)
      nameApplied.current = true
    }
  }, [playerName, setPlayerName])

  // Apply decay when arriving at a decay node
  useEffect(() => {
    if (prevParagraphId.current !== engineState.paragraphId) {
      prevParagraphId.current = engineState.paragraphId
      if (config.decayNodes.includes(engineState.paragraphId)) {
        applyDecay()
      }
    }
  }, [engineState.paragraphId, config.decayNodes, applyDecay])

  // Scroll to top on every paragraph transition (useLayoutEffect fires before paint)
  useLayoutEffect(() => {
    document.documentElement.scrollTop = 0
  }, [engineState.paragraphId])

  const currentParagraph = config.paragraphs[engineState.paragraphId]

  // Game over or story complete → show end screen (no gauge strip — full-viewport layout)
  if (engineState.isGameOver || engineState.isComplete) {
    return (
      <EndScreen
        engineState={engineState}
        config={config}
        storyId={config.id}
        playerName={engineState.playerName}
        onReplay={() => {
          resetEngine()
          onReplay()
        }}
      />
    )
  }

  if (!currentParagraph) {
    return (
      <div className="reading-column" style={{ paddingTop: '3rem' }}>
        <p style={{ color: 'var(--color-danger)' }}>
          Paragraph &quot;{engineState.paragraphId}&quot; not found.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <GaugeStrip
        gauges={engineState.gauges}
        config={config}
        onOpenCharacterSheet={() => setSheetOpen(true)}
      />

      <main style={{ flex: 1, paddingTop: '1.5rem' }}>
        <ParagraphDisplay
          content={currentParagraph.content}
          outcomeText={engineState.lastOutcomeText}
          gaugeDeltas={engineState.lastGaugeDeltas}
          gauges={config.gauges}
        />
        <ChoiceCards choices={currentParagraph.choices} onChoose={resolveChoice} />
      </main>

      <CharacterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        engineState={engineState}
        config={config}
      />
    </div>
  )
}
