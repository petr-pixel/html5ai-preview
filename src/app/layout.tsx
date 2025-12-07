import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AdCreative Studio',
  description: 'Generátor reklamních kreativ pro Sklik a Google Ads',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
