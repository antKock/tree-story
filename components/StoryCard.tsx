import Link from 'next/link'

interface StoryCardProps {
  id: string
  title: string
  description: string
  updatedAt: string
  playerCount: number
  isCompleted: boolean
}

function formatPlayerCount(count: number): string {
  if (count === 0) return ''
  if (count < 10) return 'Quelques joueurs'
  if (count <= 30) return 'Une dizaine de joueurs'
  return 'Des dizaines de joueurs'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function StoryCard({ id, title, description, updatedAt, playerCount, isCompleted }: StoryCardProps) {
  const playerCountText = formatPlayerCount(playerCount)
  const ariaLabel = isCompleted ? `${title} — Histoire terminée` : title

  return (
    <Link
      href={`/${id}`}
      aria-label={ariaLabel}
      style={{
        display: 'block',
        position: 'relative',
        padding: '1.25rem',
        background: 'var(--color-surface)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        textDecoration: 'none',
        marginBottom: '1rem',
      }}
    >
      {isCompleted && (
        <span
          aria-label="Histoire terminée"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-ui)',
            color: 'var(--color-text-muted)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          Terminé
        </span>
      )}

      <h2 style={{
        fontFamily: 'var(--font-prose)',
        fontSize: '1.2rem',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        marginBottom: '0.5rem',
      }}>
        {title}
      </h2>

      <p style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '0.9rem',
        color: 'var(--color-text-muted)',
        lineHeight: 1.5,
        marginBottom: '0.75rem',
      }}>
        {description}
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
      }}>
        {playerCountText && <span>{playerCountText}</span>}
        <span style={{ marginLeft: 'auto' }}>{formatDate(updatedAt)}</span>
      </div>
    </Link>
  )
}
