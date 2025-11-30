import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Quota | Divide Gastos",
  description: "Divide gastos con amigos y familia de forma sencilla",
  generator: 'v0.app',
  icons: {
    icon: '/Favicon.png',
    apple: '/Favicon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Quota',
  },
  openGraph: {
    title: 'Quota | Divide Gastos',
    description: 'Divide gastos con amigos y familia de forma sencilla. Gestiona grupos, monedas y pagos.',
    url: 'https://quota.app',
    siteName: 'Quota',
    images: [
      {
        url: '/Favicon.png',
        width: 512,
        height: 512,
        alt: 'Quota - Divide Gastos',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Quota | Divide Gastos',
    description: 'Divide gastos con amigos y familia de forma sencilla',
    images: ['/Favicon.png'],
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { Providers } from "@/components/providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
