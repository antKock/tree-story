'use client'

import { useEffect } from 'react'
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
  // Fire-and-forget score submission
  useEffect(() => {
    fetch(`/api/stories/${storyId}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName,
        score: Math.round(engineState.score),
        isGameOver: engineState.isGameOver,
      }),
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const scoreGauge = config.gauges.find(g => g.isScore)

  // Determine which content to show
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

  return (
    <main style={{ flex: 1, paddingTop: '2rem', paddingBottom: '3rem' }}>
      {paragraphContent && <ParagraphDisplay content={paragraphContent} />}
      {tierContent && <ParagraphDisplay content={tierContent} />}

      {/* Score reveal */}
      {scoreGauge && (
        <div className="reading-column" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '20px',
              borderRadius: '8px',
              background: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span style={{ fontSize: '24px' }}>{scoreGauge.icon}</span>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {scoreGauge.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                }}
              >
                {Math.round(engineState.score)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replay button */}
      <div className="reading-column">
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

      {/* Leaderboard — fades in when data arrives, invisible on failure */}
      <div className="reading-column">
        <LeaderboardSection
          storyId={storyId}
          playerName={playerName}
          playerScore={engineState.score}
        />
      </div>
    </main>
  )
}
