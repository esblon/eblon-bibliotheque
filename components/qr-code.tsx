"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

export function useQrDataUrl(value: string, size = 200) {
  const [url, setUrl] = useState<string>("")
  useEffect(() => {
    let active = true
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((u) => {
        if (active) setUrl(u)
      })
      .catch(() => {
        if (active) setUrl("")
      })
    return () => {
      active = false
    }
  }, [value, size])
  return url
}

export function QrCode({
  value,
  size = 200,
  className,
}: {
  value: string
  size?: number
  className?: string
}) {
  const url = useQrDataUrl(value, size)
  if (!url) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url || "/placeholder.svg"}
      alt={`QR code ${value}`}
      width={size}
      height={size}
      className={className}
    />
  )
}
