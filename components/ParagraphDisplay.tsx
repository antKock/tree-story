'use client'

import { renderMarkdownLite } from './renderMarkdownLite'
import type { GaugeDefinition } from '@/engine/types'

interface ParagraphDisplayProps {
  content: string
  outcomeText?: string | null
  gaugeDeltas?: Record<string, number> | null
  gauges?: GaugeDefinition[]
}

export default function ParagraphDisplay({ content, outcomeText, gaugeDeltas, gauges }: ParagraphDisplayProps) {
  const paragraphs = content.split(/\n\n+/)
  const outcomeParagraphs = outcomeText ? outcomeText.split(/\n\n+/) : []

  const visibleDeltas = (gaugeDeltas && gauges)
    ? gauges.filter(g => (!g.isHidden || g.isScore) && gaugeDeltas[g.id] !== undefined && gaugeDeltas[g.id] !== 0)
    : []

  const hasResult = outcomeParagraphs.length > 0 || visibleDeltas.length > 0

  return (
    <div className="reading-column prose-text">
      {paragraphs.map((para, i) => (
        <p key={i} style={{ marginBottom: '1.25em', marginTop: 0 }}>
          {renderMarkdownLite(para.trim())}
        </p>
      ))}

      {hasResult && (
        <>
          {outcomeParagraphs.map((para, i) => (
            <p key={`outcome-${i}`} style={{ marginBottom: '1.25em', marginTop: 0 }}>
              {renderMarkdownLite(para.trim())}
            </p>
          ))}

          {visibleDeltas.length > 0 && gaugeDeltas && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '1.25em' }}>
              {visibleDeltas.map(g => {
                const delta = gaugeDeltas[g.id]
                return (
                  <span
                    key={g.id}
                    className="result-gauge-chip"
                    style={{
                      color: delta > 0 ? 'var(--color-accent)' : 'var(--color-danger)',
                      fontSize: '1.3rem',
                      fontWeight: 700,
                    }}
                  >
                    {g.icon} {delta > 0 ? '+' : ''}{Math.round(delta)}
                  </span>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
