'use client'

import type { StoryConfig } from '@/engine/types'

interface GaugeStripProps {
  gauges: Record<string, number>
  config: StoryConfig
  onOpenCharacterSheet: () => void
}

export default function GaugeStrip({ gauges, config, onOpenCharacterSheet }: GaugeStripProps) {
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
        minHeight: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '6px 16px',
        background: 'var(--color-gauge-bg)',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer',
      }}
    >
      {visibleGauges.map(gaugeDef => {
        const value = gauges[gaugeDef.id] ?? 0

        return (
          <div
            key={gaugeDef.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              flex: 1,
              maxWidth: '80px',
            }}
          >
            <span style={{ fontSize: '17px', lineHeight: 1 }}>{gaugeDef.icon}</span>
            <div
              style={{
                width: '100%',
                height: '10px',
                borderRadius: '5px',
                background: 'var(--color-gauge-track)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, value))}%`,
                  height: '100%',
                  borderRadius: '5px',
                  background: 'var(--color-gauge-bar)',
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
