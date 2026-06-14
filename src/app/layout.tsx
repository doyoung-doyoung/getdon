import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '겟돈 — 계모임 관리',
  description: '계모임 날짜 선택 및 게임 관리',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
