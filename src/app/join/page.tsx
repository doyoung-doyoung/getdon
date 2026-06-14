'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getAdminMonth,
  getMemberVotes,
  setMemberVotes,
  getDaysInMonth,
  getFirstDayOfWeek,
  formatDateKo,
} from '@/lib/store'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// 1판당 금액 (바트)
const AMOUNT_PER_ROUND = 1000

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<'name' | 'calendar' | 'done'>('name')
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [adminMonth, setAdminMonth] = useState<string | null>(null)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [memberVotes, setMemberVotesState] = useState<Record<string, string[]>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setAdminMonth(getAdminMonth())
    setMemberVotesState(getMemberVotes())
  }, [])

  const handleNameSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setNameError('이름을 입력해주세요')
      return
    }
    if (trimmed.length < 2) {
      setNameError('2글자 이상 입력해주세요')
      return
    }
    setName(trimmed)
    setNameError('')

    if (!adminMonth) {
      setNameError('아직 관리자가 날짜를 설정하지 않았어요')
      return
    }
    setStep('calendar')
  }

  const toggleDate = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    )
  }

  const handleSubmit = () => {
    if (selectedDates.length === 0) return
    const votes = getMemberVotes()
    selectedDates.forEach(date => {
      if (!votes[date]) votes[date] = []
      if (!votes[date].includes(name)) votes[date].push(name)
    })
    setMemberVotes(votes)
    setStep('done')
  }

  if (!mounted) return null

  // 달력 렌더링
  const renderCalendar = () => {
    if (!adminMonth) return null
    const [year, month] = adminMonth.split('-').map(Number)
    const days = getDaysInMonth(adminMonth)
    const firstDay = getFirstDayOfWeek(adminMonth)
    const totalCells = Math.ceil((firstDay + days.length) / 7) * 7

    return (
      <div>
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
            const isSelected = selectedDates.includes(date)
            const dow = (firstDay + dayIndex) % 7
            const isSun = dow === 0
            const isSat = dow === 6
            return (
              <button
                key={date}
                onClick={() => toggleDate(date)}
                style={{
                  ...styles.dayCell,
                  background: isSelected ? '#00C471' : '#fff',
                  border: isSelected ? '2px solid #00C471' : '2px solid #E9ECEF',
                  color: isSelected ? '#fff' : isSun ? '#FF4D4D' : isSat ? '#2B6CB0' : '#212529',
                }}
              >
                <span style={styles.dayNum}>{d}</span>
                {isSelected && (
                  <span style={styles.dayBaht}>฿{AMOUNT_PER_ROUND.toLocaleString()}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        {/* 뒤로가기 */}
        <button style={styles.backBtn} onClick={() => {
          if (step === 'calendar') setStep('name')
          else router.push('/')
        }}>
          ← 돌아가기
        </button>

        {step === 'name' && (
          <div style={styles.section}>
            <div style={styles.stepIcon}>👤</div>
            <h2 style={styles.cardTitle}>모임 참가하기</h2>
            <p style={styles.cardDesc}>이름을 입력하고 참여 가능한 날짜를 선택해주세요</p>
            <div style={styles.inputWrap}>
              <label style={styles.inputLabel}>이름</label>
              <input
                style={styles.input}
                placeholder="홍길동"
                value={name}
                onChange={e => { setName(e.target.value); setNameError('') }}
                onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
                maxLength={20}
              />
              {nameError && <span style={styles.error}>{nameError}</span>}
            </div>
            <button style={styles.primaryBtn} onClick={handleNameSubmit}>
              날짜 선택하러 가기 →
            </button>
          </div>
        )}

        {step === 'calendar' && adminMonth && (
          <div style={styles.section}>
            <h2 style={styles.cardTitle}>날짜 선택</h2>
            <p style={styles.cardDesc}>
              <strong style={{ color: '#00C471' }}>{name}</strong>님, 참석 가능한 날짜를 모두 눌러주세요
            </p>
            <div style={styles.amountNote}>
              📌 선택한 날짜 = 1판 {AMOUNT_PER_ROUND.toLocaleString()}฿ 납부
            </div>

            {renderCalendar()}

            {selectedDates.length > 0 && (
              <div style={styles.selectedSummary}>
                <div style={styles.summaryTitle}>선택된 날짜 ({selectedDates.length}개)</div>
                <div style={styles.summaryDates}>
                  {[...selectedDates].sort().map(d => (
                    <span key={d} style={styles.summaryTag}>{formatDateKo(d)}</span>
                  ))}
                </div>
                <div style={styles.totalAmount}>
                  합계: <strong>{(selectedDates.length * AMOUNT_PER_ROUND).toLocaleString()}฿</strong>
                </div>
              </div>
            )}

            <button
              style={{
                ...styles.primaryBtn,
                opacity: selectedDates.length === 0 ? 0.4 : 1,
              }}
              onClick={handleSubmit}
              disabled={selectedDates.length === 0}
            >
              참가 신청 완료 ({selectedDates.length}일 선택)
            </button>
          </div>
        )}

        {step === 'done' && (
          <div style={{ ...styles.section, textAlign: 'center' }}>
            <div style={styles.doneIcon}>🎉</div>
            <h2 style={styles.cardTitle}>신청 완료!</h2>
            <p style={styles.cardDesc}>
              <strong>{name}</strong>님의 참가 신청이 완료됐어요
            </p>
            <div style={styles.doneDateList}>
              {[...selectedDates].sort().map(d => (
                <div key={d} style={styles.doneDateRow}>
                  <span>{formatDateKo(d)}</span>
                  <span style={{ color: '#00C471', fontWeight: 700 }}>{AMOUNT_PER_ROUND.toLocaleString()}฿</span>
                </div>
              ))}
              <div style={{ ...styles.doneDateRow, borderTop: '2px solid #E9ECEF', marginTop: 8, paddingTop: 8 }}>
                <span style={{ fontWeight: 700 }}>합계</span>
                <span style={{ color: '#00C471', fontWeight: 900, fontSize: 20 }}>
                  {(selectedDates.length * AMOUNT_PER_ROUND).toLocaleString()}฿
                </span>
              </div>
            </div>
            <button style={styles.primaryBtn} onClick={() => router.push('/')}>
              홈으로 돌아가기
            </button>
          </div>
        )}
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
    maxWidth: 440,
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
    padding: '20px 24px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  stepIcon: {
    fontSize: 40,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111',
    letterSpacing: '-0.5px',
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 14,
    color: '#868E96',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  amountNote: {
    background: '#FFF9E6',
    border: '1px solid #FFE58F',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    color: '#856404',
    fontWeight: 500,
  },
  inputWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#495057',
  },
  input: {
    border: '2px solid #E9ECEF',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 16,
    color: '#212529',
    transition: 'border-color 0.15s',
  },
  error: {
    fontSize: 12,
    color: '#FF4D4D',
  },
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
    marginTop: 4,
  },
  // 달력
  calendarHeader: {
    textAlign: 'center',
    marginBottom: 12,
  },
  calendarMonth: {
    fontSize: 17,
    fontWeight: 800,
    color: '#212529',
  },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
    marginBottom: 6,
  },
  weekdayCell: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 600,
    padding: '4px 0',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  emptyCell: {
    aspectRatio: '1',
  },
  dayCell: {
    aspectRatio: '1',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.1s',
    gap: 1,
    padding: '2px',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1,
  },
  dayBaht: {
    fontSize: 9,
    fontWeight: 600,
    lineHeight: 1,
    opacity: 0.9,
  },
  selectedSummary: {
    background: '#F0FDF8',
    border: '1px solid #A7F3D0',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#065F46',
  },
  summaryDates: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryTag: {
    background: '#00C471',
    color: '#fff',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 600,
  },
  totalAmount: {
    fontSize: 15,
    color: '#065F46',
  },
  // 완료 화면
  doneIcon: {
    fontSize: 56,
    textAlign: 'center',
    lineHeight: 1,
  },
  doneDateList: {
    background: '#F8F9FA',
    borderRadius: 14,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  doneDateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 15,
    color: '#212529',
  },
}
