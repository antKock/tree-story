import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpsert = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

import { GET, POST } from './route'

const SERVICE_ROLE_KEY = 'test-service-role-key'

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_ROLE_KEY)

  // Default chain for GET: from().select().eq().single()
  mockFrom.mockReturnValue({ select: mockSelect, upsert: mockUpsert })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ single: mockSingle })
})

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/stories/[id]', () => {
  it('returns 200 with full story data from data column', async () => {
    const storyData = { meta: { title: 'Dub Camp' }, paragraphs: [] }
    mockSingle.mockResolvedValue({ data: { data: storyData }, error: null })

    const request = new Request('http://localhost/api/stories/dub-camp')
    const response = await GET(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(storyData)
    expect(mockFrom).toHaveBeenCalledWith('stories')
    expect(mockSelect).toHaveBeenCalledWith('data')
    expect(mockEq).toHaveBeenCalledWith('id', 'dub-camp')
  })

  it('returns 404 when story does not exist', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

    const request = new Request('http://localhost/api/stories/nonexistent')
    const response = await GET(request, makeParams('nonexistent'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({ error: 'Story not found' })
  })

  it('returns 500 when Supabase returns a non-PGRST116 error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST000', message: 'connection refused' } })

    const request = new Request('http://localhost/api/stories/dub-camp')
    const response = await GET(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
  })

  it('returns 500 on unexpected exception', async () => {
    mockSingle.mockRejectedValue(new Error('Connection failed'))

    const request = new Request('http://localhost/api/stories/dub-camp')
    const response = await GET(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
  })
})

describe('POST /api/stories/[id]', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const request = new Request('http://localhost/api/stories/dub-camp', {
      method: 'POST',
      body: JSON.stringify({ meta: { title: 'Test' } }),
    })
    const response = await POST(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: 'Unauthorized' })
    // No Supabase call should be made
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header is invalid', async () => {
    const request = new Request('http://localhost/api/stories/dub-camp', {
      method: 'POST',
      headers: { Authorization: 'Bearer wrong-key' },
      body: JSON.stringify({ meta: { title: 'Test' } }),
    })
    const response = await POST(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({ error: 'Unauthorized' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns 201 with metadata on successful upsert', async () => {
    mockUpsert.mockResolvedValue({ error: null })

    const storyBody = { meta: { title: 'Dub Camp', description: 'A music festival story' }, paragraphs: [] }
    const request = new Request('http://localhost/api/stories/dub-camp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify(storyBody),
    })
    const response = await POST(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.id).toBe('dub-camp')
    expect(body.title).toBe('Dub Camp')
    expect(body.description).toBe('A music festival story')
    expect(body.updatedAt).toBeDefined()
    expect(mockFrom).toHaveBeenCalledWith('stories')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'dub-camp',
        title: 'Dub Camp',
        description: 'A music festival story',
        data: storyBody,
      })
    )
  })

  it('falls back to id for title and empty string for description when meta is missing', async () => {
    mockUpsert.mockResolvedValue({ error: null })

    const storyBody = { paragraphs: [] }
    const request = new Request('http://localhost/api/stories/my-story', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify(storyBody),
    })
    const response = await POST(request, makeParams('my-story'))
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.title).toBe('my-story')
    expect(body.description).toBe('')
  })

  it('returns 500 when Supabase upsert fails', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } })

    const request = new Request('http://localhost/api/stories/dub-camp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ meta: { title: 'Test' } }),
    })
    const response = await POST(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
  })

  it('returns 500 on unexpected exception', async () => {
    mockUpsert.mockRejectedValue(new Error('Connection failed'))

    const request = new Request('http://localhost/api/stories/dub-camp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ meta: { title: 'Test' } }),
    })
    const response = await POST(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
  })

  it('returns 500 when SUPABASE_SERVICE_ROLE_KEY env var is not set', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    const request = new Request('http://localhost/api/stories/dub-camp', {
      method: 'POST',
      headers: { Authorization: 'Bearer undefined' },
      body: JSON.stringify({ meta: { title: 'Test' } }),
    })
    const response = await POST(request, makeParams('dub-camp'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
    expect(mockFrom).not.toHaveBeenCalled()
  })

  it('returns consistent updatedAt matching the stored updated_at', async () => {
    mockUpsert.mockResolvedValue({ error: null })

    const request = new Request('http://localhost/api/stories/dub-camp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ meta: { title: 'Test' } }),
    })
    const response = await POST(request, makeParams('dub-camp'))
    const body = await response.json()

    const upsertArg = mockUpsert.mock.calls[0][0]
    expect(body.updatedAt).toBe(upsertArg.updated_at)
  })
})
