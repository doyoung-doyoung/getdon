'use client'

import { useState, useEffect, useCallback } from 'react'
import { DB } from '@/lib/db'
import { Round, Member, GameType } from '@/types'
import { DdayBadge, DdayText, DdayBar } from '@/components/DDay'
import AdminScreen from './screens/AdminScreen'
import JoinScreen from './screens/JoinScreen'
import GameScreen from './screens/GameScreen'
import ReceiptScreen from './screens/ReceiptScreen'

type Screen = 'home' | 'join' | 'admin' | 'game' | 'receipt'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [gameRoundId, setGameRoundId] = useState<string | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])

  const reload = useCallback(() => setRounds(DB.getRounds()), [])
  useEffect(() => { reload() }, [reload])

  const goGame = (id: string) => { setGameRoundId(id); setScreen('game') }
  const goReceipt = (id: string) => { setGameRoundId(id); setScreen('receipt') }

  const active = rounds.filter(r => r.status === 'collecting_dates' || r.status === 'date_confirmed')

  const NAV: { id: Screen; icon: string; label: string }[] = [
    { id: 'home',    icon: '🏠', label: '홈' },
    { id: 'join',    icon: '📝', label: '참가' },
    { id: 'admin',   icon: '⚙️', label: '관리자' },
    { id: 'receipt', icon: '🧾', label: '영수증' },
  ]

  return (
    <>
      {/* ── HOME ─────────────────────────────────────────── */}
      {screen === 'home' && (
        <main style={{ minHeight: '100vh', padding: '20px 16px 80px' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
              <div style={{ fontSize: 52 }}>💰</div>
              <h1 style={{ fontSize: 38, fontWeight: 900, color: 'var(--gold)', letterSpacing: -1 }}>겟돈</h1>
              <p style={{ color: 'rgba(253,248,239,.4)', fontSize: 13, marginTop: 4 }}>계모임을 스마트하게</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn-gold" onClick={() => setScreen('join')}>📝 모임 참가하기</button>
              <button className="btn-ghost" onClick={() => setScreen('admin')}>⚙️ 관리자 페이지</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
              {[['📅','날짜 투표'],['🎮','4가지 게임'],['🏆','당첨자 선정'],['🧾','PDF 영수증']].map(([i,l]) => (
                <div key={l} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 26 }}>{i}</div>
                  <div style={{ fontSize: 13, marginTop: 6, color: 'rgba(253,248,239,.7)' }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: 'rgba(253,248,239,.4)', marginBottom: 8 }}>현재 활성 판</div>
              {active.length === 0
                ? <div style={{ color: 'rgba(253,248,239,.4)', fontSize: 13 }}>아직 판이 없습니다</div>
                : active.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                      <span style={{ fontWeight: 900, color: 'var(--gold)', fontSize: 14 }}>{r.round_number}판</span>
                      <span style={{ fontSize: 13, color: 'rgba(253,248,239,.6)' }}>{r.month}</span>
                      {r.meeting_date ? <DdayBadge dateStr={r.meeting_date} /> : <span style={{ fontSize: 11, color: 'rgba(253,248,239,.3)' }}>날짜 투표 중</span>}
                    </div>
                  ))
              }
            </div>
          </div>
        </main>
      )}

      {/* ── JOIN ─────────────────────────────────────────── */}
      {screen === 'join' && (
        <JoinScreen onBack={() => setScreen('home')} onRefresh={reload} />
      )}

      {/* ── ADMIN ────────────────────────────────────────── */}
      {screen === 'admin' && (
        <AdminScreen
          onBack={() => setScreen('home')}
          onGoGame={goGame}
          onGoReceipt={goReceipt}
          onRefresh={reload}
        />
      )}

      {/* ── GAME ─────────────────────────────────────────── */}
      {screen === 'game' && gameRoundId && (
        <GameScreen
          roundId={gameRoundId}
          onBack={() => setScreen('admin')}
          onDone={(id) => goReceipt(id)}
        />
      )}

      {/* ── RECEIPT ──────────────────────────────────────── */}
      {screen === 'receipt' && (
        <ReceiptScreen
          roundId={gameRoundId}
          onBack={() => setScreen('admin')}
          onHome={() => setScreen('home')}
        />
      )}

      {/* ── BOTTOM NAV ───────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--navy-l)', borderTop: '1px solid rgba(201,168,76,.2)',
        display: 'flex', zIndex: 100,
      }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setScreen(n.id)} style={{
            flex: 1, padding: '10px 4px 14px', textAlign: 'center', border: 'none', background: 'none', cursor: 'pointer',
            color: screen === n.id ? 'var(--gold)' : 'rgba(253,248,239,.4)', transition: '.2s', fontFamily: 'inherit',
          }}>
            <div style={{ fontSize: 22 }}>{n.icon}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{n.label}</div>
          </button>
        ))}
      </nav>
    </>
  )
}
