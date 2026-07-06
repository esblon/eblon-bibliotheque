import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: number | string
  icon: LucideIcon
  tone?: "default" | "primary" | "accent" | "warning" | "danger"
}) {
  const tones: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    warning: "bg-orange-100 text-orange-600",
    danger: "bg-destructive/10 text-destructive",
  }
  return (
    <Card className="flex items-center gap-4 p-4">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg",
          tones[tone],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-foreground">
          {value}
        </p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  )
}
