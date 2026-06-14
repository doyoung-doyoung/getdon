'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DB } from '@/lib/db'
import { Round, Member, GameType } from '@/types'

interface Props {
  roundId: string
  onBack: () => void
  onDone: (id: string) => void
}

// ── CONFETTI ──────────────────────────────────────────────────────
function spawnConfetti() {
  const colors = ['#C9A84C','#F0D080','#8B6914','#ff6b6b','#4a9eff','#4caf50']
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('div')
    el.className = 'confetti-piece'
    el.style.cssText = `left:${Math.random()*100}%;top:-10px;background:${colors[i%colors.length]};border-radius:${Math.random()>.5?'50%':'2px'};animation-duration:${2+Math.random()*2}s;animation-delay:${Math.random()*1.5}s`
    document.body.appendChild(el)
    el.addEventListener('animationend', () => el.remove())
  }
}

// ── ROULETTE ──────────────────────────────────────────────────────
function DrawGame({ members, onWinner }: { members: Member[], onWinner: (m: Member) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const angleRef = useRef(0)
  const [spinning, setSpinning] = useState(false)
  const [pickedName, setPickedName] = useState<string | null>(null)

  const draw = useCallback((rot: number) => {
    const canvas = canvasRef.current
    if (!canvas || members.length === 0) return
    const ctx = canvas.getContext('2d')!
    const cx = 140, cy = 140, r = 128
    ctx.clearRect(0, 0, 280, 280)
    const colors = ['#C9A84C','#8B6914','#F0D080','#2E3560','#1A1F3A','#252B4A','#C9A84C','#8B6914']
    const slice = (Math.PI * 2) / members.length
    members.forEach((m, i) => {
      const s = rot + i * slice, e = s + slice
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, s, e)
      ctx.fillStyle = colors[i % colors.length]; ctx.fill()
      ctx.strokeStyle = '#1A1F3A'; ctx.lineWidth = 2; ctx.stroke()
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(s + slice / 2)
      ctx.textAlign = 'right'; ctx.fillStyle = '#FDF8EF'
      ctx.font = `bold ${Math.max(10, 14 - members.length * 0.4)}px Noto Sans KR, sans-serif`
      ctx.fillText(m.name.slice(0, 5), r - 8, 5); ctx.restore()
    })
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2)
    ctx.fillStyle = '#1A1F3A'; ctx.fill()
    ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 2; ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + r - 6, cy - 10); ctx.lineTo(cx + r + 16, cy); ctx.lineTo(cx + r - 6, cy + 10)
    ctx.fillStyle = '#ff4444'; ctx.fill()
  }, [members])

  useEffect(() => { draw(0) }, [draw])

  function spin() {
    if (spinning) return
    setSpinning(true); setPickedName(null)
    const targetIdx = Math.floor(Math.random() * members.length)
    const slice = (Math.PI * 2) / members.length
    const target = -(targetIdx * slice + slice / 2) + Math.PI / 2
    const total = (5 + Math.random() * 5) * Math.PI * 2 + target - angleRef.current
    const start = angleRef.current, dur = 4200, t0 = performance.now()
    function tick(now: number) {
      const p = Math.min((now - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 4)
      angleRef.current = start + total * ease
      draw(angleRef.current)
      if (p < 1) { requestAnimationFrame(tick); return }
      setSpinning(false)
      setPickedName(members[targetIdx].name)
      setTimeout(() => onWinner(members[targetIdx]), 700)
    }
    requestAnimationFrame(tick)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <canvas ref={canvasRef} width={280} height={280} style={{ borderRadius: '50%' }} />
      {pickedName && (
        <div className="bounce-in" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--gold)' }}>{pickedName}</div>
        </div>
      )}
      <button className="btn-gold" onClick={spin} disabled={spinning} style={{ width: 220 }}>
        {spinning ? '돌아가는 중...' : '🎡 돌리기!'}
      </button>
    </div>
  )
}

// ── BUTTON GAME ───────────────────────────────────────────────────
function ButtonGame({ members, onWinner }: { members: Member[], onWinner: (m: Member) => void }) {
  const [pressed, setPressed] = useState<string[]>([])
  const [winner, setWinner] = useState<Member | null>(null)

  function press(m: Member) {
    if (pressed.includes(m.id) || winner) return
    const next = [...pressed, m.id]
    setPressed(next)
    if (next.length === members.length) {
      const w = members[Math.floor(Math.random() * members.length)]
      setWinner(w)
      setTimeout(() => onWinner(w), 600)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(253,248,239,.5)' }}>
        모두 버튼을 누르면 랜덤으로 당첨! ({pressed.length}/{members.length}명)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {members.map(m => {
          const isPressed = pressed.includes(m.id)
          const isWinner = winner?.id === m.id
          return (
            <button key={m.id} onClick={() => press(m)} disabled={isPressed || !!winner} style={{
              padding: '22px 12px', borderRadius: 14, fontSize: 15, fontWeight: 900,
              border: isWinner ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,.1)',
              background: isWinner
                ? 'linear-gradient(135deg,var(--gold-l),var(--gold))'
                : isPressed ? 'rgba(76,175,80,.25)' : 'var(--navy-m)',
              color: isWinner ? 'var(--navy)' : 'var(--cream)',
              cursor: isPressed ? 'default' : 'pointer',
              transition: '.2s', fontFamily: 'inherit',
              transform: isWinner ? 'scale(1.04)' : isPressed ? 'scale(.96)' : 'scale(1)',
              boxShadow: isWinner ? '0 0 24px rgba(201,168,76,.4)' : 'none',
            }}>
              {isWinner ? '🏆' : isPressed ? '✅' : '🔴'}<br />
              <span style={{ fontSize: 13 }}>{m.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── DICE GAME ─────────────────────────────────────────────────────
function DiceGame({ members, onWinner }: { members: Member[], onWinner: (m: Member) => void }) {
  const [results, setResults] = useState<Record<string, number>>({})
  const [rolling, setRolling] = useState(false)
  const faces = ['⚀','⚁','⚂','⚃','⚄','⚅']

  function rollAll() {
    if (rolling) return
    setRolling(true); setResults({})
    const final: Record<string, number> = {}
    members.forEach((m, i) => {
      let c = 0
      const iv = setInterval(() => {
        setResults(prev => ({ ...prev, [m.id]: Math.floor(Math.random() * 6) + 1 }))
        c++
        if (c > 12) {
          clearInterval(iv)
          final[m.id] = Math.floor(Math.random() * 6) + 1
          setResults(prev => {
            const next = { ...prev, [m.id]: final[m.id] }
            if (Object.keys(next).length === members.length) {
              const maxV = Math.max(...Object.values(next))
              const winIds = Object.entries(next).filter(([,v]) => v === maxV).map(([k]) => k)
              const winId = winIds[Math.floor(Math.random() * winIds.length)]
              const w = members.find(x => x.id === winId)!
              setRolling(false)
              setTimeout(() => onWinner(w), 700)
            }
            return next
          })
        }
      }, 70 + i * 15)
    })
  }

  const maxVal = results && Object.keys(results).length === members.length ? Math.max(...Object.values(results)) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {members.map(m => {
          const val = results[m.id]
          const isTop = val !== undefined && val === maxVal && Object.keys(results).length === members.length
          return (
            <div key={m.id} style={{
              background: 'var(--navy-m)', borderRadius: 12, padding: '14px 10px', textAlign: 'center',
              border: isTop ? '2px solid var(--gold)' : '1px solid rgba(255,255,255,.08)',
              boxShadow: isTop ? '0 0 20px rgba(201,168,76,.3)' : 'none', transition: '.3s',
            }}>
              <div style={{ fontSize: 44 }}>{val ? faces[val - 1] : '🎲'}</div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>{m.name}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold)', minHeight: 32 }}>{val || '-'}</div>
              {isTop && <div style={{ fontSize: 11, color: 'var(--gold)' }}>🏆 최고점!</div>}
            </div>
          )
        })}
      </div>
      <button className="btn-gold" onClick={rollAll} disabled={rolling}>
        {rolling ? '굴리는 중...' : '🎲 모두 굴리기!'}
      </button>
    </div>
  )
}

// ── LADDER GAME ───────────────────────────────────────────────────
function LadderGame({ members, onWinner }: { members: Member[], onWinner: (m: Member) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [winnerStart, setWinnerStart] = useState<number | null>(null)
  const n = members.length
  const rows = Math.max(10, n * 2)

  const bridges = useRef<{ row: number; col: number }[]>([])
  const paths = useRef<number[]>([])

  useEffect(() => {
    const b: { row: number; col: number }[] = []
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 0; col < n - 1; col++) {
        if (!b.some(x => x.row === row && x.col === col - 1) && Math.random() > 0.62) {
          b.push({ row, col }); col++
        }
      }
    }
    bridges.current = b
    paths.current = members.map((_, start) => {
      let col = start
      for (let row = 0; row < rows; row++) {
        if (b.some(x => x.row === row && x.col === col)) col++
        else if (b.some(x => x.row === row && x.col === col - 1)) col--
      }
      return col
    })
    draw(false, null)
  }, [n, rows])

  function draw(rev: boolean, ws: number | null) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = 320, H = 380
    ctx.clearRect(0, 0, W, H)
    const colX = (i: number) => (W / (n + 1)) * (i + 1)
    const rowY = (i: number) => 36 + ((H - 72) / (rows - 1)) * i

    for (let i = 0; i < n; i++) {
      ctx.beginPath(); ctx.moveTo(colX(i), rowY(0)); ctx.lineTo(colX(i), rowY(rows - 1))
      ctx.strokeStyle = 'rgba(201,168,76,.35)'; ctx.lineWidth = 2; ctx.stroke()
    }
    bridges.current.forEach(b => {
      ctx.beginPath(); ctx.moveTo(colX(b.col), rowY(b.row)); ctx.lineTo(colX(b.col + 1), rowY(b.row))
      ctx.strokeStyle = 'rgba(201,168,76,.65)'; ctx.lineWidth = 3; ctx.stroke()
    })
    ctx.textAlign = 'center'
    members.forEach((m, i) => {
      ctx.fillStyle = 'rgba(253,248,239,.8)'
      ctx.font = `bold ${Math.max(9, 13 - n)}px Noto Sans KR, sans-serif`
      ctx.fillText(m.name.slice(0, 3), colX(i), 20)
    })
    if (rev && ws !== null) {
      members.forEach((_, i) => {
        const dest = paths.current[i]
        const isW = i === ws
        ctx.fillStyle = isW ? '#C9A84C' : 'rgba(253,248,239,.3)'
        ctx.font = `${Math.max(9, 12 - n)}px sans-serif`
        ctx.fillText(isW ? '🏆' : '✕', colX(dest), H - 6)
      })
    }
  }

  function reveal() {
    const ws = paths.current.indexOf(0) >= 0 ? paths.current.indexOf(0) : Math.floor(Math.random() * members.length)
    setWinnerStart(ws); setRevealed(true); draw(true, ws)
    setTimeout(() => onWinner(members[ws]), 1000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <canvas ref={canvasRef} width={320} height={380} style={{ width: '100%', borderRadius: 12, background: 'var(--navy-m)' }} />
      {!revealed && <button className="btn-gold" onClick={reveal}>🪜 사다리 공개!</button>}
      {revealed && winnerStart !== null && (
        <div className="bounce-in" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--gold)' }}>🪜 {members[winnerStart].name} 당첨!</div>
        </div>
      )}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────
export default function GameScreen({ roundId, onBack, onDone }: Props) {
  const [round, setRound] = useState<Round | null>(null)
  const [gameType, setGameType] = useState<GameType | null>(null)
  const [pendingWinner, setPendingWinner] = useState<Member | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    setRound(DB.getRound(roundId))
    setGameType(null); setPendingWinner(null); setConfirmed(false)
  }, [roundId])

  if (!round) return null
  const eligible = DB.getMembers(roundId).filter(m => !m.has_won)

  function handleWinner(m: Member) {
    setPendingWinner(m); spawnConfetti()
  }

  function confirm() {
    if (!pendingWinner || !gameType) return
    DB.updateRound(roundId, { winner_id: pendingWinner.id, winner_name: pendingWinner.name, game_type: gameType, status: 'game_played' })
    DB.updateMember(roundId, pendingWinner.id, { has_won: true })
    setConfirmed(true)
    setTimeout(() => onDone(roundId), 1000)
  }

  const GAMES = [
    { type: 'draw' as GameType, emoji: '🎡', label: '룰렛 뽑기', desc: '돌려돌려 룰렛!' },
    { type: 'button' as GameType, emoji: '🔴', label: '버튼 누르기', desc: '마지막 한 명 당첨!' },
    { type: 'dice' as GameType, emoji: '🎲', label: '주사위 굴리기', desc: '높은 숫자가 당첨!' },
    { type: 'ladder' as GameType, emoji: '🪜', label: '사다리 타기', desc: '사다리를 타면?' },
  ]

  const C: React.CSSProperties = { maxWidth: 520, margin: '0 auto' }

  return (
    <main style={{ minHeight: '100vh', padding: '20px 16px 80px' }}>
      <div style={C}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>🎮 게임 룸</h2>
            <div style={{ fontSize: 12, color: 'rgba(253,248,239,.4)', marginTop: 2 }}>
              {round.round_number}판 · {round.month} · 💰{round.amount.toLocaleString()}원
            </div>
          </div>
          <button onClick={onBack} style={{ color: 'rgba(253,248,239,.45)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>← 관리자</button>
        </div>

        {/* Info strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[['참가 가능', eligible.length], ['계금액', `${round.amount.toLocaleString()}원`], ['이미 받음', DB.getMembers(roundId).filter(m => m.has_won).length]].map(([l, v]) => (
            <div key={String(l)} style={{ background: 'var(--navy-m)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)' }}>{v}</div>
              <div style={{ fontSize: 11, color: 'rgba(253,248,239,.4)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {eligible.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36 }}>🎊</div>
            <div style={{ marginTop: 12, color: 'rgba(253,248,239,.5)' }}>모든 참가자가 이미 당첨되었습니다!</div>
          </div>
        )}

        {/* Game select */}
        {!gameType && eligible.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'rgba(253,248,239,.5)', textAlign: 'center' }}>게임을 선택하세요</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {GAMES.map(g => (
                <button key={g.type} onClick={() => setGameType(g.type)} style={{
                  textAlign: 'left', padding: 16, background: 'var(--navy-l)', fontFamily: 'inherit',
                  border: '1px solid rgba(201,168,76,.18)', borderRadius: 14, cursor: 'pointer', transition: '.15s',
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(201,168,76,.18)')}>
                  <div style={{ fontSize: 28 }}>{g.emoji}</div>
                  <div style={{ fontWeight: 700, marginTop: 8 }}>{g.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(253,248,239,.45)', marginTop: 4 }}>{g.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active game */}
        {gameType && !pendingWinner && !confirmed && eligible.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ color: 'var(--gold)', fontSize: 16 }}>
                {GAMES.find(g => g.type === gameType)?.emoji} {GAMES.find(g => g.type === gameType)?.label}
              </h3>
              <button onClick={() => setGameType(null)} style={{ color: 'rgba(253,248,239,.4)', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}>다른 게임</button>
            </div>
            {gameType === 'draw'   && <DrawGame   members={eligible} onWinner={handleWinner} />}
            {gameType === 'button' && <ButtonGame members={eligible} onWinner={handleWinner} />}
            {gameType === 'dice'   && <DiceGame   members={eligible} onWinner={handleWinner} />}
            {gameType === 'ladder' && <LadderGame members={eligible} onWinner={handleWinner} />}
          </div>
        )}

        {/* Winner confirm */}
        {pendingWinner && !confirmed && (
          <div className="card card-glow" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div className="bounce-in" style={{ fontSize: 52 }}>🏆</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)', marginTop: 10 }}>{pendingWinner.name}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold-l)', marginTop: 4 }}>
              💰 {round.amount.toLocaleString()}원
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn-gold" onClick={confirm}>✅ 당첨 확정!</button>
              <button className="btn-ghost" onClick={() => { setPendingWinner(null); setGameType(null) }} style={{ width: 'auto', padding: '12px 16px' }}>
                다시
              </button>
            </div>
          </div>
        )}

        {confirmed && (
          <div className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div style={{ fontSize: 36 }}>✅</div>
            <div style={{ fontWeight: 700, color: 'var(--green)', marginTop: 8 }}>확정 완료! 영수증으로 이동합니다...</div>
          </div>
        )}
      </div>
    </main>
  )
}
