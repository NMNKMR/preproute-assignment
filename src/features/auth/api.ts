import { api, unwrap } from '@/api/client'
import type { LoginResponse } from '@/api/types'

export function loginRequest(userId: string, password: string) {
  return unwrap<LoginResponse>(
    api.post('/auth/login', { userId, password }),
  )
}
