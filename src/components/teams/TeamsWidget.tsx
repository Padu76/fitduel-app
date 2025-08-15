interface Team {
  id: string
  name: string
  description: string
  avatar_url: string | null
  type: string
  leader_id: string
  current_members: number
  max_members: number
  total_xp: number
  weekly_xp: number
  is_public: boolean
  is_verified: boolean
  invite_code: string
  created_at: string
  my_role?: string
  my_contribution?: number
}