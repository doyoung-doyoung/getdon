// localStorage 키 상수
export const KEYS = {
  ADMIN_MONTH: 'getdon_admin_month',       // "2025-07" 형태
  CONFIRMED_DATE: 'getdon_confirmed_date', // "2025-07-15" 형태
  MEMBER_VOTES: 'getdon_member_votes',     // { "2025-07-15": ["이름1","이름2"], ... }
  MY_VOTES: 'getdon_my_votes',             // { "홍길동": ["2025-07-15", ...] }
} as const

export function getAdminMonth(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEYS.ADMIN_MONTH)
}

export function setAdminMonth(month: string) {
  localStorage.setItem(KEYS.ADMIN_MONTH, month)
}

export function getConfirmedDate(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(KEYS.CONFIRMED_DATE)
}

export function setConfirmedDate(date: string | null) {
  if (date === null) {
    localStorage.removeItem(KEYS.CONFIRMED_DATE)
  } else {
    localStorage.setItem(KEYS.CONFIRMED_DATE, date)
  }
}

export function getMemberVotes(): Record<string, string[]> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(KEYS.MEMBER_VOTES) || '{}')
  } catch {
    return {}
  }
}

export function setMemberVotes(votes: Record<string, string[]>) {
  localStorage.setItem(KEYS.MEMBER_VOTES, JSON.stringify(votes))
}

// 날짜 포맷: "2025-07-15" → "7월 15일"
export function formatDateKo(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}월 ${parseInt(d)}일`
}

// 해당 월의 모든 날짜 배열 반환
export function getDaysInMonth(yearMonth: string): string[] {
  const [year, month] = yearMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const days: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return days
}

// 해당 월 1일의 요일 (0=일, 1=월 ...)
export function getFirstDayOfWeek(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number)
  return new Date(year, month - 1, 1).getDay()
}
