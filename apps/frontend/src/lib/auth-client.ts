'use client'

import { apiClient } from './api'

export async function loginAndStore(email: string, password: string) {
  const tokens = await apiClient.login(email, password)
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens))
  }
  return tokens
}

export function logoutAndClear() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_tokens')
  }
}

export function getAuthTokens() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('auth_tokens')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
