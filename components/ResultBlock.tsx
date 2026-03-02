'use client'

import { renderMarkdownLite } from './renderMarkdownLite'

interface ResultBlockProps {
  text: string | null
}

export default function ResultBlock({ text }: ResultBlockProps) {
  if (!text) return null

  const paragraphs = text.split(/\n\n+/)

  return (
    <div
      className="reading-column"
      style={{
        borderLeft: '3px solid var(--color-accent)',
        paddingLeft: '1rem',
        marginTop: '0.5rem',
        marginBottom: '1rem',
        background: 'var(--color-surface)',
        borderRadius: '0 4px 4px 0',
        padding: '0.75rem 1rem',
      }}
    >
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
    </div>
  )
}
