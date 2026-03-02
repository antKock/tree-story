'use client'

import { useState } from 'react'
import type { StoryConfig } from '@/engine/types'
import * as themeManager from '@/engine/themeManager'
import ProfileCreation from './ProfileCreation'
import StoryReader from './StoryReader'

interface GameShellProps {
  config: StoryConfig
}

export default function GameShell({ config }: GameShellProps) {
  const [phase, setPhase] = useState<'profile' | 'story'>('profile')
  const [pendingStats, setPendingStats] = useState<Record<string, number> | null>(null)

  function handleStart(stats: Record<string, number>) {
    setPendingStats(stats)
    setPhase('story')
  }

  function handleReplay() {
    themeManager.resetToDefaults()
    setPendingStats(null)
    setPhase('profile')
  }

  if (phase === 'profile') {
    return <ProfileCreation config={config} onStart={handleStart} />
  }

  return <StoryReader config={config} initialStats={pendingStats} onReplay={handleReplay} />
}
