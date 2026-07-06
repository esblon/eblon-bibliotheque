// Builds a CSV string from an array of records. Uses ";" separator (Excel FR
// friendly) and prepends a UTF-8 BOM so accents render correctly in Excel.
export function toCsv(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return ""
    let s: string
    if (val instanceof Date) {
      s = val.toLocaleString("fr-FR")
    } else {
      s = String(val)
    }
    if (s.includes(";") || s.includes('"') || s.includes("\n")) {
      s = `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const headerLine = headers.map((h) => escape(h.label)).join(";")
  const lines = rows.map((row) => headers.map((h) => escape(row[h.key])).join(";"))
  return "\uFEFF" + [headerLine, ...lines].join("\r\n")
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
