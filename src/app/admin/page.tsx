'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAdminMonth,
  setAdminMonth,
  getMemberVotes,
  getConfirmedDate,
  setConfirmedDate,
  getDaysInMonth,
  getFirstDayOfWeek,
  formatDateKo,
} from '@/lib/store'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'getdon2025'
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 현재 날짜 기준 선택 가능한 월 목록 (이번달~6개월 후)
function getMonthOptions(): string[] {
  const now = new Date()
  const options: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    options.push(`${y}-${m}`)
  }
  return options
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return `${y}년 ${parseInt(m)}월`
}

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [pwError, setPwError] = useState('')

  const [adminMonth, setAdminMonthState] = useState<string | null>(null)
  const [confirmedDate, setConfirmedDateState] = useState<string | null>(null)
  const [memberVotes, setMemberVotesState] = useState<Record<string, string[]>>({})
  const [mounted, setMounted] = useState(false)

  // 달력: 어드민이 날짜를 확정할 때 선택
  const [pickingDate, setPickingDate] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    setAdminMonthState(getAdminMonth())
    setConfirmedDateState(getConfirmedDate())
    setMemberVotesState(getMemberVotes())
  }, [])

  const handleLogin = () => {
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('비밀번호가 맞지 않아요')
    }
  }

  const handleMonthSelect = (ym: string) => {
    setAdminMonth(ym)
    setAdminMonthState(ym)
    setPickingDate(null)
  }

  const handleConfirmDate = () => {
    if (!pickingDate) return
    setConfirmedDate(pickingDate)
    setConfirmedDateState(pickingDate)
    alert(`✅ ${formatDateKo(pickingDate)} 확정 완료!`)
  }

  const handleCancelConfirm = () => {
    setConfirmedDate(null)
    setConfirmedDateState(null)
    setPickingDate(null)
  }

  const refreshVotes = () => {
    setMemberVotesState(getMemberVotes())
  }

  if (!mounted) return null

  // 로그인 화면
  if (!authed) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <button style={styles.backBtn} onClick={() => router.push('/')}>← 돌아가기</button>
          <div style={styles.section}>
            <div style={{ fontSize: 40, textAlign: 'center' }}>🔐</div>
            <h2 style={styles.cardTitle}>관리자 로그인</h2>
            <div style={styles.inputWrap}>
              <label style={styles.inputLabel}>비밀번호</label>
              <input
                type="password"
                style={styles.input}
                placeholder="비밀번호 입력"
                value={pw}
                onChange={e => { setPw(e.target.value); setPwError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              {pwError && <span style={styles.error}>{pwError}</span>}
            </div>
            <button style={styles.primaryBtn} onClick={handleLogin}>로그인</button>
          </div>
        </div>
      </main>
    )
  }

  // 달력 렌더링 (확정 날짜 선택용)
  const renderAdminCalendar = () => {
    if (!adminMonth) return null
    const [year, month] = adminMonth.split('-').map(Number)
    const days = getDaysInMonth(adminMonth)
    const firstDay = getFirstDayOfWeek(adminMonth)
    const totalCells = Math.ceil((firstDay + days.length) / 7) * 7

    return (
      <div style={{ marginTop: 8 }}>
        <p style={styles.sectionDesc}>확정할 날짜를 선택해주세요</p>
        <div style={styles.calendarHeader}>
          <span style={styles.calendarMonth}>{year}년 {month}월</span>
        </div>
        <div style={styles.weekdayRow}>
          {WEEKDAYS.map(w => (
            <div key={w} style={{
              ...styles.weekdayCell,
              color: w === '일' ? '#FF4D4D' : w === '토' ? '#2B6CB0' : '#868E96',
            }}>{w}</div>
          ))}
        </div>
        <div style={styles.calendarGrid}>
          {Array.from({ length: totalCells }).map((_, i) => {
            const dayIndex = i - firstDay
            if (dayIndex < 0 || dayIndex >= days.length) {
              return <div key={i} style={styles.emptyCell} />
            }
            const date = days[dayIndex]
            const d = dayIndex + 1
            const isConfirmed = confirmedDate === date
            const isPicking = pickingDate === date
            const votes = memberVotes[date] || []
            const dow = (firstDay + dayIndex) % 7
            const isSun = dow === 0
            const isSat = dow === 6

            let bg = '#fff'
            let border = '2px solid #E9ECEF'
            let color = isSun ? '#FF4D4D' : isSat ? '#2B6CB0' : '#212529'

            if (isConfirmed) { bg = '#00C471'; border = '2px solid #00C471'; color = '#fff' }
            else if (isPicking) { bg = '#E6FFF5'; border = '2px solid #00C471'; color = '#00A85E' }

            return (
              <button
                key={date}
                onClick={() => setPickingDate(date === pickingDate ? null : date)}
                style={{
                  ...styles.adminDayCell,
                  background: bg,
                  border,
                  color,
                }}
              >
                <span style={styles.dayNum}>{d}</span>
                {votes.length > 0 && (
                  <span style={{
                    ...styles.voteCount,
                    background: isConfirmed ? 'rgba(255,255,255,0.3)' : '#00C471',
                    color: '#fff',
                  }}>{votes.length}명</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // 날짜별 통계
  const renderStats = () => {
    if (!adminMonth) return null
    const days = getDaysInMonth(adminMonth)
    const entries = days
      .map(d => ({ date: d, members: memberVotes[d] || [] }))
      .filter(e => e.members.length > 0)
      .sort((a, b) => b.members.length - a.members.length)

    if (entries.length === 0) {
      return (
        <div style={styles.emptyStats}>
          아직 아무도 날짜를 선택하지 않았어요
        </div>
      )
    }

    const maxCount = Math.max(...entries.map(e => e.members.length))

    return (
      <div style={styles.statsList}>
        {entries.map(({ date, members }) => (
          <div key={date} style={styles.statRow}>
            <div style={styles.statDateWrap}>
              <span style={styles.statDate}>{formatDateKo(date)}</span>
              <span style={styles.statCount}>{members.length}명</span>
            </div>
            <div style={styles.barWrap}>
              <div
                style={{
                  ...styles.bar,
                  width: `${(members.length / maxCount) * 100}%`,
                  background: confirmedDate === date
                    ? 'linear-gradient(90deg, #00C471, #00a85e)'
                    : 'linear-gradient(90deg, #A7F3D0, #6EE7B7)',
                }}
              />
            </div>
            <div style={styles.memberNames}>
              {members.map(m => (
                <span key={m} style={styles.memberTag}>{m}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => router.push('/')}>← 돌아가기</button>

        <div style={styles.section}>
          <h2 style={styles.cardTitle}>⚙️ 관리자 페이지</h2>

          {/* 확정 상태 */}
          {confirmedDate && (
            <div style={styles.confirmedBanner}>
              <div>
                <div style={styles.confirmedBadge}>📌 확정됨</div>
                <div style={styles.confirmedDateText}>
                  1판 — {formatDateKo(confirmedDate)} 확정
                </div>
              </div>
              <button style={styles.cancelBtn} onClick={handleCancelConfirm}>취소</button>
            </div>
          )}

          {/* 월 선택 */}
          <div>
            <div style={styles.sectionLabel}>📅 모임 달 설정</div>
            <div style={styles.monthGrid}>
              {getMonthOptions().map(ym => (
                <button
                  key={ym}
                  onClick={() => handleMonthSelect(ym)}
                  style={{
                    ...styles.monthBtn,
                    background: adminMonth === ym ? '#00C471' : '#F8F9FA',
                    color: adminMonth === ym ? '#fff' : '#495057',
                    border: adminMonth === ym ? '2px solid #00C471' : '2px solid #E9ECEF',
                    fontWeight: adminMonth === ym ? 700 : 500,
                  }}
                >
                  {monthLabel(ym)}
                </button>
              ))}
            </div>
          </div>

          {/* 달력 + 날짜 확정 */}
          {adminMonth && (
            <div style={styles.calendarSection}>
              <div style={styles.sectionLabel}>📌 날짜 확정</div>
              {renderAdminCalendar()}

              {pickingDate && (
                <div style={styles.pickingBanner}>
                  <span>선택: <strong>{formatDateKo(pickingDate)}</strong></span>
                  <button style={styles.confirmBtn} onClick={handleConfirmDate}>
                    이 날로 확정
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 통계 */}
          {adminMonth && (
            <div>
              <div style={styles.sectionLabelRow}>
                <span style={styles.sectionLabel}>📊 날짜별 통계</span>
                <button style={styles.refreshBtn} onClick={refreshVotes}>새로고침</button>
              </div>
              {renderStats()}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #f0fdf8 0%, #fafafa 60%)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px 48px',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    background: '#fff',
    borderRadius: 24,
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#ADB5BD',
    fontSize: 14,
    padding: '18px 24px 0',
    cursor: 'pointer',
    display: 'block',
  },
  section: {
    padding: '20px 24px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111',
    letterSpacing: '-0.5px',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: '#495057',
    marginBottom: 10,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#868E96',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  // 로그인
  inputWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: 600, color: '#495057' },
  input: {
    border: '2px solid #E9ECEF',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 16,
    color: '#212529',
  },
  error: { fontSize: 12, color: '#FF4D4D' },
  primaryBtn: {
    background: 'linear-gradient(135deg, #00C471 0%, #00a85e 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '16px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(0,196,113,0.3)',
  },
  // 월 선택
  monthGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  },
  monthBtn: {
    borderRadius: 10,
    padding: '10px 4px',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  // 달력
  calendarSection: {
    background: '#F8F9FA',
    borderRadius: 16,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  calendarHeader: { textAlign: 'center', marginBottom: 8 },
  calendarMonth: { fontSize: 16, fontWeight: 800, color: '#212529' },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
    marginBottom: 4,
  },
  weekdayCell: { textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '2px 0' },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  emptyCell: { aspectRatio: '1' },
  adminDayCell: {
    aspectRatio: '1',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    gap: 2,
    padding: '2px',
    transition: 'all 0.1s',
  },
  dayNum: { fontSize: 13, fontWeight: 700, lineHeight: 1 },
  voteCount: {
    fontSize: 9,
    fontWeight: 700,
    borderRadius: 10,
    padding: '1px 4px',
    lineHeight: 1.4,
  },
  pickingBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#E6FFF5',
    border: '1px solid #A7F3D0',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 14,
    color: '#065F46',
  },
  confirmBtn: {
    background: '#00C471',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  // 확정 배너
  confirmedBanner: {
    background: 'linear-gradient(135deg, #00C471 0%, #00a85e 100%)',
    borderRadius: 16,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmedBadge: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: 600,
    marginBottom: 4,
  },
  confirmedDateText: {
    fontSize: 18,
    fontWeight: 800,
    color: '#fff',
  },
  cancelBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.4)',
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
  },
  // 통계
  emptyStats: {
    textAlign: 'center',
    color: '#ADB5BD',
    fontSize: 14,
    padding: '24px 0',
    background: '#F8F9FA',
    borderRadius: 12,
  },
  statsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  statRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  statDateWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statDate: {
    fontSize: 14,
    fontWeight: 700,
    color: '#212529',
  },
  statCount: {
    fontSize: 14,
    fontWeight: 700,
    color: '#00C471',
  },
  barWrap: {
    height: 8,
    background: '#F1F3F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  memberNames: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
  },
  memberTag: {
    background: '#F1F3F5',
    color: '#495057',
    borderRadius: 20,
    padding: '2px 8px',
    fontSize: 12,
    fontWeight: 500,
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #DEE2E6',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 12,
    color: '#868E96',
    cursor: 'pointer',
  },
}
