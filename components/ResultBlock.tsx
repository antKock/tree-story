'use client'

import { renderMarkdownLite } from './renderMarkdownLite'
import type { GaugeDefinition } from '@/engine/types'

interface ResultBlockProps {
  text: string | null
  gaugeDeltas?: Record<string, number> | null
  gauges?: GaugeDefinition[]
}

export default function ResultBlock({ text, gaugeDeltas, gauges }: ResultBlockProps) {
  const visibleDeltas = (gaugeDeltas && gauges)
    ? gauges.filter(g => !g.isHidden && gaugeDeltas[g.id] !== undefined && gaugeDeltas[g.id] !== 0)
    : []

  if (!text && visibleDeltas.length === 0) return null

  const paragraphs = text ? text.split(/\n\n+/) : []

  return (
    <div
      className="reading-column"
      style={{
        borderLeft: '3px solid var(--color-accent)',
        marginTop: '0.5rem',
        marginBottom: '1rem',
        background: 'var(--color-surface)',
        borderRadius: '0 4px 4px 0',
        padding: '0.75rem 1rem',
      }}
    >
      {text && (
        <p
          style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-accent)',
            margin: '0 0 0.5rem 0',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Résultat
        </p>
      )}
      {paragraphs.map((para, i) => (
        <p
          key={i}
          className="prose-text"
          style={{
            marginBottom: i < paragraphs.length - 1 ? '1em' : 0,
            marginTop: 0,
            fontSize: '1.05rem',
          }}
        >
          {renderMarkdownLite(para.trim())}
        </p>
      ))}
      {visibleDeltas.length > 0 && gaugeDeltas && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: text ? '0.75rem' : 0 }}>
          {visibleDeltas.map(g => {
            const delta = gaugeDeltas[g.id]
            return (
              <span
                key={g.id}
                className="result-gauge-chip"
                style={{ color: delta > 0 ? 'var(--color-accent)' : 'var(--color-danger)' }}
              >
                {g.icon} {delta > 0 ? '+' : ''}{Math.round(delta)}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
