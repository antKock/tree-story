'use client'

import type { StoryConfig, EngineState } from '@/engine/types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface CharacterSheetProps {
  open: boolean
  onClose: () => void
  engineState: EngineState
  config: StoryConfig
}

export default function CharacterSheet({ open, onClose, engineState, config }: CharacterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={val => { if (!val) onClose() }}>
      <SheetContent
        side="bottom"
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <SheetHeader>
          <SheetTitle style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-ui)' }}>
            Fiche personnage
          </SheetTitle>
        </SheetHeader>

        <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Gauges — ALL gauges including hidden ones */}
          <section>
            <h3 style={sectionHeaderStyle}>Jauges</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {config.gauges.map(gaugeDef => {
                const value = engineState.gauges[gaugeDef.id] ?? 0
                const maxValue = gaugeDef.maxValue ?? 100
                const pct = Math.max(0, Math.min(100, (value / maxValue) * 100))
                return (
                  <div key={gaugeDef.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', width: '24px', textAlign: 'center' }}>
                      {gaugeDef.icon}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '0.85rem',
                        color: 'var(--color-text-muted)',
                        width: '100px',
                        flexShrink: 0,
                      }}
                    >
                      {gaugeDef.name}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: '7px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
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
            </div>
          </section>

          {/* Stats */}
          {Object.keys(engineState.stats).length > 0 && (
            <section>
              <h3 style={sectionHeaderStyle}>Stats</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {config.stats.map(statDef => (
                  <div
                    key={statDef.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-muted)' }}>{statDef.name}</span>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {engineState.stats[statDef.id] ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Inventory */}
          <section>
            <h3 style={sectionHeaderStyle}>Inventaire</h3>
            {engineState.inventory.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Ton sac est vide pour l&apos;instant.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {engineState.inventory.map(item => (
                  <li
                    key={item}
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.9rem',
                      color: 'var(--color-text-primary)',
                      marginBottom: '4px',
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const sectionHeaderStyle: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.5rem',
}
