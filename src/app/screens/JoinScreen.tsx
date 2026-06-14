'use client'

import { useState, useEffect, useCallback } from 'react'
import { DB } from '@/lib/db'
import { Round, Member } from '@/types'
import { DdayBadge, DdayText, DdayBar } from '@/components/DDay'

interface Props { onBack: () => void; onRefresh: () => void }

type Step = 'list' | 'form' | 'done'

export default function JoinScreen({ onBack, onRefresh }: Props) {
  const [step, setStep] = useState<Step>('list')
  const [rounds, setRounds] = useState<Round[]>([])
  const [selected, setSelected] = useState<Round | null>(null)
  const [name, setName] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [member, setMember] = useState<Member | null>(null)
  const [msg, setMsg] = useState('')
  const [calDates, setCalDates] = useState<{ value: string; dow: number; day: number }[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    setRounds(DB.getRounds().filter(r => r.status === 'collecting_dates' || r.status === 'date_confirmed'))
  }, [])
  useEffect(() => { load() }, [load])

  function buildCal() {
    const now = new Date()
    const y = now.getFullYear(), m = now.getMonth()
    const days = new Date(y, m + 1, 0).getDate()
    const arr = []
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d)
      const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      arr.push({ value: dateStr, dow: date.getDay(), day: d })
    }
    setCalDates(arr)
  }

  function selectRound(r: Round) {
    setSelected(r); setDates([]); setName(''); setMsg('')
    buildCal()
    setStep('form')
  }

  function toggleDate(v: string) {
    setDates(prev => prev.includes(v) ? prev.filter(d => d !== v) : [...prev, v])
  }

  function submit() {
    if (!selected) return
    if (!name.trim()) { setMsg('이름을 입력해주세요'); return }
    if (selected.status === 'collecting_dates' && dates.length === 0) { setMsg('날짜를 1개 이상 선택해주세요'); return }
    const members = DB.getMembers(selected.id)
    if (members.find(m => m.name === name.trim())) { setMsg('이미 등록된 이름입니다'); return }
    if (members.length >= selected.total_members) { setMsg('인원이 가득 찼어요'); return }
    setLoading(true)
    const mem = DB.addMember(selected.id, { name: name.trim(), available_dates: dates, has_won: false, payment_confirmed: false })
    onRefresh()
    setMember(mem)
    setStep('done')
    setLoading(false)
  }

  const S: React.CSSProperties = { maxWidth: 520, margin: '0 auto' }
  const dayLabels = ['일','월','화','수','목','금','토']
  const firstDow = calDates[0]?.dow ?? 0

  return (
    <main style={{ minHeight: '100vh', padding: '20px 16px 80px' }}>
      <div style={S}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>참가하기</h2>
          <button onClick={onBack} style={{ color: 'rgba(253,248,239,.45)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>← 홈</button>
        </div>

        {msg && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,68,68,.18)', color: 'var(--red)', fontSize: 13, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
            {msg} <button onClick={() => setMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: .6 }}>✕</button>
          </div>
        )}

        {/* LIST */}
        {step === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rounds.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 40, color: 'rgba(253,248,239,.4)' }}>
                <div style={{ fontSize: 36 }}>😔</div>
                <div style={{ marginTop: 12, fontSize: 14 }}>현재 참가 가능한 판이 없어요</div>
              </div>
            ) : rounds.map(r => (
              <button key={r.id} onClick={() => selectRound(r)} style={{
                width: '100%', textAlign: 'left', border: '1px solid rgba(201,168,76,.18)',
                borderRadius: 14, padding: 16, background: 'var(--navy-l)', cursor: 'pointer',
                transition: '.15s', fontFamily: 'inherit',
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
              onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,.18)')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>{r.round_number}판</span>
                    <span style={{ fontSize: 14 }}>{r.month}</span>
                    {r.meeting_date && <DdayBadge dateStr={r.meeting_date} />}
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(253,248,239,.4)' }}>참가하기 →</span>
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'rgba(253,248,239,.55)', marginTop: 8 }}>
                  <span>💰 {r.amount.toLocaleString()}원</span>
                  <span>👥 {r.total_members}명</span>
                </div>
                {r.meeting_date ? (
                  <>
                    <div style={{ marginTop: 8 }}><DdayText dateStr={r.meeting_date} /></div>
                    <DdayBar dateStr={r.meeting_date} />
                  </>
                ) : <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(253,248,239,.3)' }}>📅 날짜 투표 중</div>}
              </button>
            ))}
          </div>
        )}

        {/* FORM */}
        {step === 'form' && selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Round info */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)' }}>{selected.round_number}판</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{selected.month}</div>
                    <div style={{ fontSize: 12, color: 'rgba(253,248,239,.5)', marginTop: 2 }}>
                      💰 {selected.amount.toLocaleString()}원 · 👥 {selected.total_members}명
                    </div>
                  </div>
                </div>
                {selected.meeting_date && <DdayBadge dateStr={selected.meeting_date} />}
              </div>
              {selected.meeting_date && (
                <>
                  <div style={{ marginTop: 10 }}><DdayText dateStr={selected.meeting_date} /></div>
                  <DdayBar dateStr={selected.meeting_date} />
                </>
              )}
            </div>

            {/* Name */}
            <div>
              <label style={{ fontSize: 12, color: 'rgba(253,248,239,.5)', display: 'block', marginBottom: 6 }}>이름 입력</label>
              <input className="inp" value={name} onChange={e => setName(e.target.value)}
                placeholder="이름을 입력하세요" maxLength={10}
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>

            {/* Calendar */}
            {selected.status === 'collecting_dates' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: 'rgba(253,248,239,.5)' }}>가능한 날짜 선택</label>
                  <span style={{ fontSize: 11, color: 'rgba(253,248,239,.35)' }}>{dates.length}개 선택됨</span>
                </div>
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
                    {dayLabels.map((d, i) => (
                      <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '4px 0',
                        color: i === 0 ? 'var(--red)' : i === 6 ? 'var(--blue)' : 'rgba(253,248,239,.35)' }}>
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="cal-grid">
                    {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                    {calDates.map(d => (
                      <button key={d.value} onClick={() => toggleDate(d.value)}
                        className={`cal-cell${dates.includes(d.value) ? ' selected' : ''}`}
                        style={{ color: dates.includes(d.value) ? 'var(--navy)' : d.dow === 0 ? 'var(--red)' : d.dow === 6 ? 'var(--blue)' : 'var(--cream)' }}>
                        {d.day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selected.status === 'date_confirmed' && (
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24 }}>📅</div>
                <div style={{ fontWeight: 700, color: 'var(--green)', marginTop: 6 }}>날짜가 확정되었습니다</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', marginTop: 4 }}>{selected.meeting_date}</div>
                <div style={{ marginTop: 6 }}><DdayText dateStr={selected.meeting_date} /></div>
              </div>
            )}

            <button className="btn-gold" onClick={submit} disabled={loading}>
              {loading ? '등록 중...' : '✅ 참가 등록하기'}
            </button>
            <button className="btn-ghost" onClick={() => { setStep('list'); setSelected(null) }} style={{ fontSize: 13 }}>
              ← 뒤로
            </button>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && member && selected && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div className="bounce-in" style={{ fontSize: 60 }}>🎉</div>
            <div className="card card-glow" style={{ width: '100%' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--gold)' }}>참가 완료!</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>{member.name}님 등록되었습니다</div>
              <div style={{ fontSize: 13, color: 'rgba(253,248,239,.55)', marginTop: 6 }}>
                💰 {selected.amount.toLocaleString()}원 준비해주세요
              </div>
              {dates.length > 0 && (
                <div style={{ fontSize: 12, color: 'rgba(253,248,239,.4)', marginTop: 4 }}>
                  📅 {dates.length}개 날짜 선택됨
                </div>
              )}
              {selected.meeting_date && (
                <div style={{ marginTop: 14, background: 'rgba(0,0,0,.2)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'rgba(253,248,239,.5)' }}>모임 날짜</span>
                    <DdayBadge dateStr={selected.meeting_date} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>📅 {selected.meeting_date}</div>
                  <div style={{ marginTop: 6 }}><DdayText dateStr={selected.meeting_date} /></div>
                  <DdayBar dateStr={selected.meeting_date} />
                </div>
              )}
            </div>
            <button className="btn-ghost" onClick={() => { setStep('list'); setSelected(null); load() }}>
              다른 판 참가하기
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
