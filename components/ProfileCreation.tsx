'use client'

import { useState } from 'react'
import type { StoryConfig } from '@/engine/types'

interface ProfileCreationProps {
  config: StoryConfig
  onStart: (stats: Record<string, number>) => void
}

export default function ProfileCreation({ config, onStart }: ProfileCreationProps) {
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

  function applyProfile(profileStats: Record<string, number>) {
    // Only copy stat IDs that exist in the config, and clamp each value to [0, maxPerStat].
    // This guards against example profiles with unknown stat IDs or totals that don't match the budget.
    const sanitized: Record<string, number> = {}
    for (const stat of config.stats) {
      const v = profileStats[stat.id]
      sanitized[stat.id] = typeof v === 'number' ? Math.max(0, Math.min(stat.maxPerStat, v)) : 0
    }
    setStats(sanitized)
  }

  return (
    <div className="reading-column" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <h1
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: 'var(--color-text-primary)',
        }}
      >
        {config.meta.title}
      </h1>
      {config.meta.description && (
        <p
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.95rem',
            color: 'var(--color-text-muted)',
            marginBottom: '2rem',
            lineHeight: 1.5,
          }}
        >
          {config.meta.description}
        </p>
      )}

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

      {config.meta.exampleProfiles.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.75rem',
            }}
          >
            Profils suggérés
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {config.meta.exampleProfiles.map(profile => (
              <button
                key={profile.name}
                type="button"
                onClick={() => applyProfile(profile.stats)}
                style={{
                  minHeight: '44px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 500 }}>{profile.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {profile.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onStart(stats)}
        disabled={remaining !== 0}
        style={{
          width: '100%',
          minHeight: '48px',
          borderRadius: '8px',
          border: 'none',
          background: remaining === 0 ? 'var(--color-accent)' : 'var(--color-surface)',
          color: remaining === 0 ? 'var(--color-bg)' : 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: remaining === 0 ? 'pointer' : 'not-allowed',
          opacity: remaining === 0 ? 1 : 0.5,
          transition: 'background 150ms ease, opacity 150ms ease',
        }}
      >
        Commencer l&apos;aventure
      </button>
    </div>
  )
}
