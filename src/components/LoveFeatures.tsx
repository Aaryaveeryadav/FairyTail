import { useEffect, useState } from 'react';
import { Heart, Target, Mail, Sparkles, Plus, X, Check, Lock, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Mood, MoodType, Goal, LoveLetter, DailyAnswer } from '@/lib/types';

const MOODS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'happy', emoji: '😊', label: 'Happy' },
  { type: 'loved', emoji: '🥰', label: 'Loved' },
  { type: 'excited', emoji: '🤩', label: 'Excited' },
  { type: 'neutral', emoji: '😐', label: 'Okay' },
  { type: 'tired', emoji: '😴', label: 'Tired' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'anxious', emoji: '😰', label: 'Anxious' },
  { type: 'angry', emoji: '😠', label: 'Angry' },
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

type Tab = 'mood' | 'goals' | 'letters' | 'questions';

export function LoveFeatures() {
  const { user, partner, couple } = useAuth();
  const [tab, setTab] = useState<Tab>('mood');
  const [moods, setMoods] = useState<Mood[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [letters, setLetters] = useState<LoveLetter[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const [showWriteLetter, setShowWriteLetter] = useState(false);
  const [letterTitle, setLetterTitle] = useState('');
  const [letterBody, setLetterBody] = useState('');
  const [letterOpenOn, setLetterOpenOn] = useState('');

  const [todayAnswer, setTodayAnswer] = useState('');
  const [myAnswerToday, setMyAnswerToday] = useState<DailyAnswer | null>(null);
  const [partnerAnswerToday, setPartnerAnswerToday] = useState<DailyAnswer | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayQuestion = DAILY_QUESTIONS[new Date().getDate() % DAILY_QUESTIONS.length];

  useEffect(() => {
    if (!couple) return;
    supabase.from('moods').select('*').eq('couple_id', couple.id).order('created_at', { ascending: false }).limit(30).then(({ data }) => setMoods((data as Mood[]) ?? []));
    supabase.from('goals').select('*').eq('couple_id', couple.id).order('created_at', { ascending: false }).then(({ data }) => setGoals((data as Goal[]) ?? []));
    supabase.from('love_letters').select('*').eq('couple_id', couple.id).order('open_on', { ascending: true }).then(({ data }) => setLetters((data as LoveLetter[]) ?? []));
    supabase.from('daily_answers').select('*').eq('couple_id', couple.id).eq('question_date', today).then(({ data }) => {
      if (!data) return;
      setMyAnswerToday((data.find((a) => a.user_id === user?.id) as DailyAnswer) ?? null);
      setPartnerAnswerToday((data.find((a) => a.user_id !== user?.id) as DailyAnswer) ?? null);
    });
  }, [couple, user, today]);

  const addGoal = async () => {
    if (!couple || !user || !goalTitle.trim()) return;
    await supabase.from('goals').insert({
      couple_id: couple.id,
      author_id: user.id,
      title: goalTitle.trim(),
      target_date: goalTarget || null,
    });
    setShowAddGoal(false);
    setGoalTitle('');
    setGoalTarget('');
    supabase.from('goals').select('*').eq('couple_id', couple.id).order('created_at', { ascending: false }).then(({ data }) => setGoals((data as Goal[]) ?? []));
  };

  const toggleGoal = async (goal: Goal) => {
    await supabase.from('goals').update({ completed: !goal.completed, completed_at: !goal.completed ? new Date().toISOString() : null }).eq('id', goal.id);
    setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, completed: !g.completed, completed_at: !g.completed ? new Date().toISOString() : null } : g));
  };

  const sendLetter = async () => {
    if (!couple || !user || !letterTitle.trim() || !letterBody.trim() || !letterOpenOn) return;
    await supabase.from('love_letters').insert({
      couple_id: couple.id,
      author_id: user.id,
      title: letterTitle.trim(),
      body: letterBody.trim(),
      open_on: letterOpenOn,
    });
    setShowWriteLetter(false);
    setLetterTitle('');
    setLetterBody('');
    setLetterOpenOn('');
    supabase.from('love_letters').select('*').eq('couple_id', couple.id).order('open_on', { ascending: true }).then(({ data }) => setLetters((data as LoveLetter[]) ?? []));
  };

  const openLetter = async (letter: LoveLetter) => {
    if (letter.author_id === user?.id) return;
    await supabase.from('love_letters').update({ opened_at: new Date().toISOString() }).eq('id', letter.id);
    setLetters((prev) => prev.map((l) => l.id === letter.id ? { ...l, opened_at: new Date().toISOString() } : l));
  };

  const submitAnswer = async () => {
    if (!couple || !user || !todayAnswer.trim() || myAnswerToday) return;
    const { data } = await supabase.from('daily_answers').insert({
      couple_id: couple.id,
      user_id: user.id,
      question: todayQuestion,
      answer: todayAnswer.trim(),
      question_date: today,
    }).select().single();
    if (data) setMyAnswerToday(data as DailyAnswer);
    setTodayAnswer('');
  };

  const moodEmoji = (m: string) => MOODS.find((mo) => mo.type === m)?.emoji ?? '😐';

  const tabs: { id: Tab; label: string; icon: typeof Heart }[] = [
    { id: 'mood', label: 'Mood', icon: Sparkles },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'letters', label: 'Letters', icon: Mail },
    { id: 'questions', label: 'Daily Q', icon: Heart },
  ];

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <h2 className="font-serif text-2xl text-ink-900">Love Corner</h2>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-rose-500 text-white shadow-sm' : 'bg-white border border-cream-200 text-ink-500'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Mood tracker */}
      {tab === 'mood' && (
        <div className="space-y-3 animate-fade-in">
          <div className="bg-white rounded-2xl border border-cream-200 shadow-sm p-4">
            <h3 className="text-sm font-medium text-ink-700 mb-3">Mood History (Last 30)</h3>
            {moods.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">No mood check-ins yet. Share how you feel from the Home tab!</p>
            ) : (
              <div className="space-y-2">
                {moods.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-cream-50">
                    <span className="text-2xl">{moodEmoji(m.mood)}</span>
                    <div className="flex-1">
                      <p className="text-sm text-ink-700 capitalize">{m.mood}</p>
                      {m.note && <p className="text-xs text-ink-400">{m.note}</p>}
                    </div>
                    <span className="text-xs text-ink-300">{new Date(m.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goals */}
      {tab === 'goals' && (
        <div className="space-y-3 animate-fade-in">
          <button onClick={() => setShowAddGoal(true)} className="w-full p-4 rounded-2xl border-2 border-dashed border-cream-300 text-ink-400 hover:border-rose-300 hover:text-rose-500 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Add a Goal
          </button>
          {goals.map((g) => (
            <div key={g.id} className={`p-4 rounded-2xl border shadow-sm transition-all ${g.completed ? 'bg-rose-50 border-rose-200' : 'bg-white border-cream-200'}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleGoal(g)} className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${g.completed ? 'bg-rose-500 border-rose-500' : 'border-cream-300 hover:border-rose-300'}`}>
                  {g.completed && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${g.completed ? 'text-ink-400 line-through' : 'text-ink-900'}`}>{g.title}</p>
                  {g.target_date && <p className="text-xs text-ink-400 mt-0.5">Target: {new Date(g.target_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
                </div>
              </div>
            </div>
          ))}
          {goals.length === 0 && !showAddGoal && <p className="text-sm text-ink-400 text-center py-6">No goals yet. Dream together!</p>}
        </div>
      )}

      {/* Letters */}
      {tab === 'letters' && (
        <div className="space-y-3 animate-fade-in">
          <button onClick={() => setShowWriteLetter(true)} className="w-full p-4 rounded-2xl border-2 border-dashed border-cream-300 text-ink-400 hover:border-rose-300 hover:text-rose-500 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Write a Love Letter
          </button>
          {letters.map((l) => {
            const canOpen = new Date(l.open_on) <= new Date();
            const isMine = l.author_id === user?.id;
            const opened = !!l.opened_at;
            return (
              <div key={l.id} className={`p-4 rounded-2xl border shadow-sm ${opened ? 'bg-white border-cream-200' : 'bg-gradient-to-br from-rose-50 to-cream-50 border-rose-200'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${opened ? 'bg-cream-100' : 'bg-rose-100'}`}>
                    {opened ? <Mail className="w-5 h-5 text-ink-500" /> : <Lock className="w-5 h-5 text-rose-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-900">{l.title}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {isMine ? 'From you' : `From ${partner?.display_name}`} · Opens {new Date(l.open_on).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {opened ? (
                      <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap font-serif italic">{l.body}</p>
                    ) : canOpen && !isMine ? (
                      <button onClick={() => openLetter(l)} className="mt-2 text-sm text-rose-500 font-medium hover:text-rose-600">Open letter</button>
                    ) : !canOpen ? (
                      <p className="text-xs text-ink-400 mt-2">Sealed until {new Date(l.open_on).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                    ) : (
                      <p className="text-xs text-ink-400 mt-2">Waiting for {partner?.display_name} to open</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Question */}
      {tab === 'questions' && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-300/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium text-rose-100">Today's Question</span>
            </div>
            <p className="font-serif text-lg text-white text-balance">{todayQuestion}</p>
          </div>

          {!myAnswerToday && (
            <div className="space-y-2">
              <label htmlFor="todayAnswer" className="sr-only">Your answer</label>
              <textarea id="todayAnswer" name="todayAnswer" value={todayAnswer} onChange={(e) => setTodayAnswer(e.target.value)} placeholder="Your answer..." rows={3} className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
              <button onClick={submitAnswer} disabled={!todayAnswer.trim()} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium transition-colors disabled:opacity-60">
                Share Answer
              </button>
            </div>
          )}

          {myAnswerToday && (
            <div className="p-4 rounded-2xl bg-white border border-cream-200 shadow-sm">
              <p className="text-xs text-ink-400 mb-1">Your answer</p>
              <p className="text-sm text-ink-800 font-serif italic">{myAnswerToday.answer}</p>
            </div>
          )}

          {partnerAnswerToday && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <p className="text-xs text-ink-400 mb-1">{partner?.display_name}'s answer</p>
              <p className="text-sm text-ink-800 font-serif italic">{partnerAnswerToday.answer}</p>
            </div>
          )}

          {myAnswerToday && !partnerAnswerToday && (
            <p className="text-sm text-ink-400 text-center">Waiting for {partner?.display_name} to answer...</p>
          )}
        </div>
      )}

      {/* Add goal modal */}
      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddGoal(false)}>
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ink-900">New Goal</h3>
              <button onClick={() => setShowAddGoal(false)} className="p-1.5 hover:bg-cream-100 rounded-lg"><X className="w-5 h-5 text-ink-400" /></button>
            </div>
            <div className="space-y-3">
              <label htmlFor="goalTitle" className="sr-only">Goal title</label>
              <input id="goalTitle" name="goalTitle" type="text" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="What do you want to achieve together?" className="w-full px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <label htmlFor="goalTarget" className="sr-only">Goal target date</label>
                <input id="goalTarget" name="goalTarget" type="date" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <button onClick={addGoal} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium">Add Goal</button>
            </div>
          </div>
        </div>
      )}

      {/* Write letter modal */}
      {showWriteLetter && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowWriteLetter(false)}>
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-ink-900">Write a Letter</h3>
              <button onClick={() => setShowWriteLetter(false)} className="p-1.5 hover:bg-cream-100 rounded-lg"><X className="w-5 h-5 text-ink-400" /></button>
            </div>
            <div className="space-y-3">
              <label htmlFor="letterTitle" className="sr-only">Letter title</label>
              <input id="letterTitle" name="letterTitle" type="text" value={letterTitle} onChange={(e) => setLetterTitle(e.target.value)} placeholder="Letter title" className="w-full px-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              <label htmlFor="letterBody" className="sr-only">Letter body</label>
              <textarea id="letterBody" name="letterBody" value={letterBody} onChange={(e) => setLetterBody(e.target.value)} placeholder="Dear..." rows={6} className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-300 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
              <div>
                <label htmlFor="letterOpenOn" className="block text-xs text-ink-500 mb-1">Opens on (your partner can't read until then)</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input id="letterOpenOn" name="letterOpenOn" type="date" value={letterOpenOn} onChange={(e) => setLetterOpenOn(e.target.value)} min={today} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                </div>
              </div>
              <button onClick={sendLetter} disabled={!letterTitle.trim() || !letterBody.trim() || !letterOpenOn} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium disabled:opacity-60">Seal & Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}