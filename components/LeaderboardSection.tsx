'use client'

import { useState, useEffect } from 'react'
import LeaderboardEntry from './LeaderboardEntry'

interface LeaderboardEntryData {
  id: string
  storyId: string
  playerName: string
  score: number
  isGameOver: boolean
  createdAt: string
}

interface LeaderboardSectionProps {
  storyId: string
  playerName: string
  playerScore: number
}

async function fetchLeaderboard(storyId: string): Promise<LeaderboardEntryData[] | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`/api/stories/${storyId}/leaderboard`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default function LeaderboardSection({ storyId, playerName, playerScore }: LeaderboardSectionProps) {
  const [visible, setVisible] = useState(false)
  const [entries, setEntries] = useState<LeaderboardEntryData[] | null>(null)

  useEffect(() => {
    // Brief delay so the fire-and-forget score POST has time to land before we fetch
    const delayId = setTimeout(() => {
      fetchLeaderboard(storyId).then(data => {
        if (data) {
          setEntries(data)
          requestAnimationFrame(() => setVisible(true))
        }
      })
    }, 800)
    return () => clearTimeout(delayId)
  }, [storyId])

  if (!entries) return null

  return (
    <section
      aria-label="Classement des joueurs"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease',
        marginTop: '2rem',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.85rem',
          color: 'var(--color-text-muted)',
          marginBottom: '0.75rem',
        }}
      >
        Classement
      </div>
      <div role="list">
        {entries.map(entry => (
          <LeaderboardEntry
            key={entry.id}
            playerName={entry.playerName}
            score={entry.score}
            isCurrentPlayer={entry.playerName === playerName && entry.score === Math.round(playerScore)}
          />
        ))}
      </div>
    </section>
  )
}
