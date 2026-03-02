import { readFile } from 'fs/promises'
import path from 'path'
import DevErrorScreen from '@/components/DevErrorScreen'
import GameShell from '@/components/GameShell'
import { validateStoryConfig } from '@/engine/storyValidator'
import { StoryValidationError } from '@/engine/types'

export default async function Home() {
  let storyConfig
  try {
    const filePath = path.join(process.cwd(), 'public/stories/dub-camp.json')
    const raw = await readFile(filePath, 'utf-8')
    const data: unknown = JSON.parse(raw)
    storyConfig = validateStoryConfig(data)
  } catch (e) {
    if (e instanceof StoryValidationError) {
      return <DevErrorScreen error={e} />
    }
    if (e instanceof SyntaxError) {
      return <DevErrorScreen error={new Error(`Story JSON parse error: ${e.message}`)} />
    }
    // ENOENT — story JSON not yet created (expected during early development)
    const isFileNotFound = e instanceof Error && 'code' in e && (e as NodeJS.ErrnoException).code === 'ENOENT'
    if (!isFileNotFound) {
      return <DevErrorScreen error={e instanceof Error ? e : new Error(String(e))} />
    }
  }

  if (!storyConfig) {
    return (
      <div className="reading-column" style={{ paddingTop: '3rem' }}>
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-ui)' }}>
          No story loaded. Place a story JSON file at <code>public/stories/dub-camp.json</code>.
        </p>
      </div>
    )
  }

  return <GameShell config={storyConfig} />
}
