import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Anagram Finder',
  description: 'Find anagrams for your phrases',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
