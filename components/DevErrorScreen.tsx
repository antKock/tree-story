'use client'

// Developer-only error screen — never rendered in a valid production state.
// Displays story configuration errors caught at startup before any player UI loads.

interface DevErrorScreenProps {
  message: string
}

export default function DevErrorScreen({ message }: DevErrorScreenProps) {
  return (
    <div
      style={{
        background: 'var(--color-bg, #0f0f0f)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          maxWidth: '720px',
          width: '100%',
          border: '1px solid var(--color-danger, #c0392b)',
          borderRadius: '8px',
          padding: '2rem',
          background: 'var(--color-surface, #1a1a1a)',
        }}
      >
        <p
          style={{
            color: 'var(--color-text-muted, #7a7672)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            margin: '0 0 1.25rem 0',
          }}
        >
          Story Configuration Error — Developer Only
        </p>
        <pre
          style={{
            color: 'var(--color-danger, #c0392b)',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}
        >
          {message}
        </pre>
      </div>
    </div>
  )
}
