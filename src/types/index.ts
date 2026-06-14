export type RoundStatus = 'collecting_dates' | 'date_confirmed' | 'game_played' | 'completed'
export type GameType = 'draw' | 'button' | 'dice' | 'ladder'

export interface Round {
  id: string
  round_number: number
  month: string
  amount: number
  total_members: number
  status: RoundStatus
  meeting_date: string | null
  winner_id: string | null
  winner_name: string | null
  game_type: GameType | null
  password: string | null
  notes: string | null
  created_at: string
}

export interface Member {
  id: string
  round_id: string
  name: string
  available_dates: string[]
  has_won: boolean
  payment_confirmed: boolean
  joined_at: string
}
