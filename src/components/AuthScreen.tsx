import { useState } from 'react';
import {
  Heart,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

function CuteLamp({
  onToggle,
}: {
  onToggle: (on: boolean) => void;
}) {
  const [lampOn, setLampOn] = useState(false);
  const [pulling, setPulling] = useState(false);

  const handlePull = () => {
    if (pulling) return;

    setPulling(true);

    setTimeout(() => {
      const nextState = !lampOn;
      setLampOn(nextState);
      onToggle(nextState);
    }, 180);

    setTimeout(() => {
      setPulling(false);
    }, 500);
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Lamp glow */}
      <div
        className={`
          absolute
          top-20
          left-1/2
          -translate-x-1/2
          w-72
          h-72
          rounded-full
          pointer-events-none
          transition-all
          duration-700
          ${
            lampOn
              ? 'bg-amber-300/30 blur-[80px] scale-125 opacity-100'
              : 'bg-transparent opacity-0'
          }
        `}
      />

      <svg
        width="280"
        height="400"
        viewBox="0 0 200 300"
        className="relative z-10 overflow-visible"
      >
        {/* Extra glow */}
        {lampOn && (
          <ellipse
            cx="100"
            cy="105"
            rx="90"
            ry="65"
            fill="#ffd86b"
            opacity="0.16"
            filter="blur(18px)"
          />
        )}

        {/* Lamp shade */}
        <path
          d="M30 110 C30 50, 170 50, 170 110 C170 125, 30 125, 30 110 Z"
          fill={lampOn ? '#fffdf0' : '#3d414b'}
          className="transition-all duration-500"
          style={{
            filter: lampOn
              ? 'drop-shadow(0 0 25px rgba(255,220,120,0.9))'
              : 'none',
          }}
        />

        {/* Inner warm light */}
        {lampOn && (
          <ellipse
            cx="100"
            cy="105"
            rx="60"
            ry="35"
            fill="#ffe29a"
            opacity="0.45"
            filter="blur(10px)"
          />
        )}

        {/* Lamp stem */}
        <rect
          x="92"
          y="110"
          width="16"
          height="150"
          rx="8"
          fill={lampOn ? '#aaa395' : '#555963'}
          className="transition-all duration-500"
        />

        {/* Lamp base */}
        <rect
          x="60"
          y="250"
          width="80"
          height="12"
          rx="6"
          fill={lampOn ? '#aaa395' : '#555963'}
          className="transition-all duration-500"
        />

        {/* Pull cord */}
        <line
          x1="130"
          y1="110"
          x2="130"
          y2={pulling ? '205' : '180'}
          stroke={lampOn ? '#aaa395' : '#6b6f78'}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-200"
        />

        {/* Cord bead */}
        <circle
          cx="130"
          cy={pulling ? '215' : '190'}
          r="7"
          fill="#e2b52f"
          className="transition-all duration-200"
          style={{
            filter: pulling
              ? 'drop-shadow(0 0 8px rgba(255,210,70,0.8))'
              : 'none',
          }}
        />

        {/* Invisible clickable area */}
        <circle
          cx="130"
          cy={pulling ? '215' : '190'}
          r="28"
          fill="transparent"
          onClick={handlePull}
          className="cursor-pointer"
        />

        {/* Light rays */}
        {lampOn && (
          <g
            stroke="#ffd166"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          >
            <line x1="55" y1="135" x2="38" y2="152" />
            <line x1="65" y1="150" x2="52" y2="174" />
            <line x1="145" y1="135" x2="162" y2="152" />
            <line x1="135" y1="150" x2="148" y2="174" />
          </g>
        )}
      </svg>

      {/* Instruction */}
      <p
        className={`
          mt-2
          text-sm
          transition-all
          duration-500
          ${
            lampOn
              ? 'text-amber-200'
              : 'text-gray-500'
          }
        `}
      >
        {lampOn
          ? 'Pull the cord again to turn off'
          : 'Pull the cord to turn on'}
      </p>
    </div>
  );
}

export function AuthScreen() {
  const { signUp, signIn } = useAuth();

  const [mode, setMode] =
    useState<'signin' | 'signup'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [busy, setBusy] = useState(false);

  const [lampOn, setLampOn] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError(null);
    setBusy(true);

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setError('Please enter your name');
        setBusy(false);
        return;
      }

      const { error } = await signUp(
        email,
        password,
        displayName.trim()
      );

      if (error) {
        setError(error);
      }
    } else {
      const { error } = await signIn(
        email,
        password
      );

      if (error) {
        setError(error);
      }
    }

    setBusy(false);
  };

  return (
    <div
      className="
        relative
        min-h-screen
        flex
        items-center
        justify-center
        overflow-hidden
        px-4
        bg-[#08090d]
        transition-colors
        duration-700
      "
    >
      {/* =========================================
          BACKGROUND GLOW
      ========================================== */}

      <div
        className={`
          absolute
          inset-0
          pointer-events-none
          transition-all
          duration-1000
          ${
            lampOn
              ? 'bg-[radial-gradient(circle_at_50%_42%,rgba(255,205,90,0.18),transparent_48%)] opacity-100'
              : 'opacity-0'
          }
        `}
      />

      <div
        className={`
          absolute
          top-0
          left-0
          w-96
          h-96
          rounded-full
          blur-3xl
          transition-all
          duration-1000
          ${
            lampOn
              ? 'bg-amber-300/10 opacity-100'
              : 'bg-transparent opacity-0'
          }
        `}
      />

      <div
        className={`
          absolute
          bottom-0
          right-0
          w-96
          h-96
          rounded-full
          blur-3xl
          transition-all
          duration-1000
          ${
            lampOn
              ? 'bg-rose-500/10 opacity-100'
              : 'bg-transparent opacity-0'
          }
        `}
      />

      {/* =========================================
          MAIN LAYOUT
      ========================================== */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-6xl
          flex
          flex-col
          lg:flex-row
          items-center
          justify-center
          gap-8
          lg:gap-16
        "
      >
        {/* =========================================
            LAMP
        ========================================== */}

        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            min-h-[420px]
            lg:min-h-[500px]
          "
        >
          <CuteLamp onToggle={setLampOn} />
        </div>

        {/* =========================================
            LOGIN SIDE
        ========================================== */}

        <div
          className={`
            relative
            w-full
            max-w-md
            transition-all
            duration-700
            ease-out
            ${
              lampOn
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
            }
          `}
        >
          {/* =====================================
              LOGO
          ====================================== */}

          <div className="text-center mb-8">
            <div
              className="
                inline-flex
                items-center
                justify-center
                w-20
                h-20
                rounded-3xl
                bg-gradient-to-br
                from-rose-400
                to-rose-600
                shadow-lg
                shadow-rose-500/30
                mb-4
              "
            >
              <Heart
                className="w-10 h-10 text-white"
                fill="white"
              />
            </div>

            <h1
              className="
                font-serif
                text-4xl
                text-white
                mb-2
              "
            >
              Us
            </h1>

            <p className="text-gray-400 text-sm">
              A private space, just for two
            </p>
          </div>

          {/* =====================================
              AUTH CARD
          ====================================== */}

          <div
            className="
              rounded-3xl
              p-8
              border
              border-white/10
              bg-white/[0.06]
              backdrop-blur-2xl
              shadow-2xl
              shadow-black/40
            "
          >
            {/* SIGN IN / SIGN UP */}

            <div
              className="
                flex
                gap-2
                mb-6
                p-1
                bg-white/[0.06]
                rounded-2xl
              "
            >
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className={`
                  flex-1
                  py-2.5
                  rounded-xl
                  text-sm
                  font-medium
                  transition-all
                  ${
                    mode === 'signin'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`
                  flex-1
                  py-2.5
                  rounded-xl
                  text-sm
                  font-medium
                  transition-all
                  ${
                    mode === 'signup'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }
                `}
              >
                Create Account
              </button>
            </div>

            {/* =====================================
                FORM
            ====================================== */}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* NAME */}

              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="displayName"
                    className="
                      block
                      text-sm
                      font-medium
                      text-gray-300
                      mb-1.5
                    "
                  >
                    Your Name
                  </label>

                  <div className="relative">
                    <UserIcon
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        -translate-y-1/2
                        w-4
                        h-4
                        text-gray-500
                      "
                    />

                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) =>
                        setDisplayName(
                          e.target.value
                        )
                      }
                      placeholder="Alex"
                      className="
                        w-full
                        pl-10
                        pr-4
                        py-3
                        rounded-xl
                        bg-white/[0.06]
                        border
                        border-white/10
                        text-white
                        placeholder:text-gray-600
                        focus:outline-none
                        focus:ring-2
                        focus:ring-rose-400/40
                        focus:border-rose-400
                        transition-all
                      "
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-300
                    mb-1.5
                  "
                >
                  Email
                </label>

                <div className="relative">
                  <Mail
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2
                      w-4
                      h-4
                      text-gray-500
                    "
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    className="
                      w-full
                      pl-10
                      pr-4
                      py-3
                      rounded-xl
                      bg-white/[0.06]
                      border
                      border-white/10
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:ring-2
                      focus:ring-rose-400/40
                      focus:border-rose-400
                      transition-all
                    "
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="password"
                  className="
                    block
                    text-sm
                    font-medium
                    text-gray-300
                    mb-1.5
                  "
                >
                  Password
                </label>

                <div className="relative">
                  <Lock
                    className="
                      absolute
                      left-3.5
                      top-1/2
                      -translate-y-1/2
                      w-4
                      h-4
                      text-gray-500
                    "
                  />

                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="
                      w-full
                      pl-10
                      pr-4
                      py-3
                      rounded-xl
                      bg-white/[0.06]
                      border
                      border-white/10
                      text-white
                      placeholder:text-gray-600
                      focus:outline-none
                      focus:ring-2
                      focus:ring-rose-400/40
                      focus:border-rose-400
                      transition-all
                    "
                  />
                </div>
              </div>

              {/* ERROR */}

              {error && (
                <div
                  className="
                    text-sm
                    text-rose-300
                    bg-rose-500/10
                    border
                    border-rose-500/20
                    rounded-xl
                    px-4
                    py-2.5
                  "
                >
                  {error}
                </div>
              )}

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={busy}
                className="
                  w-full
                  py-3
                  rounded-xl
                  bg-gradient-to-r
                  from-rose-500
                  to-rose-600
                  text-white
                  font-medium
                  shadow-lg
                  shadow-rose-500/20
                  hover:shadow-rose-500/40
                  hover:from-rose-600
                  hover:to-rose-700
                  transition-all
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >
                {busy ? (
                  <Sparkles
                    className="
                      w-4
                      h-4
                      animate-pulse
                    "
                  />
                ) : (
                  <>
                    {mode === 'signin'
                      ? 'Welcome Back'
                      : 'Begin Our Journey'}

                    <Heart
                      className="w-4 h-4"
                      fill="white"
                    />
                  </>
                )}
              </button>
            </form>

            {/* SWITCH MODE */}

            <p
              className="
                text-center
                text-xs
                text-gray-500
                mt-6
              "
            >
              {mode === 'signin'
                ? "Don't have an account yet? "
                : 'Already have an account? '}

              <button
                type="button"
                onClick={() => {
                  setMode(
                    mode === 'signin'
                      ? 'signup'
                      : 'signin'
                  );

                  setError(null);
                }}
                className="
                  text-rose-400
                  font-medium
                  hover:text-rose-300
                  transition-colors
                "
              >
                {mode === 'signin'
                  ? 'Create one'
                  : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}