import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import { validateStoryConfig } from '@/engine/storyValidator'
import { StoryValidationError } from '@/engine/types'
import DevErrorScreen from '@/components/DevErrorScreen'
import GameShell from '@/components/GameShell'
import type { Metadata } from 'next'
import type { StoryConfig } from '@/engine/types'

interface PageProps {
  params: Promise<{ storyId: string }>
}

const getStoryRow = cache(async (storyId: string) => {
  return supabase
    .from('stories')
    .select('title, description, data')
    .eq('id', storyId)
    .single()
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { storyId } = await params

  try {
    const { data } = await getStoryRow(storyId)

    if (!data) return { title: 'Tree Story' }

    return {
      title: data.title,
      description: data.description,
      openGraph: {
        title: data.title,
        description: data.description,
      },
    }
  } catch {
    return { title: 'Tree Story' }
  }
}

async function fetchStory(storyId: string): Promise<
  | { kind: 'ok'; config: StoryConfig }
  | { kind: 'not-found' }
  | { kind: 'validation-error'; error: StoryValidationError }
  | { kind: 'error' }
> {
  try {
    const { data, error } = await getStoryRow(storyId)

    if (error) {
      return error.code === 'PGRST116' ? { kind: 'not-found' } : { kind: 'error' }
    }
    if (!data) return { kind: 'not-found' }

    const config = validateStoryConfig(data.data)
    return { kind: 'ok', config }
  } catch (e) {
    if (e instanceof StoryValidationError) return { kind: 'validation-error', error: e }
    return { kind: 'error' }
  }
}

export default async function StoryPage({ params }: PageProps) {
  const { storyId } = await params
  const result = await fetchStory(storyId)

  if (result.kind === 'ok') {
    return <GameShell config={result.config} />
  }

  if (result.kind === 'validation-error') {
    return <DevErrorScreen error={result.error} />
  }

  const message = result.kind === 'not-found'
    ? "Cette histoire n\u2019existe pas."
    : 'Impossible de charger cette histoire.'

  return (
    <div className="reading-column" style={{ paddingTop: '3rem' }}>
      <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-ui)' }}>
        {message}
      </p>
    </div>
  )
}
