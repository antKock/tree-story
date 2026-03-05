import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('id, title, description, updated_at')
      .order('updated_at', { ascending: false })

    if (error) {
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }

    return Response.json(
      data.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        updatedAt: row.updated_at,
      }))
    )
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
