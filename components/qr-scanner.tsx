"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff } from "lucide-react"

export function QrScanner({ onScan }: { onScan: (text: string) => void }) {
  const containerId = "qr-scanner-region"
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      const s = scannerRef.current
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {})
      }
    }
  }, [])

  async function start() {
    setError(null)
    // The video region must be visible and laid out BEFORE starting the camera.
    // On iOS Safari, html5-qrcode cannot attach the stream to a hidden /
    // zero-size container, which shows an authorized-but-blank camera.
    setActive(true)
    // Wait two animation frames so the container has real dimensions.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
    )
    try {
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(
              Math.min(viewfinderWidth, viewfinderHeight) * 0.8,
            )
            return { width: size, height: size }
          },
        },
        (decoded) => {
          onScan(decoded.trim())
          stop()
        },
        () => {},
      )
    } catch (err) {
      setActive(false)
      setError(
        "Impossible d'accéder à la caméra. Vérifiez les autorisations ou saisissez le code manuellement.",
      )
      console.log("[v0] QR scanner error:", err)
    }
  }

  async function stop() {
    const s = scannerRef.current
    if (s) {
      try {
        await s.stop()
        await s.clear()
      } catch {
        // ignore
      }
    }
    setActive(false)
  }

  return (
    <div className="grid gap-3">
      <div
        id={containerId}
        className="aspect-square w-full max-w-xs overflow-hidden rounded-lg border bg-muted mx-auto"
        style={{ display: active ? "block" : "none" }}
      />
      {!active ? (
        <Button type="button" variant="outline" onClick={start} size="lg">
          <Camera className="mr-2 size-4" />
          Scanner un QR code
        </Button>
      ) : (
        <Button type="button" variant="outline" onClick={stop} size="lg">
          <CameraOff className="mr-2 size-4" />
          Arrêter la caméra
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
