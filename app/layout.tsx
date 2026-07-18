import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { PwaRegister } from "@/components/pwa-register"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Eblon Mini Biblio LMF — Lycée Moderne Facobly",
  description:
    "Gestion des livres, élèves, prêts et retours de la mini-bibliothèque d'annales scolaires du Lycée Moderne Facobly, avec QR codes et statistiques.",
  generator: "Next.js",
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#2f6fed",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="light bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <PwaRegister />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
