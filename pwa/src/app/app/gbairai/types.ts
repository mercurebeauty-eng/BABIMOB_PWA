export type Story = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
  content: string | null;
  created_at: string;
  expires_at: string;
};

export type GbairaiPost = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  post_type: 'vibe' | 'tarif' | 'alerte' | 'bouffe' | 'evenement' | 'bon_plan';
  content: string;
  hashtags: string[];
  commune: string | null;
  place_name: string | null;
  lat: number | null;
  lon: number | null;
  metadata: Record<string, any>;
  likes_count: number;
  comments_count: number;
  created_at: string;
};

export type HotSpot = {
  place_id: string;
  place_name: string;
  commune: string | null;
  logo_emoji: string;
  cover_color: string;
  checkin_count: number;
  category: string | null;
  price_range: string | null;
  rating: number | null;
  is_new: boolean;
  friends_count: number;
  lat: number;
  lon: number;
};

export type CollectiveQuest = {
  id: string;
  title: string;
  description: string | null;
  target_count: number;
  current_count: number;
  reward_xp: number;
  reward_badge: string | null;
  ends_at: string;
};

export type Quest = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
  xp_reward: number;
  quest_type: string;
  target_count: number;
};

export type Crew = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color_from: string | null;
  color_to: string | null;
  commune: string | null;
  member_count: number;
  is_member: boolean;
};

export type ReportCategory = 'trafic' | 'incident' | 'travaux' | 'ambiance';

export type CommunePulse = {
  commune: string;
  report_count: number;
  checkin_count: number;
  status: 'vert' | 'orange' | 'rouge';
  top_category: ReportCategory | null;
};

export type Event = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  location_name: string | null;
  price_label: string | null;
  category: string | null;
  image_url: string | null;
};

export type VoiceRoomMode = 'classic' | 'debate' | 'hot_seat' | 'lightning';
export type VoiceCredLevel = 'bronze' | 'silver' | 'gold' | 'legend';
export type ParticipantRole = 'host' | 'speaker' | 'listener';
export type SpeakerRequestStatus = 'pending' | 'approved' | 'rejected';

export type VoiceRoom = {
  id: string;
  title: string;
  creator_id: string | null;
  participants_count: number;
  emoji: string;
  is_live: boolean;
  is_private: boolean;
  room_mode: VoiceRoomMode;
  upvote_threshold: number;
  max_speak_secs: number;
  topic: string | null;
  created_at: string;
};

export type VoiceParticipant = {
  room_id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  role: ParticipantRole;
  is_muted: boolean;
  speak_time_secs: number;
  upvote_score: number;
  joined_at: string;
  invited_by: string | null;
};

export type VoiceRoomComment = {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  content: string;
  upvotes: number;
  host_upvoted: boolean;
  created_at: string;
};

export type VoiceCred = {
  user_id: string;
  total_score: number;
  level: VoiceCredLevel;
  sessions_count: number;
  avg_retention: number;
};

export type VoiceSpeakerRequest = {
  id: string;
  room_id: string;
  user_id: string;
  display_name?: string;
  status: SpeakerRequestStatus;
  created_at: string;
};
