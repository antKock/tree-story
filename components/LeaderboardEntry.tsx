'use client'

interface LeaderboardEntryProps {
  playerName: string
  score: number
  isCurrentPlayer: boolean
}

export default function LeaderboardEntry({ playerName, score, isCurrentPlayer }: LeaderboardEntryProps) {
  return (
    <div
      role="listitem"
      aria-current={isCurrentPlayer ? 'true' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: isCurrentPlayer
          ? 'color-mix(in srgb, var(--color-accent) 10%, transparent)'
          : 'transparent',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '14px',
          color: isCurrentPlayer ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        }}
      >
        {playerName}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '14px',
          fontVariantNumeric: 'tabular-nums',
          color: isCurrentPlayer ? 'var(--color-accent)' : 'var(--color-text-muted)',
        }}
      >
        {score}
      </span>
    </div>
  )
}
