import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', id)
      .single()

    if (storyError || !story) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    // Fetch scores sorted by score descending
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('story_id', id)
      .order('score', { ascending: false })
      .limit(100)

    if (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Transform to camelCase
    const entries = (data ?? []).map(row => ({
      id: row.id,
      storyId: row.story_id,
      playerName: row.player_name,
      score: row.score,
      isGameOver: row.is_game_over,
      createdAt: row.created_at,
    }))

    return Response.json(entries)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
