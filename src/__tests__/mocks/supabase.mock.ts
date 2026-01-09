import { vi } from 'vitest'

export const mockSupabaseClient = {
  from: vi.fn(),
}

export const mockSupabaseFrom = (tableName: string, data: unknown[] | null, error: Error | null = null) => {
  return {
    select: vi.fn().mockResolvedValue({ data, error }),
  }
}

export const createMockSupabase = (responses: Record<string, { data: unknown[] | null; error: Error | null }>) => {
  return {
    from: vi.fn((tableName: string) => ({
      select: vi.fn().mockResolvedValue(responses[tableName] || { data: null, error: new Error(`No mock for ${tableName}`) }),
    })),
  }
}
