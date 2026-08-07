import { useEffect, useState } from 'react';
import { Heart, Clock, CalendarHeart, Smile, Sparkles, Sun, Moon, Cloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Mood, MoodType, CalendarEvent } from '@/lib/types';

const MOODS: { type: MoodType; emoji: string; label: string; color: string }[] = [
  { type: 'happy', emoji: '😊', label: 'Happy', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { type: 'loved', emoji: '🥰', label: 'Loved', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { type: 'excited', emoji: '🤩', label: 'Excited', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { type: 'neutral', emoji: '😐', label: 'Okay', color: 'bg-ink-100 text-ink-600 border-ink-200' },
  { type: 'tired', emoji: '😴', label: 'Tired', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { type: 'anxious', emoji: '😰', label: 'Anxious', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { type: 'angry', emoji: '😠', label: 'Angry', color: 'bg-red-100 text-red-700 border-red-200' },
];

const DAILY_QUESTIONS = [
  'What was your favorite moment together?',
  'What do you love most about your partner today?',
  'What are you looking forward to doing together?',
  'What made you smile today?',
  'What is one small thing your partner did that you appreciated?',
  'If you could teleport anywhere together right now, where would you go?',
  'What song reminds you of your partner?',
  'What is a new adventure you want to share?',
  'What are you grateful for in your relationship?',
  'What is your favorite memory from this week?',
];

function getGreeting(hour: number): { text: string; icon: typeof Sun } {
  if (hour < 5) return { text: 'Good night', icon: Moon };
  if (hour < 12) return { text: 'Good morning', icon: Sun };
  if (hour < 17) return { text: 'Good afternoon', icon: Cloud };
  if (hour < 21) return { text: 'Good evening', icon: Sun };
  return { text: 'Good night', icon: Moon };
}

function calcDuration(startDate?: string | null) {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  return { years, days: remainingDays, totalDays: days, hours, minutes, seconds };
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  target.setFullYear(now.getFullYear());
  if (target.getTime() < now.getTime()) target.setFullYear(now.getFullYear() + 1);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function Dashboard() {
  const { user, profile, partner, couple } = useAuth();
  const [duration, setDuration] = useState(() => (couple?.start_date ? calcDuration(couple.start_date) : null));
  const [todayMood, setTodayMood] = useState<Mood | null>(null);
  const [partnerMood, setPartnerMood] = useState<Mood | null>(null);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  useEffect(() => {
      if (!couple?.start_date) return;
    const interval = setInterval(() => setDuration(calcDuration(couple.start_date)), 1000);
    return () => clearInterval(interval);
  }, [couple]);

  useEffect(() => {
    if (!couple || !user) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('moods')
      .select('*')
      .eq('couple_id', couple.id)
      .gte('created_at', today + 'T00:00:00')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const mine = data.find((m) => m.user_id === user.id);
        const theirs = data.find((m) => m.user_id !== user.id);
        setTodayMood(mine as Mood | null);
        setPartnerMood(theirs as Mood | null);
      });

    supabase
      .from('calendar_events')
      .select('*')
      .eq('couple_id', couple.id)
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(3)
      .then(({ data }) => setUpcoming((data as CalendarEvent[]) ?? []));
  }, [couple, user]);

  const saveMood = async (moodType: MoodType) => {
    if (!couple || !user) return;
    setSelectedMood(moodType);
    const { data } = await supabase
      .from('moods')
      .insert({ couple_id: couple.id, user_id: user.id, mood: moodType, note: moodNote || null })
      .select()
      .single();
    if (data) {
      setTodayMood(data as Mood);
      setShowMoodPicker(false);
      setMoodNote('');
    }
  };

  if (!couple || !duration) return null;

  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
  const GreetingIcon = greeting.icon;
  const anniversaryCountdown = couple.anniversary_date ? daysUntil(couple.anniversary_date) : null;
  const todayQuestion = DAILY_QUESTIONS[new Date().getDate() % DAILY_QUESTIONS.length];
  const partnerMoodInfo = partnerMood ? MOODS.find((m) => m.type === partnerMood.mood) : null;
  const myMoodInfo = todayMood ? MOODS.find((m) => m.type === todayMood.mood) : null;

  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
          <GreetingIcon className="w-6 h-6 text-rose-500" />
        </div>
        <div>
          <p className="text-ink-400 text-sm">{greeting.text},</p>
          <h1 className="font-serif text-2xl text-ink-900">{profile?.display_name}</h1>
        </div>
      </div>

      {/* Relationship Timer */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 p-6 text-white shadow-xl shadow-rose-300/40">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5" fill="white" />
            <span className="text-sm font-medium text-rose-50">Together for</span>
          </div>
          <div className="flex items-end gap-4 mb-3">
            {duration.years > 0 && (
              <div>
                <span className="font-serif text-4xl font-bold">{duration.years}</span>
                <span className="text-sm text-rose-100 ml-1">{duration.years === 1 ? 'year' : 'years'}</span>
              </div>
            )}
            <div>
              <span className="font-serif text-4xl font-bold">{duration.days}</span>
              <span className="text-sm text-rose-100 ml-1">days</span>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-rose-100 font-mono">
            <span>{String(duration.hours).padStart(2, '0')}h</span>
            <span>{String(duration.minutes).padStart(2, '0')}m</span>
            <span>{String(duration.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      </div>

      {/* Mood & Anniversary row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Mood check-in */}
        <button
          onClick={() => setShowMoodPicker(true)}
          className="p-5 rounded-2xl bg-white border border-cream-300 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-2 mb-2">
            <Smile className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-medium text-ink-500">How are you?</span>
          </div>
          {myMoodInfo ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{myMoodInfo.emoji}</span>
              <span className="text-sm text-ink-700">{myMoodInfo.label}</span>
            </div>
          ) : (
            <p className="text-sm text-ink-400">Tap to check in</p>
          )}
        </button>

        {/* Anniversary countdown */}
        <div className="p-5 rounded-2xl bg-white border border-cream-300 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CalendarHeart className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-medium text-ink-500">Anniversary</span>
          </div>
          {anniversaryCountdown !== null ? (
            <p className="text-sm text-ink-700">
              <span className="font-serif text-xl font-bold text-rose-600">{anniversaryCountdown}</span> days away
            </p>
          ) : (
            <p className="text-sm text-ink-400">Not set yet</p>
          )}
        </div>
      </div>

      {/* Partner's mood */}
      {partnerMoodInfo && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-cream-50 border border-rose-100 animate-slide-up">
          <p className="text-sm text-ink-600">
            <span className="font-medium">{partner?.display_name}</span> is feeling{' '}
            <span className="text-lg">{partnerMoodInfo.emoji}</span>{' '}
            <span className="font-medium text-rose-600">{partnerMoodInfo.label}</span>
            {partnerMood?.note && <span className="text-ink-500"> — "{partnerMood.note}"</span>}
          </p>
        </div>
      )}

      {/* Daily Question */}
      <div className="p-5 rounded-2xl bg-white border border-cream-300 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-medium text-ink-500">Daily Question</span>
        </div>
        <p className="font-serif text-lg text-ink-900 mb-3 text-balance">{todayQuestion}</p>
        <p className="text-xs text-ink-400">Answer together in the Love tab</p>
      </div>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-cream-300 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-medium text-ink-500">Coming Up</span>
          </div>
          <div className="space-y-2.5">
            {upcoming.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between">
                <span className="text-sm text-ink-700">{ev.title}</span>
                <span className="text-xs text-ink-400">
                  {new Date(ev.event_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood picker modal */}
      {showMoodPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowMoodPicker(false)}>
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-xl text-ink-900 mb-4">How are you feeling?</h3>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {MOODS.map((m) => (
                <button
                  key={m.type}
                  onClick={() => saveMood(m.type)}
                  className={`p-3 rounded-2xl border transition-all hover:scale-105 ${selectedMood === m.type ? m.color + ' ring-2 ring-rose-300' : 'bg-cream-50 border-cream-200'}`}
                >
                  <div className="text-2xl mb-1">{m.emoji}</div>
                  <div className="text-xs text-ink-600">{m.label}</div>
                </button>
              ))}
            </div>
            <label htmlFor="moodNote" className="sr-only">Mood note</label>
            <input
              id="moodNote"
              name="moodNote"
              type="text"
              value={moodNote}
              onChange={(e) => setMoodNote(e.target.value)}
              placeholder="Add a note (optional)"
              className="w-full px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}