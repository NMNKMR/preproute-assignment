const rawBase = import.meta.env.VITE_API_BASE_URL

if (!rawBase) {
  // Surface misconfiguration early and loudly rather than failing on first request.
  console.error('VITE_API_BASE_URL is not set. Copy .env.example to .env.')
}

// Normalise away any trailing slash so `${API_BASE_URL}/tests` is always correct.
export const API_BASE_URL = (rawBase ?? '').replace(/\/+$/, '')
