'use client'

import { useState, useEffect } from 'react'
import { DB } from '@/lib/db'
import { Round, Member } from '@/types'

interface Props {
  roundId: string | null
  onBack: () => void
  onHome: () => void
}

const GAME_LABELS: Record<string, string> = {
  draw: '룰렛 뽑기', button: '버튼 누르기', dice: '주사위 굴리기', ladder: '사다리 타기',
}

export default function ReceiptScreen({ roundId, onBack, onHome }: Props) {
  const [round, setRound] = useState<Round | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [winner, setWinner] = useState<Member | null>(null)

  useEffect(() => {
    if (!roundId) return
    const r = DB.getRound(roundId)
    if (!r) return
    setRound(r)
    const mems = DB.getMembers(roundId)
    setMembers(mems)
    setWinner(mems.find(m => m.id === r.winner_id) ?? null)
  }, [roundId])

  function print() { window.print() }

  function share() {
    if (!round || !winner) return
    const text = `🏆 ${winner.name}님이 ${round.month} 겟돈 ${round.round_number}판에서 당첨되었습니다!\n💰 ${round.amount.toLocaleString()}원`
    if (navigator.share) {
      navigator.share({ title: '겟돈 당첨!', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('클립보드에 복사되었습니다!')
    }
  }

  const now = new Date()
  const dateStr = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일`
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  const paidCount = members.filter(m => m.payment_confirmed).length

  if (!roundId || !round) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px 80px' }}>
      <div style={{ textAlign: 'center', color: 'rgba(253,248,239,.4)' }}>
        <div style={{ fontSize: 40 }}>🧾</div>
        <div style={{ marginTop: 12 }}>영수증 정보가 없어요</div>
        <button className="btn-ghost" onClick={onBack} style={{ marginTop: 20, maxWidth: 200 }}>← 돌아가기</button>
      </div>
    </main>
  )

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #receipt-page { display: block !important; }
          .no-print { display: none !important; }
          body { background: #1A1F3A !important; color: #FDF8EF !important; }
        }
      `}</style>

      <main id="receipt-page" style={{ minHeight: '100vh', padding: '20px 16px 80px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {/* Actions */}
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={onBack} style={{ color: 'rgba(253,248,239,.45)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>← 관리자</button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>🧾 영수증</h2>
            <button onClick={print} style={{
              background: 'linear-gradient(135deg,var(--gold-l),var(--gold))', color: 'var(--navy)',
              border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>🖨️ 인쇄/PDF</button>
          </div>

          {/* Receipt body */}
          <div style={{
            background: 'var(--navy-m)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 16, padding: '28px 22px',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', paddingBottom: 18, borderBottom: '1px dashed rgba(201,168,76,.3)' }}>
              <div style={{ fontSize: 38 }}>💰</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)', marginTop: 6 }}>겟돈</div>
              <div style={{ fontSize: 11, color: 'rgba(253,248,239,.35)', letterSpacing: 2, marginTop: 3 }}>계모임 당첨 영수증</div>
            </div>

            {/* Winner */}
            {winner ? (
              <div style={{
                margin: '18px 0', padding: '18px', textAlign: 'center',
                background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.25)', borderRadius: 12,
              }}>
                <div style={{ fontSize: 36 }}>🏆</div>
                <div style={{ fontSize: 12, color: 'rgba(253,248,239,.4)', marginTop: 8 }}>당첨자</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--gold)', marginTop: 4 }}>{winner.name}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold-l)', marginTop: 6 }}>
                  ₩{round.amount.toLocaleString()}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(253,248,239,.4)' }}>당첨자 없음</div>
            )}

            {/* Details */}
            <div style={{ borderTop: '1px dashed rgba(201,168,76,.25)', paddingTop: 14 }}>
              {([
                ['판 번호', `${round.round_number}판`],
                ['모임 월', round.month],
                ['모임 날짜', round.meeting_date ?? '-'],
                ['게임 방식', round.game_type ? (GAME_LABELS[round.game_type] ?? round.game_type) : '-'],
                ['총 참가자', `${members.length}명`],
                ['납부 확인', `${paidCount}명`],
                ['총 납부액', `₩${(paidCount * round.amount).toLocaleString()}`],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ fontSize: 12, color: 'rgba(253,248,239,.4)' }}>{l}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Members */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed rgba(201,168,76,.25)' }}>
              <div style={{ fontSize: 11, color: 'rgba(253,248,239,.35)', marginBottom: 8 }}>참가자 명단</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {members.map(m => (
                  <span key={m.id} className="badge" style={{
                    background: m.id === round.winner_id ? 'rgba(201,168,76,.25)' : 'rgba(255,255,255,.07)',
                    color: m.id === round.winner_id ? 'var(--gold)' : 'rgba(253,248,239,.5)',
                    fontSize: 11,
                  }}>
                    {m.id === round.winner_id ? '🏆 ' : ''}{m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px dashed rgba(201,168,76,.2)' }}>
              <div style={{ fontSize: 11, color: 'rgba(253,248,239,.3)' }}>{dateStr} {timeStr}</div>
              <div style={{ fontSize: 10, color: 'rgba(253,248,239,.15)', marginTop: 3 }}>겟돈 계모임 앱</div>
              <div style={{
                width: 50, height: 50, borderRadius: '50%', border: '2px solid rgba(201,168,76,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, margin: '12px auto 0',
              }}>💰</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            <button className="btn-gold" onClick={print}>🖨️ 인쇄 / PDF로 저장</button>
            <button className="btn-ghost" onClick={share} style={{ fontSize: 13 }}>📤 공유하기</button>
            <button className="btn-ghost" onClick={onHome} style={{ fontSize: 13, opacity: .6 }}>홈으로</button>
          </div>
        </div>
      </main>
    </>
  )
}
