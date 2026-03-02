'use client'

import type { Choice } from '@/engine/types'

interface ChoiceCardsProps {
  choices: Choice[]
  onChoose: (choiceId: string) => void
}

export default function ChoiceCards({ choices, onChoose }: ChoiceCardsProps) {
  return (
    <div
      className="reading-column"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        paddingBottom: '2rem',
      }}
    >
      {choices.map(choice => (
        <button
          key={choice.id}
          type="button"
          onClick={() => onChoose(choice.id)}
          style={{
            width: '100%',
            minHeight: '48px',
            padding: '16px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-prose)',
            fontSize: '0.95rem',
            lineHeight: 1.4,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'border-color 150ms ease',
          }}
        >
          {choice.text}
        </button>
      ))}
    </div>
  )
}
