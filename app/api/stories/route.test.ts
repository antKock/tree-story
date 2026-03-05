import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockOrder = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

mockFrom.mockReturnValue({ select: mockSelect })
mockSelect.mockReturnValue({ order: mockOrder })

import { GET } from './route'

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ order: mockOrder })
})

describe('GET /api/stories', () => {
  it('returns 200 with array of story metadata in camelCase', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { id: 'dub-camp', title: 'Dub Camp', description: 'A music story', updated_at: '2026-03-01T00:00:00Z' },
        { id: 'forest', title: 'Forest', description: 'A nature story', updated_at: '2026-02-28T00:00:00Z' },
      ],
      error: null,
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([
      { id: 'dub-camp', title: 'Dub Camp', description: 'A music story', updatedAt: '2026-03-01T00:00:00Z' },
      { id: 'forest', title: 'Forest', description: 'A nature story', updatedAt: '2026-02-28T00:00:00Z' },
    ])
    expect(mockFrom).toHaveBeenCalledWith('stories')
    expect(mockSelect).toHaveBeenCalledWith('id, title, description, updated_at')
  })

  it('returns 200 with empty array when no stories exist', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([])
  })

  it('returns 500 when Supabase query errors', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
  })

  it('returns 500 when an unexpected exception is thrown', async () => {
    mockOrder.mockRejectedValue(new Error('Connection failed'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'Internal server error' })
  })
})
