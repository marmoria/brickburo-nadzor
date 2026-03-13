import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Brick Buro · Авторский надзор',
  description: 'Журнал авторского сопровождения',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1C1C1C" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
