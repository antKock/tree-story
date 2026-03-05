import { supabase } from '@/lib/supabase'

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
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  const authHeader = request.headers.get('Authorization')
  if (authHeader !== `Bearer ${serviceRoleKey}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()

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
