export default function LandingHero() {
  return (
    <section style={{ paddingTop: '4rem', paddingBottom: '3rem', textAlign: 'center' }}>
      <h1 style={{
        fontFamily: 'var(--font-prose)',
        fontSize: '1.75rem',
        fontWeight: 700,
        color: 'var(--color-text-primary)',
        lineHeight: 1.3,
        marginBottom: '1rem',
      }}>
        Des histoires dont tu choisis la suite
      </h1>
      <p style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '1rem',
        color: 'var(--color-text-muted)',
        marginBottom: '2rem',
      }}>
        Chaque choix compte. Chaque partie est différente.
      </p>
      <a
        href="#stories"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: 'var(--color-accent)',
          color: 'var(--color-bg)',
          borderRadius: '8px',
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Découvrir les histoires ↓
      </a>
    </section>
  )
}
