'use client'

import { useState, useEffect, useRef } from 'react'
import type { StoryConfig, EngineState } from '@/engine/types'
import ParagraphDisplay from './ParagraphDisplay'
import LeaderboardSection from './LeaderboardSection'

interface EndScreenProps {
  engineState: EngineState
  config: StoryConfig
  storyId: string
  playerName: string
  onReplay: () => void
}

export default function EndScreen({ engineState, config, storyId, playerName, onReplay }: EndScreenProps) {
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  // Fire-and-forget score submission on mount (regardless of which view)
  const scoreSubmitted = useRef(false)
  useEffect(() => {
    if (scoreSubmitted.current) return
    scoreSubmitted.current = true
    fetch(`/api/stories/${storyId}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName,
        score: Math.round(engineState.score),
        isGameOver: engineState.isGameOver,
      }),
    }).catch(() => {})
  }, [storyId, playerName, engineState.score, engineState.isGameOver])

  // Determine paragraph and tier content
  let paragraphContent: string | null = null
  let tierContent: string | null = null

  if (engineState.isGameOver) {
    const gameOverParagraph = engineState.gameOverParagraphId
      ? config.paragraphs[engineState.gameOverParagraphId]
      : null
    if (gameOverParagraph) {
      paragraphContent = gameOverParagraph.content
    }
  } else if (engineState.isComplete) {
    const completionParagraph = config.paragraphs[engineState.paragraphId]
    if (completionParagraph) {
      paragraphContent = completionParagraph.content
    }

    const tier = config.endStateTiers.find(
      t => engineState.score >= t.minScore && engineState.score <= t.maxScore
    )
    if (tier) {
      tierContent = tier.text
    }
  }

  const tagline = engineState.isGameOver
    ? 'Fin de l\u2019aventure'
    : 'Bravo, tu as terminé l\u2019histoire\u00a0!'

  // --- End Text Screen (Step 1) ---
  if (!showLeaderboard) {
    return (
      <main style={{ flex: 1, paddingTop: '2rem', paddingBottom: '3rem' }}>
        {paragraphContent && <ParagraphDisplay content={paragraphContent} />}
        {tierContent && <ParagraphDisplay content={tierContent} />}

        <div className="reading-column" style={{ marginTop: '2rem' }}>
          <button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            style={{
              width: '100%',
              minHeight: '48px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--color-accent)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-ui)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
          >
            Continuer
          </button>
        </div>
      </main>
    )
  }

  // --- Leaderboard Screen (Step 2) ---
  return (
    <main
      aria-label="Résultats"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 40%)',
      }}
    >
      {/* Score Recap */}
      <div
        role="group"
        aria-label="Récapitulatif du score"
        style={{
          flexShrink: 0,
          textAlign: 'center',
          padding: '2.5rem 1.5rem 1.5rem',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--color-text-muted)',
            marginBottom: '0.5rem',
          }}
        >
          Ton score
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '3.5rem',
            fontWeight: 700,
            color: 'var(--color-accent)',
            lineHeight: 1,
            marginBottom: '0.5rem',
          }}
        >
          {Math.round(engineState.score)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-prose)',
            fontStyle: 'italic',
            fontSize: '15px',
            color: 'var(--color-text-muted)',
            maxWidth: '260px',
            margin: '0 auto',
            lineHeight: 1.5,
          }}
        >
          {tagline}
        </div>
      </div>

      {/* Gradient Divider */}
      <div
        style={{
          flexShrink: 0,
          height: '1px',
          margin: '0 1.5rem 1rem',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        }}
      />

      {/* Leaderboard Card — fills remaining space */}
      <LeaderboardSection
        storyId={storyId}
        playerName={playerName}
        playerScore={engineState.score}
      />

      {/* Footer with Replay Button */}
      <div
        style={{
          flexShrink: 0,
          padding: '1rem 1.5rem 2rem',
          position: 'relative',
        }}
      >
        {/* Gradient fade above button */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: 0,
            right: 0,
            height: '20px',
            background: 'linear-gradient(to top, var(--color-bg), transparent)',
            pointerEvents: 'none',
          }}
        />
        <button
          type="button"
          onClick={onReplay}
          style={{
            width: '100%',
            minHeight: '48px',
            borderRadius: '8px',
            border: 'none',
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            fontFamily: 'var(--font-ui)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 150ms ease',
          }}
        >
          Rejouer
        </button>
      </div>
    </main>
  )
}
