'use client'

interface LeaderboardEntryProps {
  rank: number
  playerName: string
  score: number
  isCurrentPlayer: boolean
  isLast: boolean
}

export default function LeaderboardEntry({ rank, playerName, score, isCurrentPlayer, isLast }: LeaderboardEntryProps) {
  return (
    <div
      role="listitem"
      aria-current={isCurrentPlayer ? 'true' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.7rem 1rem',
        borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
        background: isCurrentPlayer
          ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)'
          : 'transparent',
      }}
    >
      <span
        style={{
          width: '24px',
          fontFamily: 'var(--font-ui)',
          fontSize: '12px',
          fontVariantNumeric: 'tabular-nums',
          color: isCurrentPlayer ? 'var(--color-accent)' : 'var(--color-text-muted)',
        }}
      >
        {rank}
      </span>
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--font-ui)',
          fontSize: '14px',
          color: isCurrentPlayer ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          fontWeight: isCurrentPlayer ? 600 : 400,
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
          fontWeight: isCurrentPlayer ? 600 : 400,
        }}
      >
        {Math.round(score)}
      </span>
    </div>
  )
}
