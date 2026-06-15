'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase, type VoteRow } from '@/lib/supabase'

const NAMES = ['엄마', '도유유', '부채리', '하티지']
const NAME_COLORS: Record<string, string> = {
  '엄마': '#FF6B6B',
  '도유유': '#00C471',
  '부채리': '#4A9EFF',
  '하티지': '#FFB020',
}
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type Votes = Record<string, string[]>

/* ───────────────── date utils ───────────────── */
function getMonthOptions(): string[] {
  const now = new Date()
  const out: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}
function monthShort(ym: string) {
  const [y, m] = ym.split('-')
  return `${y.slice(2)}.${m}`
}
function monthFull(ym: string) {
  const [y, m] = ym.split('-')
  return `${y}년 ${parseInt(m)}월`
}
function daysOf(ym: string): string[] {
  const [y, m] = ym.split('-').map(Number)
  const n = new Date(y, m, 0).getDate()
  const arr: string[] = []
  for (let d = 1; d <= n; d++) arr.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  return arr
}
function firstDow(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).getDay()
}
function fmtKo(s: string) {
  const [, m, d] = s.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}

/* ───────────────── shared green button ───────────────── */
function gbtn(done: boolean): React.CSSProperties {
  return {
    background: done
      ? 'linear-gradient(135deg,#FFB020,#f59e0b)'
      : 'linear-gradient(135deg,#00C471,#00a85e)',
    color: '#fff',
    border: 'none',
    borderRadius: 14,
    padding: '15px 24px',
    fontSize: 16,
    fontWeight: 800,
    cursor: done ? 'default' : 'pointer',
    width: '100%',
    boxShadow: done ? '0 4px 16px rgba(245,158,11,.3)' : '0 4px 16px rgba(0,196,113,.3)',
    transition: 'all .15s',
  }
}

/* ───────────────── Ladder game (SVG) ───────────────── */
function LadderGame({
  count,
  winner,
  onWinner,
}: {
  count: number
  winner: number | null
  onWinner: (i: number) => void
}) {
  const rows = 8
  const [revealed, setRevealed] = useState(false)

  const { bridges, winSlot, winnerStart, path } = useMemo(() => {
    const b: { row: number; col: number }[] = []
    for (let row = 1; row <= rows; row++) {
      for (let col = 0; col < count - 1; col++) {
        if (!b.some(x => x.row === row && x.col === col - 1) && Math.random() > 0.5) {
          b.push({ row, col })
          col++
        }
      }
    }
    const endOf = (start: number) => {
      let c = start
      for (let row = 1; row <= rows; row++) {
        if (b.some(x => x.row === row && x.col === c)) c++
        else if (b.some(x => x.row === row && x.col === c - 1)) c--
      }
      return c
    }
    const ws = Math.floor(Math.random() * count)
    let wstart = 0
    for (let s = 0; s < count; s++) if (endOf(s) === ws) { wstart = s; break }
    const pts: { row: number; col: number }[] = [{ row: 0, col: wstart }]
    let c = wstart
    for (let row = 1; row <= rows; row++) {
      if (b.some(x => x.row === row && x.col === c)) c++
      else if (b.some(x => x.row === row && x.col === c - 1)) c--
      pts.push({ row, col: c })
    }
    pts.push({ row: rows + 1, col: c })
    return { bridges: b, winSlot: ws, winnerStart: wstart, path: pts }
  }, [count])

  const W = 320
  const H = 280
  const colX = (c: number) => (W / (count + 1)) * (c + 1)
  const top = 30
  const bot = H - 28
  const rowY = (r: number) => top + ((bot - top) / (rows + 1)) * r

  function reveal() {
    if (winner !== null) return
    setRevealed(true)
    setTimeout(() => onWinner(winnerStart), 1250)
  }

  const pathD = path.map((p, i) => `${i === 0 ? 'M' : 'L'} ${colX(p.col).toFixed(1)} ${rowY(p.row).toFixed(1)}`).join(' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: 340, background: '#F6FBF8', borderRadius: 16 }}
      >
        {Array.from({ length: count }).map((_, c) => (
          <line key={'v' + c} x1={colX(c)} y1={rowY(0)} x2={colX(c)} y2={rowY(rows + 1)} stroke="#CDE7DA" strokeWidth={3} strokeLinecap="round" />
        ))}
        {bridges.map((b, i) => (
          <line key={'b' + i} x1={colX(b.col)} y1={rowY(b.row)} x2={colX(b.col + 1)} y2={rowY(b.row)} stroke="#A9D9C2" strokeWidth={3} strokeLinecap="round" />
        ))}
        {Array.from({ length: count }).map((_, c) => (
          <text key={'tl' + c} x={colX(c)} y={18} textAnchor="middle" fontSize={13} fontWeight={800} fill="#495057">{c + 1}</text>
        ))}
        {Array.from({ length: count }).map((_, c) => (
          <text key={'bl' + c} x={colX(c)} y={H - 6} textAnchor="middle" fontSize={15} fill="#ADB5BD">{c === winSlot ? '🎉' : '·'}</text>
        ))}
        {revealed && (
          <path d={pathD} fill="none" stroke="#00C471" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
            style={{ strokeDasharray: 1200, strokeDashoffset: 1200, animation: 'gdLadder 1.2s ease forwards' }} />
        )}
      </svg>
      <button style={gbtn(winner !== null)} disabled={winner !== null} onClick={reveal}>
        {winner !== null ? `🏆 ${winner + 1}번 당첨!` : revealed ? '내려가는 중...' : '🪜 사다리 공개'}
      </button>
    </div>
  )
}

/* ───────────────── Button game ───────────────── */
function ButtonGame({
  count,
  winner,
  onWinner,
}: {
  count: number
  winner: number | null
  onWinner: (i: number) => void
}) {
  const [active, setActive] = useState<number | null>(null)
  const [running, setRunning] = useState(false)

  function start() {
    if (running || winner !== null) return
    setRunning(true)
    const target = Math.floor(Math.random() * count)
    const steps = count * 3 + target + Math.floor(Math.random() * count) + 6
    let i = 0
    const run = () => {
      setActive(i % count)
      i++
      if (i >= steps) {
        setActive(target)
        setRunning(false)
        setTimeout(() => onWinner(target), 250)
        return
      }
      const remain = steps - i
      const delay = remain < count ? 70 + (count - remain) * 45 : 65
      setTimeout(run, delay)
    }
    run()
  }

  const cols = Math.min(count, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
        {Array.from({ length: count }).map((_, i) => {
          const isWin = winner === i
          const isActive = active === i && winner === null
          return (
            <div key={i} style={{
              aspectRatio: '1',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              fontWeight: 800,
              border: isWin ? '2px solid #00C471' : isActive ? '2px solid #FFB020' : '2px solid #E9ECEF',
              background: isWin
                ? 'linear-gradient(135deg,#00C471,#00a85e)'
                : isActive ? '#FFF7E6' : '#F8F9FA',
              color: isWin ? '#fff' : '#495057',
              transform: isWin ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform .18s, background .1s',
              boxShadow: isWin ? '0 6px 20px rgba(0,196,113,.35)' : 'none',
            }}>
              <span style={{ fontSize: 20 }}>{isWin ? '🏆' : '🔘'}</span>
              <span style={{ fontSize: 12 }}>{i + 1}번</span>
            </div>
          )
        })}
      </div>
      <button style={gbtn(winner !== null)} disabled={winner !== null} onClick={start}>
        {winner !== null ? `🏆 ${winner + 1}번 당첨!` : running ? '추첨 중...' : '🔘 추첨 시작'}
      </button>
    </div>
  )
}

/* ───────────────── Page ───────────────── */
export default function Home() {
  const monthOptions = useMemo(() => getMonthOptions(), [])
  const [month, setMonth] = useState(monthOptions[0])
  const [name, setName] = useState<string | null>(null)
  const [votes, setVotes] = useState<Votes>({})
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)

  const [count, setCount] = useState(4)
  const [gameType, setGameType] = useState<'ladder' | 'button'>('ladder')
  const [winner, setWinner] = useState<number | null>(null)
  const [gameKey, setGameKey] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 선택한 월의 투표를 Supabase에서 로드 + Realtime 구독
  useEffect(() => {
    let alive = true
    setLoading(true)

    async function load() {
      const { data, error } = await supabase
        .from('getdon_votes')
        .select('date, name')
        .eq('month', month)
      if (!alive) return
      if (error) {
        console.error('투표 로드 실패:', error.message)
        setLoading(false)
        return
      }
      const v: Votes = {}
      ;(data as Pick<VoteRow, 'date' | 'name'>[]).forEach(({ date, name }) => {
        if (!v[date]) v[date] = []
        if (!v[date].includes(name)) v[date].push(name)
      })
      setVotes(v)
      setLoading(false)
    }
    load()

    // 같은 월 변경사항만 실시간 반영
    const channel = supabase
      .channel(`getdon_votes_${month}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'getdon_votes', filter: `month=eq.${month}` },
        payload => {
          setVotes(prev => {
            const next: Votes = { ...prev }
            if (payload.eventType === 'INSERT') {
              const { date, name } = payload.new as VoteRow
              const arr = next[date] ? [...next[date]] : []
              if (!arr.includes(name)) arr.push(name)
              next[date] = arr
            } else if (payload.eventType === 'DELETE') {
              const { date, name } = payload.old as VoteRow
              if (next[date]) {
                const arr = next[date].filter(n => n !== name)
                if (arr.length) next[date] = arr
                else delete next[date]
              }
            }
            return next
          })
        }
      )
      .subscribe()

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [month])

  // 투표 토글 — Supabase에 즉시 반영 (낙관적 업데이트 + 실패 시 롤백)
  const toggleVote = async (date: string) => {
    if (!name) return
    const has = (votes[date] || []).includes(name)

    // 낙관적 업데이트
    setVotes(prev => {
      const v: Votes = { ...prev }
      const arr = v[date] ? [...v[date]] : []
      const idx = arr.indexOf(name)
      if (idx >= 0) arr.splice(idx, 1)
      else arr.push(name)
      if (arr.length) v[date] = arr
      else delete v[date]
      return v
    })

    if (has) {
      const { error } = await supabase
        .from('getdon_votes')
        .delete()
        .eq('date', date)
        .eq('name', name)
      if (error) {
        console.error('투표 취소 실패:', error.message)
        // 롤백
        setVotes(prev => {
          const v: Votes = { ...prev }
          const arr = v[date] ? [...v[date]] : []
          if (!arr.includes(name)) arr.push(name)
          v[date] = arr
          return v
        })
      }
    } else {
      const { error } = await supabase
        .from('getdon_votes')
        .insert({ month, date, name })
      if (error) {
        console.error('투표 실패:', error.message)
        // 롤백
        setVotes(prev => {
          const v: Votes = { ...prev }
          const arr = (v[date] || []).filter(n => n !== name)
          if (arr.length) v[date] = arr
          else delete v[date]
          return v
        })
      }
    }
  }

  const resetVotes = async () => {
    if (!confirm('이 달의 모든 투표를 초기화할까요? (모든 참가자 투표가 삭제됩니다)')) return
    const prev = votes
    setVotes({}) // 낙관적
    const { error } = await supabase
      .from('getdon_votes')
      .delete()
      .eq('month', month)
    if (error) {
      console.error('초기화 실패:', error.message)
      setVotes(prev) // 롤백
    }
  }

  const resetGame = () => { setWinner(null); setGameKey(k => k + 1) }
  const changeCount = (n: number) => { setCount(n); setWinner(null); setGameKey(k => k + 1) }
  const changeType = (t: 'ladder' | 'button') => { setGameType(t); setWinner(null); setGameKey(k => k + 1) }

  // 최다 선택일 자동 확정
  const confirmed = useMemo(() => {
    if (!mounted) return null
    let best: { date: string; count: number } | null = null
    for (const d of daysOf(month)) {
      const c = (votes[d] || []).length
      if (c > 0 && (!best || c > best.count)) best = { date: d, count: c }
    }
    return best
  }, [mounted, month, votes])

  const fdow = firstDow(month)
  const days = daysOf(month)
  const totalCells = Math.ceil((fdow + days.length) / 7) * 7

  return (
    <main style={styles.main}>
      <style>{`
        @keyframes gdLadder { to { stroke-dashoffset: 0; } }
        @keyframes gdPop { 0% { transform: scale(.7); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* 헤더 */}
      <div style={styles.header}>
        <div style={styles.logo}>💰</div>
        <h1 style={styles.title}>겟돈</h1>
        <p style={styles.subtitle}>날짜 정하고 게임까지 한 번에</p>
      </div>

      {/* 캘린더 카드 */}
      <section style={styles.card}>
        <div style={styles.cardLabelRow}>
          <span style={styles.cardLabel}>📅 모임 날짜 정하기</span>
          {mounted && (
            <span style={styles.liveBadge}>
              <span style={styles.liveDot} />실시간
            </span>
          )}
        </div>

        {/* 월 선택 */}
        <div style={styles.monthRow}>
          {monthOptions.map(ym => {
            const on = month === ym
            return (
              <button key={ym} onClick={() => setMonth(ym)} style={{
                ...styles.monthBtn,
                background: on ? '#00C471' : '#F1F3F5',
                color: on ? '#fff' : '#868E96',
                fontWeight: on ? 800 : 600,
              }}>{monthShort(ym)}</button>
            )
          })}
        </div>

        {/* 이름 선택 */}
        <div style={styles.nameRow}>
          {NAMES.map(n => {
            const on = name === n
            return (
              <button key={n} onClick={() => setName(on ? null : n)} style={{
                ...styles.nameBtn,
                background: on ? NAME_COLORS[n] : '#fff',
                color: on ? '#fff' : '#495057',
                border: `2px solid ${on ? NAME_COLORS[n] : '#E9ECEF'}`,
              }}>{n}</button>
            )
          })}
        </div>
        <p style={styles.hint}>
          {name
            ? <><b style={{ color: NAME_COLORS[name] }}>{name}</b>님 — 가능한 날짜를 모두 눌러주세요 (여러 명 중복 가능)</>
            : '이름을 먼저 선택하세요'}
        </p>

        {/* 달력 */}
        <div style={styles.weekRow}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} style={{ ...styles.weekCell, color: i === 0 ? '#FF6B6B' : i === 6 ? '#4A9EFF' : '#ADB5BD' }}>{w}</div>
          ))}
        </div>
        <div style={{ ...styles.grid, opacity: loading ? 0.5 : 1, transition: 'opacity .2s' }}>
          {Array.from({ length: totalCells }).map((_, i) => {
            const di = i - fdow
            if (di < 0 || di >= days.length) return <div key={'e' + i} style={{ aspectRatio: '1' }} />
            const date = days[di]
            const d = di + 1
            const list = votes[date] || []
            const cnt = list.length
            const mine = !!name && list.includes(name)
            const isConfirmed = !!confirmed && confirmed.date === date
            const dow = (fdow + di) % 7

            let bg = '#fff'
            let border = '2px solid #EEF1F3'
            let numColor = dow === 0 ? '#FF6B6B' : dow === 6 ? '#4A9EFF' : '#343A40'
            if (isConfirmed) { bg = 'linear-gradient(135deg,#00C471,#00a85e)'; border = '2px solid #00C471'; numColor = '#fff' }
            else if (mine) { bg = '#E9FBF3'; border = `2px solid ${name ? NAME_COLORS[name] : '#00C471'}` }
            else if (cnt > 0) { bg = '#F6FBF8'; border = '2px solid #CDE7DA' }

            return (
              <button key={date} onClick={() => toggleVote(date)} disabled={!name} style={{
                ...styles.dayCell,
                background: bg,
                border,
                cursor: name ? 'pointer' : 'default',
                opacity: name ? 1 : 0.85,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1, color: numColor }}>{d}</span>
                {isConfirmed && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>확정</span>}
                {cnt > 0 && (
                  <span style={{
                    ...styles.cntBadge,
                    background: isConfirmed ? 'rgba(255,255,255,.3)' : '#00C471',
                  }}>{cnt}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* 확정 배너 */}
        {confirmed ? (
          <div style={styles.confirmBanner}>
            <div>
              <div style={styles.confirmBadge}>📌 자동 확정</div>
              <div style={styles.confirmDate}>{monthFull(month).split(' ')[1]} {fmtKo(confirmed.date)}</div>
            </div>
            <div style={styles.confirmCount}>{confirmed.count}명</div>
          </div>
        ) : (
          <div style={styles.emptyBanner}>{loading ? '불러오는 중...' : '아직 선택된 날짜가 없어요'}</div>
        )}

        <button style={styles.resetVotesBtn} onClick={resetVotes}>이 달 투표 초기화</button>
      </section>

      {/* 게임 카드 */}
      <section style={styles.card}>
        <div style={styles.cardLabel}>🎮 게임 (당첨자 1명)</div>

        {/* 인원수 */}
        <div style={styles.countWrap}>
          <span style={styles.countLabel}>인원수</span>
          <div style={styles.stepper}>
            <button style={styles.stepBtn} onClick={() => count > 2 && changeCount(count - 1)} disabled={count <= 2}>−</button>
            <span style={styles.countNum}>{count}명</span>
            <button style={styles.stepBtn} onClick={() => count < 10 && changeCount(count + 1)} disabled={count >= 10}>+</button>
          </div>
        </div>

        {/* 게임 종류 */}
        <div style={styles.gameTabs}>
          <button onClick={() => changeType('ladder')} style={{
            ...styles.gameTab,
            background: gameType === 'ladder' ? '#00C471' : '#F1F3F5',
            color: gameType === 'ladder' ? '#fff' : '#868E96',
          }}>🪜 사다리타기</button>
          <button onClick={() => changeType('button')} style={{
            ...styles.gameTab,
            background: gameType === 'button' ? '#00C471' : '#F1F3F5',
            color: gameType === 'button' ? '#fff' : '#868E96',
          }}>🔘 버튼누르기</button>
        </div>

        {/* 게임 영역 */}
        <div style={{ marginTop: 4 }}>
          {gameType === 'ladder'
            ? <LadderGame key={'l' + gameKey + count} count={count} winner={winner} onWinner={setWinner} />
            : <ButtonGame key={'b' + gameKey + count} count={count} winner={winner} onWinner={setWinner} />}
        </div>

        {/* 당첨 결과 */}
        {winner !== null && (
          <div style={styles.winBanner}>
            <div style={{ fontSize: 32 }}>🎊</div>
            <div style={styles.winText}><b>{winner + 1}번</b>이 당첨되었어요!</div>
            <button style={styles.againBtn} onClick={resetGame}>다시 하기</button>
          </div>
        )}
      </section>

      <p style={styles.footer}>© 2025 겟돈</p>
    </main>
  )
}

/* ───────────────── styles ───────────────── */
const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    background: 'linear-gradient(170deg,#f0fdf8 0%,#fafafa 55%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '28px 14px 40px',
    gap: 16,
  },
  header: { textAlign: 'center', marginBottom: 4 },
  logo: { fontSize: 46, lineHeight: 1, filter: 'drop-shadow(0 4px 12px rgba(0,196,113,.3))' },
  title: { fontSize: 34, fontWeight: 900, color: '#111', letterSpacing: '-1px', marginTop: 6 },
  subtitle: { fontSize: 14, color: '#868E96', fontWeight: 500, marginTop: 4 },
  card: {
    width: '100%',
    maxWidth: 440,
    background: '#fff',
    borderRadius: 22,
    boxShadow: '0 6px 30px rgba(0,0,0,.06)',
    padding: '20px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  cardLabel: { fontSize: 16, fontWeight: 800, color: '#212529' },
  cardLabelRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  liveBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 700, color: '#00C471',
    background: '#E9FBF3', borderRadius: 20, padding: '3px 9px',
  },
  liveDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#00C471',
    boxShadow: '0 0 0 0 rgba(0,196,113,.6)',
    animation: 'gdPop 1s ease',
  },
  // 월
  monthRow: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 },
  monthBtn: { borderRadius: 10, padding: '9px 0', fontSize: 12, border: 'none', cursor: 'pointer', transition: 'all .12s' },
  // 이름
  nameRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 },
  nameBtn: { borderRadius: 12, padding: '11px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .12s' },
  hint: { fontSize: 12.5, color: '#868E96', textAlign: 'center', lineHeight: 1.5 },
  // 달력
  weekRow: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 },
  weekCell: { textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '2px 0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 },
  dayCell: {
    aspectRatio: '1',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    position: 'relative',
    padding: 2,
    transition: 'all .1s',
  },
  cntBadge: {
    fontSize: 9,
    fontWeight: 800,
    color: '#fff',
    borderRadius: 8,
    padding: '0 5px',
    lineHeight: 1.5,
    minWidth: 16,
    textAlign: 'center',
  },
  confirmBanner: {
    background: 'linear-gradient(135deg,#00C471,#00a85e)',
    borderRadius: 16,
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 6px 20px rgba(0,196,113,.25)',
  },
  confirmBadge: { fontSize: 11, color: 'rgba(255,255,255,.85)', fontWeight: 700 },
  confirmDate: { fontSize: 19, fontWeight: 900, color: '#fff', marginTop: 2 },
  confirmCount: { fontSize: 22, fontWeight: 900, color: '#fff' },
  emptyBanner: {
    textAlign: 'center', color: '#ADB5BD', fontSize: 13,
    background: '#F8F9FA', borderRadius: 14, padding: '16px 0',
  },
  resetVotesBtn: {
    background: 'none', border: '1px solid #E9ECEF', borderRadius: 10,
    padding: '8px 0', fontSize: 12, color: '#ADB5BD', cursor: 'pointer',
  },
  // 게임
  countWrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  countLabel: { fontSize: 14, fontWeight: 700, color: '#495057' },
  stepper: { display: 'flex', alignItems: 'center', gap: 14, background: '#F1F3F5', borderRadius: 12, padding: '6px 10px' },
  stepBtn: {
    width: 32, height: 32, borderRadius: 9, border: 'none', background: '#fff',
    fontSize: 20, fontWeight: 800, color: '#00C471', cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,.08)',
  },
  countNum: { fontSize: 16, fontWeight: 800, color: '#212529', minWidth: 42, textAlign: 'center' },
  gameTabs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  gameTab: { borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all .12s' },
  winBanner: {
    background: '#E9FBF3',
    border: '1px solid #A7F3D0',
    borderRadius: 16,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    textAlign: 'center',
    animation: 'gdPop .35s ease',
  },
  winText: { fontSize: 17, color: '#065F46', fontWeight: 600 },
  againBtn: {
    background: '#fff', border: '1px solid #00C471', color: '#00C471',
    borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  footer: { fontSize: 12, color: '#CED4DA', marginTop: 8 },
}
