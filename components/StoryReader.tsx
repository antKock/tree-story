'use client'

import { useState, useEffect, useRef } from 'react'
import type { StoryConfig } from '@/engine/types'
import { useStoryEngine } from '@/hooks/useStoryEngine'
import GaugeStrip from './GaugeStrip'
import ParagraphDisplay from './ParagraphDisplay'
import ResultBlock from './ResultBlock'
import ChoiceCards from './ChoiceCards'
import CharacterSheet from './CharacterSheet'
import EndScreen from './EndScreen'

interface StoryReaderProps {
  config: StoryConfig
  initialStats: Record<string, number> | null
  onReplay: () => void
}

export default function StoryReader({ config, initialStats, onReplay }: StoryReaderProps) {
  const { engineState, resolveChoice, applyDecay, resetEngine, setStats, animKey } = useStoryEngine(config)
  const [sheetOpen, setSheetOpen] = useState(false)
  const prevParagraphId = useRef(engineState.paragraphId)
  const statsApplied = useRef(false)

  // Apply initial stats once on mount
  useEffect(() => {
    if (initialStats && !statsApplied.current) {
      setStats(initialStats)
      statsApplied.current = true
    }
  }, [initialStats, setStats])

  // Apply decay when arriving at a decay node
  useEffect(() => {
    if (prevParagraphId.current !== engineState.paragraphId) {
      prevParagraphId.current = engineState.paragraphId
      if (config.decayNodes.includes(engineState.paragraphId)) {
        applyDecay()
      }
    }
  }, [engineState.paragraphId, config.decayNodes, applyDecay])

  const currentParagraph = config.paragraphs[engineState.paragraphId]

  // Game over or story complete → show end screen
  if (engineState.isGameOver || engineState.isComplete) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <GaugeStrip
          gauges={engineState.gauges}
          config={config}
          onOpenCharacterSheet={() => setSheetOpen(true)}
          gaugeDeltas={engineState.lastGaugeDeltas}
          animKey={animKey}
        />
        <EndScreen
          engineState={engineState}
          config={config}
          onReplay={() => {
            resetEngine()
            onReplay()
          }}
        />
        <CharacterSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          engineState={engineState}
          config={config}
        />
      </div>
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
        gaugeDeltas={engineState.lastGaugeDeltas}
        animKey={animKey}
      />

      <main style={{ flex: 1, paddingTop: '1.5rem' }}>
        <ParagraphDisplay content={currentParagraph.content} />
        <ResultBlock text={engineState.lastOutcomeText} />
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
