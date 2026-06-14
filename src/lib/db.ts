import { Round, Member } from '@/types'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function safe<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function save(key: string, val: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(val))
}

export const DB = {
  // ── Rounds ─────────────────────────────────────────────
  getRounds(): Round[] {
    return safe<Round[]>('gd_rounds', [])
  },
  getRound(id: string): Round | null {
    return this.getRounds().find(r => r.id === id) ?? null
  },
  saveRounds(rounds: Round[]) {
    save('gd_rounds', rounds)
  },
  createRound(data: Omit<Round, 'id' | 'created_at'>): Round {
    const round: Round = { ...data, id: uid(), created_at: new Date().toISOString() }
    const rounds = this.getRounds()
    rounds.push(round)
    this.saveRounds(rounds)
    return round
  },
  updateRound(id: string, patch: Partial<Round>) {
    const rounds = this.getRounds().map(r => r.id === id ? { ...r, ...patch } : r)
    this.saveRounds(rounds)
  },
  deleteRound(id: string) {
    this.saveRounds(this.getRounds().filter(r => r.id !== id))
    localStorage.removeItem('gd_members_' + id)
  },

  // ── Members ────────────────────────────────────────────
  getMembers(roundId: string): Member[] {
    return safe<Member[]>('gd_members_' + roundId, [])
  },
  saveMembers(roundId: string, members: Member[]) {
    save('gd_members_' + roundId, members)
  },
  addMember(roundId: string, data: Omit<Member, 'id' | 'round_id' | 'joined_at'>): Member {
    const member: Member = { ...data, id: uid(), round_id: roundId, joined_at: new Date().toISOString() }
    const members = this.getMembers(roundId)
    members.push(member)
    this.saveMembers(roundId, members)
    return member
  },
  updateMember(roundId: string, memberId: string, patch: Partial<Member>) {
    const members = this.getMembers(roundId).map(m => m.id === memberId ? { ...m, ...patch } : m)
    this.saveMembers(roundId, members)
  },
  removeMember(roundId: string, memberId: string) {
    this.saveMembers(roundId, this.getMembers(roundId).filter(m => m.id !== memberId))
  },

  // ── D-day ──────────────────────────────────────────────
  calcDday(dateStr: string | null): number | null {
    if (!dateStr) return null
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / 86400000)
  },

  nextRoundNumber(): number {
    const rounds = this.getRounds()
    return rounds.length ? Math.max(...rounds.map(r => r.round_number)) + 1 : 1
  },
}
