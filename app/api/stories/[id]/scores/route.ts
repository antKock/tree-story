import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>

    // Validate score is a finite number
    if (typeof payload.score !== 'number' || !Number.isFinite(payload.score)) {
      return Response.json({ error: 'score must be a finite number' }, { status: 400 })
    }

    // Validate isGameOver is boolean if provided
    if (payload.isGameOver !== undefined && typeof payload.isGameOver !== 'boolean') {
      return Response.json({ error: 'isGameOver must be a boolean' }, { status: 400 })
    }

    // Sanitize player name
    const playerName = (typeof payload.playerName === 'string' ? payload.playerName : '').trim().slice(0, 20)

    // Verify story exists
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id')
      .eq('id', id)
      .single()

    if (storyError || !story) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    // Insert score
    const { data, error } = await supabase
      .from('scores')
      .insert({
        story_id: id,
        player_name: playerName,
        score: payload.score as number,
        is_game_over: (payload.isGameOver as boolean) ?? false,
      })
      .select()
      .single()

    if (error || !data) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Transform to camelCase
    return Response.json({
      id: data.id,
      storyId: data.story_id,
      playerName: data.player_name,
      score: data.score,
      isGameOver: data.is_game_over,
      createdAt: data.created_at,
    }, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
