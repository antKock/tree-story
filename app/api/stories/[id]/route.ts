import { supabase } from '@/lib/supabase'

function authenticateAdmin(request: Request): Response | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
  if (request.headers.get('Authorization') !== `Bearer ${serviceRoleKey}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('stories')
      .select('data')
      .eq('id', id)
      .single()

    if (error) {
      const status = error.code === 'PGRST116' ? 404 : 500
      const message = status === 404 ? 'Story not found' : 'Internal server error'
      return Response.json({ error: message }, { status })
    }

    if (!data) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    return Response.json(data.data)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateAdmin(request)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()

    if (body?.id && body.id !== id) {
      return Response.json(
        { error: `URL id "${id}" does not match JSON id "${body.id}"` },
        { status: 400 }
      )
    }

    const title = body?.meta?.title ?? id
    const description = body?.meta?.description ?? ''
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('stories')
      .upsert({
        id,
        title,
        description,
        data: body,
        updated_at: now,
      })

    if (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    return Response.json(
      { id, title, description, updatedAt: now },
      { status: 201 }
    )
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateAdmin(request)
  if (authError) return authError

  try {
    const { id } = await params

    // Check story exists
    const { data: existing } = await supabase
      .from('stories')
      .select('id')
      .eq('id', id)
      .single()

    if (!existing) {
      return Response.json({ error: 'Story not found' }, { status: 404 })
    }

    // Delete scores first (FK constraint)
    const { error: scoresError } = await supabase
      .from('scores')
      .delete()
      .eq('story_id', id)

    if (scoresError) {
      return Response.json({ error: 'Failed to delete scores' }, { status: 500 })
    }

    const { error: storyError } = await supabase
      .from('stories')
      .delete()
      .eq('id', id)

    if (storyError) {
      return Response.json({ error: 'Failed to delete story' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
