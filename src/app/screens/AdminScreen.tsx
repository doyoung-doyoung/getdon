'use client'

import { useState, useCallback, useEffect } from 'react'
import { DB } from '@/lib/db'
import { Round, Member } from '@/types'
import { DdayBadge, DdayText, DdayBar } from '@/components/DDay'

const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'getdon2025'

const STATUS_LABEL: Record<string, string> = {
  collecting_dates: '📅 날짜 수집 중',
  date_confirmed: '✅ 날짜 확정',
  game_played: '🎮 게임 완료',
  completed: '🏆 완료',
}
const STATUS_COLOR: Record<string, string> = {
  collecting_dates: 'var(--blue)',
  date_confirmed: 'var(--green)',
  game_played: 'var(--orange)',
  completed: 'var(--gold)',
}

interface Props {
  onBack: () => void
  onGoGame: (id: string) => void
  onGoReceipt: (id: string) => void
  onRefresh: () => void
}

export default function AdminScreen({ onBack, onGoGame, onGoReceipt, onRefresh }: Props) {
  const [authed, setAuthed] = useState(false)
  const [pw, setPw] = useState('')
  const [rounds, setRounds] = useState<Round[]>([])
  const [selected, setSelected] = useState<Round | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ month: '', amount: '', total: '', password: '', notes: '' })

  const loadRounds = useCallback(() => setRounds(DB.getRounds()), [])
  useEffect(() => { if (authed) loadRounds() }, [authed, loadRounds])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2400)
  }

  function selectRound(r: Round) {
    setSelected(r)
    setMembers(DB.getMembers(r.id))
  }

  function login() {
    if (pw === ADMIN_PW) { setAuthed(true) }
    else { showToast('❌ 비밀번호가 틀렸어요') }
  }

  function createRound() {
    const month = form.month.trim()
    const amount = parseInt(form.amount) || 0
    const total = parseInt(form.total) || 0
    if (!month) { showToast('❗ 모임 월을 입력해주세요'); return }
    if (amount < 1000) { showToast('❗ 계금액을 입력해주세요'); return }
    if (total < 2) { showToast('❗ 인원은 2명 이상이어야 해요'); return }

    DB.createRound({
      round_number: DB.nextRoundNumber(), month, amount, total_members: total,
      password: form.password || null, notes: form.notes || null,
      status: 'collecting_dates', meeting_date: null,
      winner_id: null, winner_name: null, game_type: null,
    })
    setForm({ month: '', amount: '', total: '', password: '', notes: '' })
    setShowCreate(false)
    loadRounds(); onRefresh()
    showToast('✅ 새 판 생성 완료!')
  }

  function confirmDate(roundId: string, date: string) {
    if (!confirm(`${date}로 날짜를 확정할까요?`)) return
    DB.updateRound(roundId, { meeting_date: date, status: 'date_confirmed' })
    loadRounds(); onRefresh()
    if (selected?.id === roundId) selectRound({ ...selected, meeting_date: date, status: 'date_confirmed' })
    showToast(`✅ ${date} 확정!`)
  }

  function confirmPayment(roundId: string, memberId: string) {
    DB.updateMember(roundId, memberId, { payment_confirmed: true })
    setMembers(DB.getMembers(roundId))
    showToast('💳 납부 확인!')
  }

  function removeMember(roundId: string, memberId: string) {
    if (!confirm('참가자를 삭제할까요?')) return
    DB.removeMember(roundId, memberId)
    setMembers(DB.getMembers(roundId))
  }

  function resetWinner(roundId: string) {
    if (!confirm('당첨자를 초기화할까요?')) return
    DB.updateRound(roundId, { winner_id: null, winner_name: null, game_type: null, status: 'date_confirmed' })
    const mems = DB.getMembers(roundId).map(m => ({ ...m, has_won: false }))
    DB.saveMembers(roundId, mems)
    loadRounds(); onRefresh()
    if (selected) selectRound({ ...selected, winner_id: null, winner_name: null, status: 'date_confirmed' })
    showToast('🔄 초기화 완료')
  }

  function deleteRound(roundId: string) {
    if (!confirm('이 판을 삭제할까요? 복구할 수 없어요.')) return
    DB.deleteRound(roundId)
    setSelected(null); loadRounds(); onRefresh()
    showToast('🗑️ 삭제 완료')
  }

  // Vote summary
  const voteSummary = selected ? (() => {
    const map: Record<string, { count: number; names: string[] }> = {}
    members.forEach(m => (m.available_dates || []).forEach(d => {
      if (!map[d]) map[d] = { count: 0, names: [] }
      map[d].count++; map[d].names.push(m.name)
    }))
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count).slice(0, 6)
  })() : []

  const C: React.CSSProperties = { maxWidth: 520, margin: '0 auto' }

  // ── LOGIN ────────────────────────────────────────────────────────
  if (!authed) return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '20px 16px 80px' }}>
      <div style={{ ...C, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🔐</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginTop: 8 }}>관리자 로그인</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="inp" type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="비밀번호 입력" onKeyDown={e => e.key === 'Enter' && login()} />
          {toast && <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center' }}>{toast}</div>}
          <button className="btn-gold" onClick={login}>입장하기</button>
          <button className="btn-ghost" onClick={onBack} style={{ fontSize: 13 }}>← 홈으로</button>
        </div>
      </div>
    </main>
  )

  // ── DASHBOARD ────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', padding: '20px 16px 80px' }}>
      <div style={C}>
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--navy-l)', border: '1px solid rgba(201,168,76,.35)',
            borderRadius: 12, padding: '11px 22px', fontSize: 14, fontWeight: 600,
            color: 'var(--gold)', zIndex: 999, whiteSpace: 'nowrap',
          }}>{toast}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>⚙️ 관리자</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-gold" onClick={() => setShowCreate(true)} style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}>
              + 새 판
            </button>
            <button className="btn-ghost" onClick={() => setAuthed(false)} style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }}>
              로그아웃
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="card card-glow" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ color: 'var(--gold)', fontSize: 16 }}>새 판 만들기</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'rgba(253,248,239,.4)', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(253,248,239,.5)', display: 'block', marginBottom: 5 }}>모임 월</label>
                <input className="inp" value={form.month} onChange={e => setForm({...form, month: e.target.value})} placeholder="2025년 7월" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(253,248,239,.5)', display: 'block', marginBottom: 5 }}>계금액 (원)</label>
                  <input className="inp" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="100000" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'rgba(253,248,239,.5)', display: 'block', marginBottom: 5 }}>총 인원</label>
                  <input className="inp" type="number" value={form.total} onChange={e => setForm({...form, total: e.target.value})} placeholder="10" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'rgba(253,248,239,.5)', display: 'block', marginBottom: 5 }}>메모 (선택)</label>
                <input className="inp" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="특이사항" />
              </div>
              <button className="btn-gold" onClick={createRound}>판 만들기</button>
            </div>
          </div>
        )}

        {/* Rounds list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rounds.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'rgba(253,248,239,.4)' }}>
              아직 판이 없습니다<br />새 판을 만들어보세요!
            </div>
          ) : [...rounds].reverse().map(r => (
            <button key={r.id} onClick={() => selectRound(r)} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              background: 'var(--navy-l)', border: `1px solid ${selected?.id === r.id ? 'var(--gold)' : 'rgba(201,168,76,.18)'}`,
              borderRadius: 14, padding: 14, transition: '.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--gold)' }}>{r.round_number}판</span>
                  <span style={{ fontSize: 13 }}>{r.month}</span>
                  {r.meeting_date && <DdayBadge dateStr={r.meeting_date} />}
                </div>
                <span style={{ fontSize: 11, color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'rgba(253,248,239,.5)', marginTop: 6 }}>
                <span>💰 {r.amount.toLocaleString()}원</span>
                <span>👥 {r.total_members}명</span>
                {r.meeting_date && <span>📅 {r.meeting_date}</span>}
              </div>
              {r.winner_name && <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>🏆 당첨: {r.winner_name}</div>}
            </button>
          ))}
        </div>

        {/* Round detail */}
        {selected && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ color: 'var(--gold)', fontSize: 16 }}>{selected.round_number}판 상세</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(253,248,239,.4)', cursor: 'pointer', fontSize: 13 }}>✕ 닫기</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                ['참가 인원', `${members.length}명`],
                ['납부 확인', `${members.filter(m => m.payment_confirmed).length}명`],
                ['미참가', `${selected.total_members - members.length}명`],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--navy-m)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>{v}</div>
                  <div style={{ fontSize: 11, color: 'rgba(253,248,239,.4)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* D-day block */}
            {selected.meeting_date && (
              <div className="card" style={{ background: 'rgba(201,168,76,.07)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(253,248,239,.4)' }}>확정 날짜</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', marginTop: 2 }}>📅 {selected.meeting_date}</div>
                    <div style={{ marginTop: 6 }}><DdayText dateStr={selected.meeting_date} /></div>
                  </div>
                  <DdayBadge dateStr={selected.meeting_date} />
                </div>
                <DdayBar dateStr={selected.meeting_date} />
              </div>
            )}

            {/* Vote results */}
            {voteSummary.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 12, color: 'rgba(253,248,239,.4)', marginBottom: 12 }}>📊 날짜 투표 결과</div>
                {voteSummary.map(([date, info]) => (
                  <div key={date} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{date}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--gold)' }}>{info.count}명</span>
                        {selected.status === 'collecting_dates' && (
                          <button onClick={() => confirmDate(selected.id, date)} style={{
                            background: 'linear-gradient(135deg,var(--gold-l),var(--gold))', color: 'var(--navy)',
                            border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}>확정</button>
                        )}
                      </div>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,.07)', borderRadius: 2, marginTop: 6 }}>
                      <div style={{ height: 3, borderRadius: 2, background: 'var(--gold)', width: `${Math.round((info.count / Math.max(members.length, 1)) * 100)}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(253,248,239,.35)', marginTop: 3 }}>{info.names.join(', ')}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.status === 'date_confirmed' && (
                <button className="btn-gold" onClick={() => onGoGame(selected.id)}>🎮 게임 시작</button>
              )}
              {(selected.status === 'game_played' || selected.status === 'completed') && (
                <>
                  <button className="btn-gold" onClick={() => onGoReceipt(selected.id)}>🧾 영수증 보기</button>
                  <button onClick={() => resetWinner(selected.id)} style={{
                    background: 'rgba(255,68,68,.18)', border: '1px solid rgba(255,68,68,.3)',
                    borderRadius: 12, padding: '11px', color: 'var(--red)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
                  }}>⟳ 당첨 초기화</button>
                </>
              )}
              <button onClick={() => deleteRound(selected.id)} style={{
                background: 'rgba(100,100,100,.15)', border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 12, padding: '10px', color: 'rgba(253,248,239,.4)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
              }}>🗑️ 이 판 삭제</button>
            </div>

            {/* Members */}
            <div className="card">
              <div style={{ fontSize: 12, color: 'rgba(253,248,239,.4)', marginBottom: 10 }}>
                👥 참가자 명단 ({members.length}/{selected.total_members}명)
              </div>
              {members.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(253,248,239,.35)', fontSize: 13, padding: '16px 0' }}>아직 참가자가 없어요</div>
              ) : members.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</span>
                    {m.has_won && <span className="badge" style={{ background: 'rgba(201,168,76,.22)', color: 'var(--gold)', fontSize: 11 }}>🏆</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {m.payment_confirmed
                      ? <span className="badge" style={{ background: 'rgba(76,175,80,.2)', color: 'var(--green)', fontSize: 11 }}>납부완료</span>
                      : <button onClick={() => confirmPayment(selected.id, m.id)} style={{
                          background: 'rgba(255,152,0,.18)', border: '1px solid rgba(255,152,0,.3)',
                          borderRadius: 20, padding: '3px 10px', color: 'var(--orange)', fontSize: 11,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>납부확인</button>
                    }
                    <button onClick={() => removeMember(selected.id, m.id)} style={{
                      background: 'none', border: 'none', color: 'rgba(253,248,239,.25)', cursor: 'pointer', fontSize: 13,
                    }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
