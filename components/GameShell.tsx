'use client'

import { useEffect, useState } from 'react'
import type { StoryConfig } from '@/engine/types'
import * as persistence from '@/engine/persistence'
import * as themeManager from '@/engine/themeManager'
import ProfileCreation from './ProfileCreation'
import StoryReader from './StoryReader'

interface GameShellProps {
  config: StoryConfig
}

// Defined at module scope — NOT inside GameShell — to prevent React from
// treating it as a new component type on every render (which would unmount/remount it).
function LandingScreen({ config, onBegin }: { config: StoryConfig; onBegin: () => void }) {
  const introText = config.meta.introText ?? config.meta.description
  return (
    <div className="reading-column" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          color: 'var(--color-text-primary)',
        }}
      >
        {config.meta.title}
      </h1>
      {introText && (
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '1.05rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.7,
            marginBottom: '3rem',
          }}
        >
          {introText}
        </p>
      )}
      <button
        type="button"
        onClick={onBegin}
        autoFocus
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
        }}
      >
        Commencer
      </button>
    </div>
  )
}

function hasActiveGame(config: StoryConfig): boolean {
  const saved = persistence.load()
  if (!saved) return false
  if (saved.storyId !== config.id) return false
  const es = saved.engineState
  if (es.isGameOver || es.isComplete) {
    // Clear stale completed/game-over saves so they don't get restored
    // when the player starts a new game
    persistence.clear()
    return false
  }
  return true
}

export default function GameShell({ config }: GameShellProps) {
  const [phase, setPhase] = useState<'landing' | 'profile' | 'story' | 'loading'>('loading')
  const [pendingStats, setPendingStats] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    const active = hasActiveGame(config)
    if (!active) {
      themeManager.apply(config.acts[0].id, config)
    }
    setPhase(active ? 'story' : 'landing')
  }, [config])

  function handleBegin() {
    setPhase('profile')
  }

  function handleStart(stats: Record<string, number>) {
    setPendingStats(stats)
    setPhase('story')
  }

  function handleReplay() {
    themeManager.resetToDefaults()
    themeManager.apply(config.acts[0].id, config)
    setPendingStats(null)
    setPhase('landing')
  }

  if (phase === 'loading') {
    return null
  }

  if (phase === 'landing') {
    return <LandingScreen config={config} onBegin={handleBegin} />
  }

  if (phase === 'profile') {
    return <ProfileCreation config={config} onStart={handleStart} />
  }

  return <StoryReader config={config} initialStats={pendingStats} onReplay={handleReplay} />
}
