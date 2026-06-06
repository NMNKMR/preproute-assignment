import { describe, expect, it } from 'vitest'
import type { AxiosResponse } from 'axios'
import { ApiError, unwrap } from '@/api/client'
import type { ApiEnvelope } from '@/api/types'

function fakeResponse<T>(body: ApiEnvelope<T>): AxiosResponse<ApiEnvelope<T>> {
  return { data: body, status: 200 } as AxiosResponse<ApiEnvelope<T>>
}

describe('unwrap', () => {
  it('returns the data payload on success', async () => {
    const result = await unwrap(
      Promise.resolve(
        fakeResponse({ status: 'success', message: 'ok', data: { id: 7 } }),
      ),
    )
    expect(result).toEqual({ id: 7 })
  })

  it('throws ApiError with the server message on status:error', async () => {
    await expect(
      unwrap(
        Promise.resolve(
          fakeResponse({ status: 'error', message: 'Nope', data: null }),
        ),
      ),
    ).rejects.toMatchObject({ name: 'ApiError', message: 'Nope' })
  })

  it('throws ApiError instances', async () => {
    const promise = unwrap(
      Promise.resolve(
        fakeResponse({ status: 'error', message: 'Bad', data: null }),
      ),
    )
    await expect(promise).rejects.toBeInstanceOf(ApiError)
  })
})
