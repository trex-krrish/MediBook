import { isAxiosError } from 'axios'

export function extractErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined

    if (data?.errors) {
      const firstError = Object.values(data.errors)[0]?.[0]
      if (firstError) {
        return firstError
      }
    }

    if (data?.message) {
      return data.message
    }
  }

  return fallback
}
