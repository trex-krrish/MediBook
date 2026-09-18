export function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-paper">
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-pine-700 border-t-transparent" aria-hidden="true" />
        <p className="font-display text-sm text-ink-soft">Loading MediBook…</p>
      </div>
    </div>
  )
}

export function InlineLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-10 text-sm text-ink-soft">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-pine-700 border-t-transparent" aria-hidden="true" />
      {label}
    </div>
  )
}
