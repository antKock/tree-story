'use client'

import type { StoryConfig } from '@/engine/types'

interface GaugeStripProps {
  gauges: Record<string, number>
  config: StoryConfig
  onOpenCharacterSheet: () => void
  gaugeDeltas?: Record<string, number> | null
  animKey?: number
}

export default function GaugeStrip({ gauges, config, onOpenCharacterSheet, gaugeDeltas, animKey }: GaugeStripProps) {
  const visibleGauges = config.gauges.filter(g => !g.isHidden)

  return (
    <button
      type="button"
      onClick={onOpenCharacterSheet}
      aria-label="Ouvrir la fiche personnage"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        width: '100%',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '6px 16px',
        background: 'var(--color-bg)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        border: 'none',
        borderBlockEnd: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
      }}
    >
      {visibleGauges.map(gaugeDef => {
        const value = gauges[gaugeDef.id] ?? 0
        const delta = gaugeDeltas ? (gaugeDeltas[gaugeDef.id] ?? 0) : 0
        const showPill = gaugeDeltas !== null && gaugeDeltas !== undefined && delta !== 0

        return (
          <div
            key={gaugeDef.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              flex: 1,
              maxWidth: '80px',
              position: 'relative',
            }}
          >
            {showPill && (
              <span
                key={animKey}
                className="gauge-delta-pill"
                style={{
                  color: delta > 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                }}
              >
                {delta > 0 ? '+' : ''}{Math.round(delta)}
              </span>
            )}
            <span style={{ fontSize: '17px', lineHeight: 1 }}>{gaugeDef.icon}</span>
            <div
              style={{
                width: '100%',
                height: '7px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, value))}%`,
                  height: '100%',
                  borderRadius: '4px',
                  background: 'var(--color-accent)',
                  transition: 'width 150ms ease',
                }}
              />
            </div>
          </div>
        )
      })}
    </button>
  )
}
