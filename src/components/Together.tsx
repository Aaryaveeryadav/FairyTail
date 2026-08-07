import { useState, useRef, useEffect } from 'react';
import { Youtube, Pencil, Gamepad2, Play, Pause, Search, X, Heart, Eraser, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type Activity = 'youtube' | 'draw' | 'quiz';

const QUIZ_QUESTIONS = [
  'What was your first impression of each other?',
  'What is your favorite date you have been on?',
  'What is the most adventurous thing you want to do together?',
  'What song best describes your relationship?',
  'What is your favorite way to spend a lazy Sunday together?',
  'What is one thing you have learned from your partner?',
  'What is your dream vacation together?',
  'What is the most surprising thing about your relationship?',
  'What is your favorite meal to share together?',
  'What is one goal you share as a couple?',
];

export function Together() {
  const [activity, setActivity] = useState<Activity | null>(null);

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <h2 className="font-serif text-2xl text-ink-900">Together</h2>

      {!activity && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => setActivity('youtube')} className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 border border-rose-200 text-left hover:shadow-lg transition-all group">
            <Youtube className="w-8 h-8 text-rose-500 mb-3" />
            <h3 className="font-medium text-ink-900 mb-1">Watch Together</h3>
            <p className="text-xs text-ink-500">Sync YouTube videos and watch side by side</p>
          </button>
          <button onClick={() => setActivity('draw')} className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 text-left hover:shadow-lg transition-all group">
            <Pencil className="w-8 h-8 text-amber-500 mb-3" />
            <h3 className="font-medium text-ink-900 mb-1">Drawing Board</h3>
            <p className="text-xs text-ink-500">Draw together on a shared canvas in real time</p>
          </button>
          <button onClick={() => setActivity('quiz')} className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 text-left hover:shadow-lg transition-all group">
            <Gamepad2 className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-medium text-ink-900 mb-1">Couple Quiz</h3>
            <p className="text-xs text-ink-500">Answer questions and learn more about each other</p>
          </button>
        </div>
      )}

      {activity === 'youtube' && <YouTubeSync onBack={() => setActivity(null)} />}
      {activity === 'draw' && <DrawingBoard onBack={() => setActivity(null)} />}
      {activity === 'quiz' && <CoupleQuiz onBack={() => setActivity(null)} />}
    </div>
  );
}

function YouTubeSync({ onBack }: { onBack: () => void }) {
  const { partner } = useAuth();
  const [videoId, setVideoId] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [playing, setPlaying] = useState(false);

  const extractId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
  };

  const loadVideo = () => {
    const id = extractId(inputUrl) || inputUrl.trim();
    if (id.length === 11) {
      setVideoId(id);
      setPlaying(true);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-cream-100 rounded-lg"><X className="w-5 h-5 text-ink-400" /></button>
        <h3 className="font-serif text-xl text-ink-900">Watch Together</h3>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <label htmlFor="youtubeUrl" className="sr-only">YouTube URL</label>
          <input id="youtubeUrl" name="youtubeUrl" type="text" value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadVideo()} placeholder="Paste a YouTube link..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <button onClick={loadVideo} className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium">Load</button>
      </div>

      {videoId ? (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video">
            <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`} className="w-full h-full" allow="autoplay; encrypted-media; fullscreen" title="YouTube video" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-cream-200">
            <p className="text-sm text-ink-600 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" /> Watching with {partner?.display_name}
            </p>
            <button onClick={() => setPlaying(!playing)} className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200">
              {playing ? <Pause className="w-4 h-4 text-ink-600" /> : <Play className="w-4 h-4 text-ink-600" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Youtube className="w-12 h-12 text-ink-200 mb-3" />
          <p className="text-sm text-ink-400">Paste a YouTube link above to start watching together</p>
        </div>
      )}
    </div>
  );
}

function DrawingBoard({ onBack }: { onBack: () => void }) {
  const { partner } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState('#e11d48');
  const [size, setSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const colors = ['#e11d48', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#1a1625'];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-cream-100 rounded-lg"><X className="w-5 h-5 text-ink-400" /></button>
          <h3 className="font-serif text-xl text-ink-900">Drawing Board</h3>
        </div>
        <button onClick={clear} className="p-2 bg-cream-100 hover:bg-cream-200 rounded-lg"><Eraser className="w-5 h-5 text-ink-500" /></button>
      </div>

      <div className="flex items-center gap-2">
        {colors.map((c) => (
          <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-ink-400 scale-110' : 'border-cream-200'}`} style={{ backgroundColor: c }} />
        ))}
        <label htmlFor="brushSize" className="sr-only">Brush size</label>
        <input id="brushSize" name="brushSize" type="range" min={1} max={20} value={size} onChange={(e) => setSize(Number(e.target.value))} className="ml-2 flex-1 accent-rose-500" />
      </div>

      <div className="rounded-2xl overflow-hidden border-2 border-cream-200 bg-white">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      <p className="text-xs text-ink-400 text-center">Draw something sweet for {partner?.display_name} 💕</p>
    </div>
  );
}

function CoupleQuiz({ onBack }: { onBack: () => void }) {
  const { partner } = useAuth();
  const [currentQ, setCurrentQ] = useState(0);
  const [myAnswer, setMyAnswer] = useState('');
  const [answers, setAnswers] = useState<Record<number, { mine?: string; theirs?: string }>>({});

  const question = QUIZ_QUESTIONS[currentQ % QUIZ_QUESTIONS.length];

  const submit = () => {
    if (!myAnswer.trim()) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: { ...prev[currentQ], mine: myAnswer } }));
    setMyAnswer('');
  };

  const next = () => {
    setCurrentQ((p) => p + 1);
    setMyAnswer('');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-cream-100 rounded-lg"><X className="w-5 h-5 text-ink-400" /></button>
        <h3 className="font-serif text-xl text-ink-900">Couple Quiz</h3>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200">
        <p className="text-xs text-purple-500 font-medium mb-2">Question {currentQ + 1}</p>
        <p className="font-serif text-lg text-ink-900 text-balance">{question}</p>
      </div>

      {answers[currentQ]?.mine ? (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-white border border-cream-200">
            <p className="text-xs text-ink-400 mb-1">Your answer</p>
            <p className="text-sm text-ink-800 font-serif italic">{answers[currentQ].mine}</p>
          </div>
          {answers[currentQ]?.theirs ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <p className="text-xs text-ink-400 mb-1">{partner?.display_name}'s answer</p>
              <p className="text-sm text-ink-800 font-serif italic">{answers[currentQ].theirs}</p>
            </div>
          ) : (
            <p className="text-sm text-ink-400 text-center">Waiting for {partner?.display_name}...</p>
          )}
          <button onClick={next} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium">Next Question</button>
        </div>
      ) : (
        <div className="space-y-2">
          <label htmlFor="quizAnswer" className="sr-only">Your answer</label>
          <textarea
            id="quizAnswer"
            name="quizAnswer"
            value={myAnswer}
            onChange={(e) => setMyAnswer(e.target.value)}
            placeholder="Your answer..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          />
          <button onClick={submit} disabled={!myAnswer.trim()} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Submit Answer
          </button>
        </div>
      )}
    </div>
  );
}