'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getConfirmedDate, getMemberVotes, formatDateKo } from '@/lib/store'

const AMOUNT_PER_ROUND = 1000

export default function GamePage() {
  const router = useRouter()
  const [confirmedDate, setConfirmedDateState] = useState<string | null>(null)
  const [participants, setParticipants] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const d = getConfirmedDate()
    setConfirmedDateState(d)
    if (d) {
      const votes = getMemberVotes()
      setParticipants(votes[d] || [])
    }
  }, [])

  if (!mounted) return null

  if (!confirmedDate) {
    return (
      <main style={styles.main}>
        <div style={styles.card}>
          <button style={styles.backBtn} onClick={() => router.push('/')}>← 돌아가기</button>
          <div style={styles.emptySection}>
            <div style={{ fontSize: 48 }}>⏳</div>
            <h2 style={styles.cardTitle}>날짜 미확정</h2>
            <p style={styles.desc}>관리자가 아직 날짜를 확정하지 않았어요</p>
            <button style={styles.primaryBtn} onClick={() => router.push('/')}>홈으로</button>
          </div>
        </div>
      </main>
    )
  }

  const total = participants.length * AMOUNT_PER_ROUND

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={() => router.push('/')}>← 돌아가기</button>

        <div style={styles.section}>
          {/* 확정 배너 */}
          <div style={styles.confirmedBanner}>
            <div style={styles.roundLabel}>1판</div>
            <div style={styles.dateLabel}>{formatDateKo(confirmedDate)} 확정</div>
            <div style={styles.totalLabel}>총 {total.toLocaleString()}฿</div>
          </div>

          {/* 참가자 */}
          <div>
            <div style={styles.sectionTitle}>🎮 참가자 ({participants.length}명)</div>
            {participants.length === 0 ? (
              <div style={styles.emptyParticipants}>아직 참가 신청자가 없어요</div>
            ) : (
              <div style={styles.participantGrid}>
                {participants.map((name, idx) => (
                  <div key={name} style={styles.participantCard}>
                    <div style={styles.participantRank}>#{idx + 1}</div>
                    <div style={styles.participantName}>{name}</div>
                    <div style={styles.participantAmount}>{AMOUNT_PER_ROUND.toLocaleString()}฿</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 총액 */}
          {participants.length > 0 && (
            <div style={styles.totalCard}>
              <div style={styles.totalRow}>
                <span style={styles.totalLabelSm}>참가자</span>
                <span style={styles.totalValue}>{participants.length}명</span>
              </div>
              <div style={styles.totalRow}>
                <span style={styles.totalLabelSm}>1인 납부</span>
                <span style={styles.totalValue}>{AMOUNT_PER_ROUND.toLocaleString()}฿</span>
              </div>
              <div style={{ ...styles.totalRow, borderTop: '2px solid #E9ECEF', paddingTop: 12, marginTop: 4 }}>
                <span style={{ ...styles.totalLabelSm, fontWeight: 800, fontSize: 16 }}>총 판돈</span>
                <span style={{ ...styles.totalValue, fontSize: 24, color: '#00C471' }}>
                  {total.toLocaleString()}฿
                </span>
              </div>
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
    padding: '20px 24px 36px',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  emptySection: {
    padding: '40px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: '#111',
  },
  desc: {
    fontSize: 14,
    color: '#ADB5BD',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #00C471 0%, #00a85e 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '14px 32px',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  confirmedBanner: {
    background: 'linear-gradient(135deg, #111 0%, #2d2d2d 100%)',
    borderRadius: 20,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
  },
  roundLabel: {
    fontSize: 13,
    color: '#00C471',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  dateLabel: {
    fontSize: 24,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  totalLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 500,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#212529',
    marginBottom: 12,
  },
  emptyParticipants: {
    textAlign: 'center',
    color: '#ADB5BD',
    fontSize: 14,
    padding: '24px',
    background: '#F8F9FA',
    borderRadius: 12,
  },
  participantGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  participantCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#F8F9FA',
    borderRadius: 12,
    padding: '12px 16px',
  },
  participantRank: {
    fontSize: 12,
    fontWeight: 700,
    color: '#ADB5BD',
    width: 28,
    flexShrink: 0,
  },
  participantName: {
    fontSize: 15,
    fontWeight: 700,
    color: '#212529',
    flex: 1,
  },
  participantAmount: {
    fontSize: 14,
    fontWeight: 700,
    color: '#00C471',
  },
  totalCard: {
    background: '#F8F9FA',
    borderRadius: 16,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelSm: {
    fontSize: 14,
    color: '#868E96',
    fontWeight: 500,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#212529',
  },
}
