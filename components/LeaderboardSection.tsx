'use client'

import { useState, useEffect, useRef } from 'react'
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

export default function LeaderboardSection({ storyId, playerName, playerScore }: LeaderboardSectionProps) {
  const [entries, setEntries] = useState<LeaderboardEntryData[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [visible, setVisible] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    fetch(`/api/stories/${storyId}/leaderboard`, { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId)
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (data) {
          setEntries(data)
        } else {
          setFailed(true)
        }
      })
      .catch(() => setFailed(true))

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [storyId])

  // Trigger fade-in after the list mounts into the DOM
  useEffect(() => {
    if (entries && listRef.current) {
      requestAnimationFrame(() => setVisible(true))
    }
  }, [entries])

  const loading = !entries && !failed

  let currentPlayerFound = false

  return (
    <section
      aria-label="Classement des joueurs"
      aria-busy={loading}
      style={{
        flex: 1,
        minHeight: 0,
        margin: '0 1.5rem',
        background: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Card Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '0.85rem 1rem 0.6rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--color-text-muted)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        Ceux qui ont fini
      </div>

      {/* Loading */}
      {loading && (
        <div
          role="status"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              animation: 'ts-loading-pulse 1.5s ease-in-out infinite',
            }}
          >
            Chargement…
          </span>
        </div>
      )}

      {/* Error */}
      {failed && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
            }}
          >
            Classement indisponible
          </span>
        </div>
      )}

      {/* Entries list */}
      {entries && entries.length === 0 && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
            }}
          >
            Aucun joueur pour l'instant
          </span>
        </div>
      )}

      {entries && entries.length > 0 && (
        <div
          ref={listRef}
          role="list"
          style={{
            flex: 1,
            overflowY: 'auto',
            opacity: visible ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}
        >
          {entries.map((entry, index) => {
            const isCurrentPlayer = !currentPlayerFound
              && entry.playerName === playerName
              && entry.score === Math.round(playerScore)
            if (isCurrentPlayer) currentPlayerFound = true
            return (
              <LeaderboardEntry
                key={entry.id}
                rank={index + 1}
                playerName={entry.playerName}
                score={entry.score}
                isCurrentPlayer={isCurrentPlayer}
                isLast={index === entries.length - 1}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
