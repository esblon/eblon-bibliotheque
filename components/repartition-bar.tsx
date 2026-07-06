export function RepartitionBar({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((sum, [, v]) => sum + v, 0)

  if (total === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Aucune donnée disponible.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {entries.map(([label, value]) => {
        const pct = Math.round((value / total) * 100)
        return (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{label}</span>
              <span className="text-muted-foreground">
                {value} ({pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
