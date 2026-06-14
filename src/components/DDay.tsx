'use client'

import { DB } from '@/lib/db'

interface Props { dateStr: string | null }

export function DdayBadge({ dateStr }: Props) {
  const diff = DB.calcDday(dateStr)
  if (diff === null) return null

  const label = diff === 0 ? 'D-day' : diff < 0 ? `D+${Math.abs(diff)}` : `D-${diff}`

  const style: Record<string, { bg: string; color: string }> = {
    today:  { bg: 'rgba(76,175,80,.22)',   color: '#4caf50' },
    past:   { bg: 'rgba(180,180,180,.15)', color: 'rgba(253,248,239,.3)' },
    urgent: { bg: 'rgba(244,67,54,.22)',   color: '#ff6b6b' },
    soon:   { bg: 'rgba(255,152,0,.22)',   color: '#ffb347' },
    normal: { bg: 'rgba(74,158,255,.18)',  color: '#4a9eff' },
  }
  const key = diff === 0 ? 'today' : diff < 0 ? 'past' : diff <= 3 ? 'urgent' : diff <= 7 ? 'soon' : 'normal'
  const { bg, color } = style[key]

  return (
    <span style={{
      display: 'inline-block', fontSize: '12px', fontWeight: 700,
      padding: '3px 10px', borderRadius: '20px', background: bg, color,
      letterSpacing: '.3px', lineHeight: 1.4, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export function DdayText({ dateStr }: Props) {
  const diff = DB.calcDday(dateStr)
  if (diff === null) return null
  if (diff === 0) return <span style={{ color: '#4caf50', fontWeight: 700 }}>오늘 모임이에요! 🎉</span>
  if (diff < 0) return <span style={{ color: 'rgba(253,248,239,.35)', fontSize: '13px' }}>모임이 {Math.abs(diff)}일 전에 있었어요</span>
  const col = diff <= 3 ? '#ff6b6b' : diff <= 7 ? '#ffb347' : '#4a9eff'
  return (
    <span style={{ fontSize: '13px' }}>
      모임까지 <strong style={{ color: col }}>{diff}일</strong> 남았어요
    </span>
  )
}

export function DdayBar({ dateStr }: Props) {
  const diff = DB.calcDday(dateStr)
  if (diff === null || diff < 0) return null
  const pct = Math.max(4, Math.round(((30 - Math.min(diff, 30)) / 30) * 100))
  const col = diff === 0 ? '#4caf50' : diff <= 3 ? '#ff6b6b' : diff <= 7 ? '#ffb347' : '#4a9eff'
  return (
    <div style={{ height: 3, background: 'rgba(255,255,255,.07)', borderRadius: 2, marginTop: 10 }}>
      <div style={{ height: 3, borderRadius: 2, width: `${pct}%`, background: col, transition: 'width .4s' }} />
    </div>
  )
}
