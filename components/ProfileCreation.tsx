'use client'

import { useState } from 'react'
import type { StoryConfig } from '@/engine/types'

interface ProfileCreationProps {
  config: StoryConfig
  onStart: (stats: Record<string, number>, playerName: string) => void
}

export default function ProfileCreation({ config, onStart }: ProfileCreationProps) {
  const [mode, setMode] = useState<'choose' | 'custom'>('choose')
  const [playerName, setPlayerName] = useState('')
  const [nameFocused, setNameFocused] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null)
  const [stats, setStats] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    for (const stat of config.stats) {
      initial[stat.id] = 0
    }
    return initial
  })

  const totalAllocated = Object.values(stats).reduce((sum, v) => sum + v, 0)
  const remaining = config.statPointBudget - totalAllocated

  function increment(statId: string, maxPerStat: number) {
    if (remaining <= 0) return
    if (stats[statId] >= maxPerStat) return
    setStats(prev => ({ ...prev, [statId]: prev[statId] + 1 }))
  }

  function decrement(statId: string) {
    if (stats[statId] <= 0) return
    setStats(prev => ({ ...prev, [statId]: prev[statId] - 1 }))
  }

  function sanitizeProfile(profileStats: Record<string, number>): Record<string, number> {
    const sanitized: Record<string, number> = {}
    for (const stat of config.stats) {
      const v = profileStats[stat.id]
      sanitized[stat.id] = typeof v === 'number' ? Math.max(0, Math.min(stat.maxPerStat, v)) : 0
    }
    return sanitized
  }

  function confirmSelection() {
    if (selectedProfile === null || nameEmpty) return
    if (selectedProfile < 0 || selectedProfile >= config.meta.exampleProfiles.length) return
    const profile = config.meta.exampleProfiles[selectedProfile]
    onStart(sanitizeProfile(profile.stats), playerName.trim())
  }

  function enterCustomMode() {
    setMode('custom')
  }

  const nameEmpty = playerName.trim() === ''
  const canStart = !nameEmpty && selectedProfile !== null

  const nameInputBlock = (
    <div style={{ marginBottom: '1.5rem' }}>
      <label
        htmlFor="player-name"
        style={{
          display: 'block',
          fontFamily: 'var(--font-ui)',
          color: 'var(--color-text-primary)',
          marginBottom: '0.5rem',
        }}
      >
        Comment tu t&apos;appelles ?
      </label>
      <input
        id="player-name"
        type="text"
        required
        autoComplete="given-name"
        placeholder="Ton prénom"
        maxLength={20}
        value={playerName}
        onChange={e => setPlayerName(e.target.value)}
        onFocus={() => setNameFocused(true)}
        onBlur={() => setNameFocused(false)}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: nameFocused
            ? '1px solid var(--color-accent)'
            : '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          fontFamily: 'var(--font-ui)',
          fontSize: '16px',
          color: 'var(--color-text-primary)',
          outline: 'none',
        }}
      />
    </div>
  )

  // --- Profile selection screen ---
  if (mode === 'choose') {
    return (
      <div className="reading-column" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        {nameInputBlock}

        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1.5rem',
            color: 'var(--color-text-muted)',
          }}
        >
          Choisis ton profil
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {config.meta.exampleProfiles.map((profile, index) => (
            <button
              key={profile.name}
              type="button"
              onClick={() => setSelectedProfile(index)}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '8px',
                border: selectedProfile === index
                  ? '1px solid var(--color-accent)'
                  : '1px solid rgba(255,255,255,0.08)',
                background: selectedProfile === index
                  ? 'color-mix(in srgb, var(--color-accent) 6%, transparent)'
                  : 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-ui)',
                fontSize: '1rem',
                cursor: 'pointer',
                textAlign: 'left' as const,
                transition: 'border-color 150ms ease, background 150ms ease',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{profile.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {profile.description}
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={enterCustomMode}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
              cursor: 'pointer',
              textAlign: 'left' as const,
            }}
          >
            Personnaliser les stats →
          </button>
        </div>

        <button
          type="button"
          onClick={confirmSelection}
          disabled={!canStart}
          style={{
            width: '100%',
            minHeight: '48px',
            marginTop: '1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: canStart ? 'var(--color-accent)' : 'var(--color-surface)',
            color: canStart ? 'var(--color-bg)' : 'var(--color-text-muted)',
            fontFamily: 'var(--font-ui)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: canStart ? 'pointer' : 'not-allowed',
            opacity: canStart ? 1 : 0.4,
            transition: 'background 150ms ease, opacity 150ms ease',
          }}
        >
          Commencer
        </button>
      </div>
    )
  }

  // --- Custom stat allocator ---
  return (
    <div className="reading-column" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <button
        type="button"
        onClick={() => setMode('choose')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          padding: 0,
          marginBottom: '1rem',
        }}
      >
        ← Retour aux profils
      </button>

      {nameInputBlock}

      <h2
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '1.1rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
          color: 'var(--color-text-primary)',
        }}
      >
        Répartis tes points
        <span
          style={{
            marginLeft: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 400,
            color: remaining === 0 ? 'var(--color-accent)' : 'var(--color-text-muted)',
          }}
        >
          {remaining} restant{remaining !== 1 ? 's' : ''}
        </span>
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {config.stats.map(stat => (
          <div
            key={stat.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-surface)',
              borderRadius: '8px',
              padding: '12px 16px',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}
              >
                {stat.name}
              </div>
              {stat.description && (
                <div
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    marginTop: '2px',
                  }}
                >
                  {stat.description}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => decrement(stat.id)}
                disabled={stats[stat.id] <= 0}
                aria-label={`Diminuer ${stat.name}`}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: stats[stat.id] <= 0 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  fontSize: '1.25rem',
                  cursor: stats[stat.id] <= 0 ? 'not-allowed' : 'pointer',
                  opacity: stats[stat.id] <= 0 ? 0.4 : 1,
                }}
              >
                −
              </button>

              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  width: '2ch',
                  textAlign: 'center',
                  color: 'var(--color-text-primary)',
                }}
              >
                {stats[stat.id]}
              </span>

              <button
                type="button"
                onClick={() => increment(stat.id, stat.maxPerStat)}
                disabled={remaining <= 0 || stats[stat.id] >= stat.maxPerStat}
                aria-label={`Augmenter ${stat.name}`}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color:
                    remaining <= 0 || stats[stat.id] >= stat.maxPerStat
                      ? 'var(--color-text-muted)'
                      : 'var(--color-text-primary)',
                  fontSize: '1.25rem',
                  cursor:
                    remaining <= 0 || stats[stat.id] >= stat.maxPerStat
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: remaining <= 0 || stats[stat.id] >= stat.maxPerStat ? 0.4 : 1,
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onStart(stats, playerName.trim())}
        disabled={remaining !== 0 || nameEmpty}
        style={{
          width: '100%',
          minHeight: '48px',
          borderRadius: '8px',
          border: 'none',
          background: remaining === 0 && !nameEmpty ? 'var(--color-accent)' : 'var(--color-surface)',
          color: remaining === 0 && !nameEmpty ? 'var(--color-bg)' : 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: remaining === 0 && !nameEmpty ? 'pointer' : 'not-allowed',
          opacity: remaining === 0 && !nameEmpty ? 1 : 0.4,
          transition: 'background 150ms ease, opacity 150ms ease',
        }}
      >
        Commencer l&apos;aventure
      </button>
    </div>
  )
}
