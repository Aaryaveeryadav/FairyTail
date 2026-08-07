import { useState } from 'react';
import { Heart, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AuthScreen() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (mode === 'signup') {
      if (!displayName.trim()) {
        setError('Please enter your name');
        setBusy(false);
        return;
      }
      const { error } = await signUp(email, password, displayName.trim());
      if (error) setError(error);
    } else {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 via-cream-100 to-rose-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-300/50 mb-4">
            <Heart className="w-10 h-10 text-white" fill="white" />
          </div>
          <h1 className="font-serif text-4xl text-ink-900 mb-2">Us</h1>
          <p className="text-ink-500 text-sm">A private space, just for two</p>
        </div>

        <div className="glass rounded-3xl shadow-xl shadow-rose-200/30 p-8 border border-white/60">
          <div className="flex gap-2 mb-6 p-1 bg-cream-200/50 rounded-2xl">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-white text-rose-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white text-rose-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-ink-700 mb-1.5">Your Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300 text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300 text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300 text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-2.5 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium shadow-lg shadow-rose-300/40 hover:shadow-rose-400/50 hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? (
                <Sparkles className="w-4 h-4 animate-pulse" />
              ) : (
                <>
                  {mode === 'signin' ? 'Welcome Back' : 'Begin Our Journey'}
                  <Heart className="w-4 h-4" fill="white" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-ink-400 mt-6">
            {mode === 'signin' ? "Don't have an account yet? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-rose-500 font-medium hover:text-rose-600"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}