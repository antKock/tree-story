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

const RESULT_DISPLAY_MS = 1500

interface StoryReaderProps {
  config: StoryConfig
  initialStats: Record<string, number> | null
  onReplay: () => void
}

export default function StoryReader({ config, initialStats, onReplay }: StoryReaderProps) {
  const { engineState, resolveChoice, applyDecay, resetEngine, setStats, animKey } = useStoryEngine(config)
  const [sheetOpen, setSheetOpen] = useState(false)
  const statsApplied = useRef(false)

  // ── Result phase ─────────────────────────────────────────────────────────────
  // displayedParagraphId holds the paragraph currently shown in the UI.
  // It lags behind engineState.paragraphId for RESULT_DISPLAY_MS when there is a
  // result to show, so the result appears with the departing paragraph (B) rather
  // than the arriving paragraph (C).
  const [displayedParagraphId, setDisplayedParagraphId] = useState(engineState.paragraphId)
  const [capturedResult, setCapturedResult] = useState<{
    text: string | null
    deltas: Record<string, number> | null
  } | null>(null)

  const isTransitioning =
    !engineState.isGameOver &&
    !engineState.isComplete &&
    displayedParagraphId !== engineState.paragraphId

  useEffect(() => {
    if (engineState.paragraphId === displayedParagraphId) return

    // Game over / complete: skip the result phase, advance immediately
    if (engineState.isGameOver || engineState.isComplete) {
      setDisplayedParagraphId(engineState.paragraphId)
      return
    }

    const hasResult =
      !!engineState.lastOutcomeText ||
      !!(engineState.lastGaugeDeltas && Object.keys(engineState.lastGaugeDeltas).length > 0)

    if (!hasResult) {
      setDisplayedParagraphId(engineState.paragraphId)
      return
    }

    // Capture the result snapshot (engine state will be overwritten on the next choice)
    setCapturedResult({ text: engineState.lastOutcomeText, deltas: engineState.lastGaugeDeltas })
    window.scrollTo({ top: 0, behavior: 'instant' })

    const timer = setTimeout(() => {
      setDisplayedParagraphId(engineState.paragraphId)
      setCapturedResult(null)
    }, RESULT_DISPLAY_MS)

    return () => clearTimeout(timer)
  }, [engineState.paragraphId, engineState.isGameOver, engineState.isComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stats init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialStats && !statsApplied.current) {
      setStats(initialStats)
      statsApplied.current = true
    }
  }, [initialStats, setStats])

  // ── Arrival effects (decay + scroll) ─────────────────────────────────────────
  // These fire when the displayed paragraph actually changes (after the result phase),
  // not when the engine paragraph changes.
  const prevDisplayedRef = useRef(displayedParagraphId)
  useEffect(() => {
    if (prevDisplayedRef.current === displayedParagraphId) return
    prevDisplayedRef.current = displayedParagraphId

    if (config.decayNodes.includes(displayedParagraphId)) {
      applyDecay()
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [displayedParagraphId, config.decayNodes, applyDecay])

  // ── Render ────────────────────────────────────────────────────────────────────
  const currentParagraph = config.paragraphs[displayedParagraphId]

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
          Paragraph &quot;{displayedParagraphId}&quot; not found.
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

        {/* Result appears with the departing paragraph (B), then the arriving paragraph (C) renders clean */}
        {isTransitioning && capturedResult && (
          <ResultBlock
            text={capturedResult.text}
            gaugeDeltas={capturedResult.deltas}
            gauges={config.gauges}
          />
        )}

        {!isTransitioning && (
          <ChoiceCards choices={currentParagraph.choices} onChoose={resolveChoice} />
        )}
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
