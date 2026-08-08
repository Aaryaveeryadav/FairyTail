import { useState, type ComponentType } from 'react';
import { Heart, LogOut } from 'lucide-react';

import {
  AuthProvider,
  useAuth,
} from '@/lib/auth';

import { AuthScreen } from '@/components/AuthScreen';
import { PartnerLinking } from '@/components/PartnerLinking';
import { ThinkingOfYouListener } from '@/components/ThinkingOfYouListener';

import { Dashboard } from '@/components/Dashboard';
import { Chat } from '@/components/Chat';
import { Memories } from '@/components/Memories';
import { Calendar as CalendarView } from '@/components/CalendarView';
import { LoveFeatures } from '@/components/LoveFeatures';
import { LocationView } from '@/components/LocationView';
import { Together } from '@/components/Together';
import { VideoCall } from '@/components/VideoCall';

import {
  TABS,
  type TabId,
} from '@/components/nav';

/* =========================================================
   APP CONTENT
   ========================================================= */

function AppContent() {
  const {
    user,
    profile,
    partner,
    couple,
    loading,
    profileError,
    signOut,
  } = useAuth();

  /* =======================================================
     ACTIVE TAB
     ======================================================= */

  const [activeTab, setActiveTab] = useState<TabId>('home');

  /* =======================================================
     PARTNER INITIAL
     ======================================================= */

  const partnerInitial =
    partner?.display_name?.charAt(0).toUpperCase() ?? '?';

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-lg">
            <Heart
              className="w-7 h-7 text-white"
              fill="white"
            />
          </div>

          <div className="text-center">
            <h1 className="font-serif text-2xl text-ink-900">
              Us
            </h1>

            <p className="text-sm text-ink-500 mt-1">
              Loading your private space...
            </p>
          </div>

          <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT LOGGED IN
     ======================================================= */

  if (!user) {
    return <AuthScreen />;
  }

  /* =======================================================
     PARTNER LINKING
     ======================================================= */

  if (!couple || !profile?.partner_id) {
    return <PartnerLinking />;
  }

  /* =======================================================
     COMPONENT MAP
     ======================================================= */

  const componentMap: Record<TabId, ComponentType> = {
    home: Dashboard,
    chat: Chat,
    memories: Memories,
    calendar: CalendarView,
    love: LoveFeatures,
    location: LocationView,
    together: Together,
    video: VideoCall,
  };

  const ActiveComponent = componentMap[activeTab];

  /* =======================================================
     MAIN APPLICATION
     ======================================================= */

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900 flex flex-col">

      {/* ===================================================
          THINKING OF YOU LISTENER

          This stays active while the user is inside the app.
          It listens for a Thinking of You event from the
          partner through Supabase Realtime.
          =================================================== */}

      <ThinkingOfYouListener />

      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="sticky top-0 z-40 glass border-b border-cream-200">

        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* BRAND */}

          <div className="flex items-center gap-2">

            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-sm">

              <Heart
                className="w-4 h-4 text-white"
                fill="white"
              />

            </div>

            <span className="font-serif text-lg text-ink-900">
              Us
            </span>

          </div>

          {/* USER / PARTNER */}

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-1.5">

              {/* CURRENT USER */}

              <div
                className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center text-white text-xs font-medium"
                title={profile?.display_name ?? 'You'}
              >
                {profile?.display_name
                  ?.charAt(0)
                  .toUpperCase() ?? '?'}
              </div>

              {/* PARTNER */}

              <div
                className="w-7 h-7 rounded-full bg-gradient-to-br from-ink-300 to-ink-500 flex items-center justify-center text-white text-xs font-medium -ml-3 ring-2 ring-cream-100"
                title={partner?.display_name ?? 'Partner'}
              >
                {partnerInitial}
              </div>

            </div>

            {/* SIGN OUT */}

            <button
              type="button"
              onClick={() => {
                void signOut();
              }}
              className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-ink-400" />
            </button>

          </div>

        </div>

      </header>

      {/* ===================================================
          PROFILE ERROR
          =================================================== */}

      {profileError && (
        <div className="max-w-2xl mx-auto w-full px-4 py-3">

          <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 p-4 text-sm">

            <div className="font-medium mb-1">
              Something went wrong
            </div>

            <div>
              {profileError}
            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          MAIN CONTENT
          =================================================== */}

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-24">

        <ActiveComponent />

      </main>

      {/* ===================================================
          BOTTOM NAVIGATION
          =================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-cream-200">

        <div className="max-w-2xl mx-auto px-2 py-2">

          <div className="flex items-center justify-around">

            {TABS.map((tab) => {

              const Icon = tab.icon;

              const active = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex
                    flex-col
                    items-center
                    gap-0.5
                    px-2
                    py-1.5
                    rounded-xl
                    transition-all
                    min-w-[3rem]
                    ${
                      active
                        ? 'text-rose-600'
                        : 'text-ink-400 hover:text-ink-600'
                    }
                  `}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                >

                  <Icon
                    className={`
                      w-5
                      h-5
                      transition-transform
                      ${
                        active
                          ? 'scale-110'
                          : ''
                      }
                    `}
                    fill={
                      active
                        ? 'currentColor'
                        : 'none'
                    }
                  />

                  <span className="text-[10px] font-medium">
                    {tab.label}
                  </span>

                </button>
              );

            })}

          </div>

        </div>

      </nav>

    </div>
  );
}

/* =========================================================
   ROOT APP
   ========================================================= */

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;