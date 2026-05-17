export function isMissingSupabaseTableError(error: unknown, tableName: string): boolean {
  if (!error || typeof error !== 'object') return false

  const candidate = error as { code?: string; message?: string; details?: string; hint?: string }
  const haystack = [candidate.code, candidate.message, candidate.details, candidate.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return (
    haystack.includes(tableName.toLowerCase()) &&
    (haystack.includes('schema cache') || haystack.includes('could not find the table'))
  )
}

export function missingAuthSessionsMessage(): string {
  return 'Supabase schema is missing public.auth_sessions. Run supabase/migrations/20260518_create_auth_sessions.sql in the Supabase SQL Editor, then retry.'
}
