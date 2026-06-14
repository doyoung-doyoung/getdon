'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getConfirmedDate, formatDateKo } from '@/lib/store'

export default function Home() {
  const router = useRouter()
  const [confirmedDate, setConfirmedDate] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setConfirmedDate(getConfirmedDate())

    const onStorage = () => setConfirmedDate(getConfirmedDate())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <main style={styles.main}>
      {/* 헤더 */}
      <div style={styles.header}>
        <div style={styles.logoMark}>💰</div>
        <h1 style={styles.title}>겟돈</h1>
        <p style={styles.subtitle}>계모임 날짜 조율 & 게임 관리</p>
      </div>

      {/* 확정 날짜 배너 */}
      {mounted && confirmedDate && (
        <div style={styles.confirmedBanner}>
          <div style={styles.confirmedBadge}>확정</div>
          <div style={styles.confirmedText}>
            <span style={styles.confirmedRound}>1판</span>
            <span style={styles.confirmedDate}>{formatDateKo(confirmedDate)} 확정</span>
          </div>
          <button
            style={styles.gameBtn}
            onClick={() => router.push('/game')}
          >
            🎮 게임 하기
          </button>
        </div>
      )}

      {/* 메인 버튼들 */}
      <div style={styles.btnGroup}>
        <button
          style={styles.joinBtn}
          onClick={() => router.push('/join')}
        >
          <span style={styles.btnIcon}>🗓️</span>
          <div style={styles.btnText}>
            <span style={styles.btnLabel}>모임 참가하기</span>
            <span style={styles.btnDesc}>날짜 선택 및 참가 신청</span>
          </div>
          <span style={styles.arrow}>›</span>
        </button>

        <button
          style={styles.adminBtn}
          onClick={() => router.push('/admin')}
        >
          <span style={styles.btnIcon}>⚙️</span>
          <div style={styles.btnText}>
            <span style={styles.btnLabel}>관리자 페이지</span>
            <span style={styles.btnDesc}>날짜 설정 및 통계 확인</span>
          </div>
          <span style={styles.arrow}>›</span>
        </button>
      </div>

      <p style={styles.footer}>© 2025 겟돈</p>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    background: 'linear-gradient(160deg, #f0fdf8 0%, #fafafa 60%)',
    gap: 0,
  },
  header: {
    textAlign: 'center',
    marginBottom: 40,
  },
  logoMark: {
    fontSize: 56,
    lineHeight: 1,
    marginBottom: 12,
    display: 'block',
    filter: 'drop-shadow(0 4px 12px rgba(0,196,113,0.3))',
  },
  title: {
    fontSize: 40,
    fontWeight: 900,
    color: '#111',
    letterSpacing: '-1px',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#868E96',
    fontWeight: 500,
  },
  confirmedBanner: {
    width: '100%',
    maxWidth: 400,
    background: 'linear-gradient(135deg, #00C471 0%, #00a85e 100%)',
    borderRadius: 20,
    padding: '20px 24px',
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 8px 32px rgba(0,196,113,0.3)',
  },
  confirmedBadge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.25)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
    width: 'fit-content',
    letterSpacing: '0.5px',
  },
  confirmedText: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  confirmedRound: {
    fontSize: 14,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.8)',
  },
  confirmedDate: {
    fontSize: 22,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  gameBtn: {
    background: '#fff',
    color: '#00C471',
    border: 'none',
    borderRadius: 12,
    padding: '12px 0',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  btnGroup: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: 40,
  },
  joinBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 22px',
    background: '#fff',
    border: '2px solid #00C471',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.15s',
    boxShadow: '0 4px 20px rgba(0,196,113,0.1)',
    textAlign: 'left',
  },
  adminBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 22px',
    background: '#fff',
    border: '2px solid #E9ECEF',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.15s',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    textAlign: 'left',
  },
  btnIcon: {
    fontSize: 28,
    flexShrink: 0,
  },
  btnText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flex: 1,
  },
  btnLabel: {
    fontSize: 17,
    fontWeight: 700,
    color: '#212529',
  },
  btnDesc: {
    fontSize: 13,
    color: '#ADB5BD',
    fontWeight: 400,
  },
  arrow: {
    fontSize: 24,
    color: '#CED4DA',
    fontWeight: 300,
    flexShrink: 0,
  },
  footer: {
    fontSize: 12,
    color: '#CED4DA',
  },
}
