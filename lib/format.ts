export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const da = typeof a === "string" ? new Date(a) : a
  const db = typeof b === "string" ? new Date(b) : b
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24))
}

// Builds a wa.me URL. Assumes Côte d'Ivoire (+225) if no country code given.
export function whatsappUrl(phone: string, message: string): string {
  let digits = phone.replace(/[^\d]/g, "")
  if (!digits.startsWith("225") && digits.length <= 10) {
    digits = "225" + digits
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
