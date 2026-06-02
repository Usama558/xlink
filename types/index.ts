export type Platform = 'x' | 'linkedin'
export type PostStatus = 'scheduled' | 'published' | 'failed'
export type Tone = 'casual' | 'professional' | 'contrarian' | 'inspirational'

export interface Profile {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  plan: string
  x_connected: boolean
  linkedin_connected: boolean
  niche: string | null
  created_at: string
}

export interface ScheduledPost {
  id: string
  user_id: string
  platform: Platform
  content: string
  scheduled_at: string
  status: PostStatus
  created_at: string
}

export interface SavedPost {
  id: string
  user_id: string
  platform: Platform
  content: string
  format_type: string | null
  created_at: string
}

export interface AnalyticsSnapshot {
  id: string
  user_id: string
  platform: Platform
  impressions: number
  followers_gained: number
  engagement_rate: number
  posts_published: number
  snapshot_date: string
}

export interface PostIdea {
  format: string
  text: string
  reason: string
}

export interface EngagementOpportunity {
  id: string
  avatar: string
  name: string
  handle: string
  snippet: string
  likes: number
  platform: Platform
}
