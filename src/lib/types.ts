export interface Couple {
  id: string;
  start_date: string;
  anniversary_date: string | null;
  invite_code: string;
  theme: { primary: string; accent: string; [key: string]: string };
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  couple_id: string | null;
  partner_id: string | null;
  created_at: string;
}

export type MessageType = 'text' | 'photo' | 'voice' | 'sticker' | 'gif';

export interface Message {
  id: string;
  couple_id: string;
  sender_id: string;
  type: MessageType;
  content: string | null;
  file_url: string | null;
  read_at: string | null;
  created_at: string;
}

export type MemoryType = 'photo' | 'video' | 'note' | 'voice';

export interface Memory {
  id: string;
  couple_id: string;
  author_id: string;
  type: MemoryType;
  title: string | null;
  description: string | null;
  file_url: string | null;
  memory_date: string;
  created_at: string;
}

export type CalendarEventType = 'plan' | 'birthday' | 'reminder' | 'schedule';

export interface CalendarEvent {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  type: CalendarEventType;
  created_at: string;
}

export type MoodType = 'happy' | 'loved' | 'sad' | 'anxious' | 'angry' | 'excited' | 'tired' | 'neutral';

export interface Mood {
  id: string;
  couple_id: string;
  user_id: string;
  mood: MoodType;
  note: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  description: string | null;
  completed: boolean;
  target_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface LoveLetter {
  id: string;
  couple_id: string;
  author_id: string;
  title: string;
  body: string;
  open_on: string;
  opened_at: string | null;
  created_at: string;
}

export interface DailyAnswer {
  id: string;
  couple_id: string;
  user_id: string;
  question: string;
  answer: string;
  question_date: string;
  created_at: string;
}

export interface Location {
  id: string;
  couple_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  battery_level: number | null;
  sharing_enabled: boolean;
  updated_at: string;
}

