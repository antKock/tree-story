import { supabase } from '@/lib/supabase'
import LandingHero from '@/components/LandingHero'
import StoryListClient from '@/components/StoryListClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Tree Story — Des histoires dont tu choisis la suite',
  description: 'Des histoires interactives où chaque choix compte.',
  openGraph: {
    title: 'Tree Story',
    description: 'Des histoires interactives où chaque choix compte.',
  },
}

interface StoryListItem {
  id: string
  title: string
  description: string
  updatedAt: string
  playerCount: number
}

export default async function LandingPage() {
  let stories: StoryListItem[] = []

  try {
    const { data: storyData, error: storyError } = await supabase
      .from('stories')
      .select('id, title, description, updated_at')
      .order('updated_at', { ascending: false })

    if (!storyError && storyData) {
      // Fetch player counts per story using head-only count queries
      const counts: Record<string, number> = {}
      await Promise.all(storyData.map(async (s) => {
        const { count } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true })
          .eq('story_id', s.id)
        counts[s.id] = count ?? 0
      }))

      stories = storyData.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        updatedAt: row.updated_at,
        playerCount: counts[row.id] || 0,
      }))
    }
  } catch {
    // Supabase failure — stories stays empty, fallback rendered
  }

  if (stories.length === 0) {
    return (
      <div className="reading-column" style={{ paddingTop: '3rem' }}>
        <LandingHero />
        <p style={{
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-ui)',
          textAlign: 'center',
          marginTop: '3rem',
        }}>
          Aucune histoire disponible pour le moment.
        </p>
      </div>
    )
  }

  return (
    <div className="reading-column">
      <LandingHero />
      <StoryListClient stories={stories} />
    </div>
  )
}
