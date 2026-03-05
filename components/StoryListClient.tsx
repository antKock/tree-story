'use client'

import { useEffect, useState } from 'react'
import StoryCard from './StoryCard'
import * as themeManager from '@/engine/themeManager'

interface StoryItem {
  id: string
  title: string
  description: string
  updatedAt: string
  playerCount: number
}

interface StoryListClientProps {
  stories: StoryItem[]
}

function getCompletedStories(stories: StoryItem[]): Set<string> {
  if (typeof globalThis.localStorage === 'undefined') return new Set()
  const completed = new Set<string>()
  for (const story of stories) {
    try {
      const key = `tree-story:save:${story.id}`
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        const es = parsed?.engineState
        if (es && (es.isComplete || es.isGameOver)) {
          completed.add(story.id)
        }
      }
    } catch {
      // Corrupt save — skip
    }
  }
  return completed
}

export default function StoryListClient({ stories }: StoryListClientProps) {
  const [completedStories, setCompletedStories] = useState<Set<string>>(new Set())

  useEffect(() => {
    setCompletedStories(getCompletedStories(stories))
    themeManager.restoreFromStorage()
  }, [stories])

  return (
    <section id="stories" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      {stories.map(story => (
        <StoryCard
          key={story.id}
          id={story.id}
          title={story.title}
          description={story.description}
          updatedAt={story.updatedAt}
          playerCount={story.playerCount}
          isCompleted={completedStories.has(story.id)}
        />
      ))}
    </section>
  )
}
