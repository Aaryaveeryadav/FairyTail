import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  Briefcase,
  Car,
  Check,
  Clock,
  Heart,
  Loader2,
  Moon,
  Music,
  Play,
  Sparkles,
  Wifi,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type RelationshipStatusType =
  | 'online'
  | 'sleeping'
  | 'listening'
  | 'watching'
  | 'studying'
  | 'working'
  | 'traveling'
  | 'thinking';

type MoodType =
  | 'happy'
  | 'loved'
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'excited'
  | 'tired'
  | 'neutral';

interface RelationshipStatusRow {
  user_id: string;
  couple_id: string;
  status: RelationshipStatusType;
  custom_message: string | null;
  is_online: boolean;
  last_active: string;
  updated_at: string;
}

interface MoodRow {
  id: string;
  couple_id: string;
  user_id: string;
  mood: MoodType;
  note: string | null;
  created_at: string;
}

interface RelationshipStatusProps {
  compact?: boolean;
}

const STATUS_OPTIONS: {
  value: RelationshipStatusType;
  label: string;
  emoji: string;
}[] = [
  {
    value: 'online',
    label: 'Online',
    emoji: '🟢',
  },
  {
    value: 'sleeping',
    label: 'Sleeping',
    emoji: '💤',
  },
  {
    value: 'listening',
    label: 'Listening to music',
    emoji: '🎧',
  },
  {
    value: 'watching',
    label: 'Watching something',
    emoji: '🎬',
  },
  {
    value: 'studying',
    label: 'Studying',
    emoji: '📚',
  },
  {
    value: 'working',
    label: 'Working',
    emoji: '💼',
  },
  {
    value: 'traveling',
    label: 'Traveling',
    emoji: '🚗',
  },
  {
    value: 'thinking',
    label: 'Thinking of you',
    emoji: '❤️',
  },
];

const MOOD_OPTIONS: {
  value: MoodType;
  label: string;
  emoji: string;
}[] = [
  {
    value: 'happy',
    label: 'Happy',
    emoji: '😊',
  },
  {
    value: 'loved',
    label: 'Loved',
    emoji: '🥰',
  },
  {
    value: 'sad',
    label: 'Sad',
    emoji: '😔',
  },
  {
    value: 'anxious',
    label: 'Anxious',
    emoji: '😟',
  },
  {
    value: 'angry',
    label: 'Angry',
    emoji: '😡',
  },
  {
    value: 'excited',
    label: 'Excited',
    emoji: '🤩',
  },
  {
    value: 'tired',
    label: 'Tired',
    emoji: '😴',
  },
  {
    value: 'neutral',
    label: 'Okay',
    emoji: '😐',
  },
];

function getStatusInfo(status: RelationshipStatusType) {
  return (
    STATUS_OPTIONS.find(
      (item) => item.value === status
    ) ?? STATUS_OPTIONS[0]
  );
}

function getMoodInfo(mood: MoodType | null) {
  if (!mood) return null;

  return (
    MOOD_OPTIONS.find(
      (item) => item.value === mood
    ) ?? null
  );
}

function formatLastActive(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  const diff =
    Date.now() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 30) {
    return 'Just now';
  }

  if (minutes < 1) {
    return `${seconds}s ago`;
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export function RelationshipStatus({
  compact = false,
}: RelationshipStatusProps) {
  const {
    user,
    profile,
    partner,
    couple,
  } = useAuth();

  const [myStatus, setMyStatus] =
    useState<RelationshipStatusRow | null>(null);

  const [partnerStatus, setPartnerStatus] =
    useState<RelationshipStatusRow | null>(null);

  const [myMood, setMyMood] =
    useState<MoodRow | null>(null);

  const [partnerMood, setPartnerMood] =
    useState<MoodRow | null>(null);

  const [showStatusMenu, setShowStatusMenu] =
    useState(false);

  const [showMoodMenu, setShowMoodMenu] =
    useState(false);

  const [savingStatus, setSavingStatus] =
    useState(false);

  const [savingMood, setSavingMood] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ==========================================
   * LOAD STATUS
   * ==========================================
   */

  const loadStatuses = async () => {
    if (!user || !couple) return;

    const { data, error: statusError } =
      await supabase
        .from('relationship_status')
        .select('*')
        .eq('couple_id', couple.id);

    if (statusError) {
      console.error(
        'Failed to load relationship status:',
        statusError
      );

      setError(statusError.message);

      return;
    }

    const rows =
      (data ?? []) as RelationshipStatusRow[];

    setMyStatus(
      rows.find(
        (row) => row.user_id === user.id
      ) ?? null
    );

    if (partner?.id) {
      setPartnerStatus(
        rows.find(
          (row) => row.user_id === partner.id
        ) ?? null
      );
    }
  };

  /*
   * ==========================================
   * LOAD MOODS
   * ==========================================
   */

  const loadMoods = async () => {
    if (!user || !couple) return;

    const { data, error: moodError } =
      await supabase
        .from('moods')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(20);

    if (moodError) {
      console.error(
        'Failed to load moods:',
        moodError
      );

      return;
    }

    const rows = (data ?? []) as MoodRow[];

    setMyMood(
      rows.find(
        (row) => row.user_id === user.id
      ) ?? null
    );

    if (partner?.id) {
      setPartnerMood(
        rows.find(
          (row) => row.user_id === partner.id
        ) ?? null
      );
    }
  };

  /*
   * ==========================================
   * INITIAL LOAD
   * ==========================================
   */

  useEffect(() => {
    if (!user || !couple) return;

    loadStatuses();
    loadMoods();
  }, [
    user?.id,
    couple?.id,
    partner?.id,
  ]);

  /*
   * ==========================================
   * REALTIME STATUS
   * ==========================================
   */

  useEffect(() => {
    if (!couple) return;

    const channel =
      supabase
        .channel(
          `relationship-status-${couple.id}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'relationship_status',
            filter: `couple_id=eq.${couple.id}`,
          },
          () => {
            loadStatuses();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id]);

  /*
   * ==========================================
   * REALTIME MOOD
   * ==========================================
   */

  useEffect(() => {
    if (!couple) return;

    const channel =
      supabase
        .channel(
          `relationship-moods-${couple.id}`
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'moods',
            filter: `couple_id=eq.${couple.id}`,
          },
          () => {
            loadMoods();
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id]);

  /*
   * ==========================================
   * UPDATE MY STATUS
   * ==========================================
   */

  const updateStatus = async (
    status: RelationshipStatusType
  ) => {
    if (!user || !couple) return;

    setSavingStatus(true);
    setError(null);

    const now =
      new Date().toISOString();

    const { error: updateError } =
      await supabase
        .from('relationship_status')
        .upsert(
          {
            user_id: user.id,
            couple_id: couple.id,
            status,
            is_online: true,
            last_active: now,
            updated_at: now,
          },
          {
            onConflict: 'user_id',
          }
        );

    if (updateError) {
      console.error(
        'Failed to update status:',
        updateError
      );

      setError(updateError.message);
    } else {
      setShowStatusMenu(false);

      await loadStatuses();
    }

    setSavingStatus(false);
  };

  /*
   * ==========================================
   * UPDATE MY MOOD
   * ==========================================
   */

  const updateMood = async (
    mood: MoodType
  ) => {
    if (!user || !couple) return;

    setSavingMood(true);
    setError(null);

    const { error: moodError } =
      await supabase
        .from('moods')
        .insert({
          couple_id: couple.id,
          user_id: user.id,
          mood,
        });

    if (moodError) {
      console.error(
        'Failed to update mood:',
        moodError
      );

      setError(moodError.message);
    } else {
      setShowMoodMenu(false);

      await loadMoods();
    }

    setSavingMood(false);
  };

  /*
   * ==========================================
   * HEARTBEAT / ONLINE TRACKING
   * ==========================================
   */

  useEffect(() => {
    if (!user || !couple) return;

    const updatePresence = async () => {
      const now =
        new Date().toISOString();

      await supabase
        .from('relationship_status')
        .upsert(
          {
            user_id: user.id,
            couple_id: couple.id,
            status:
              myStatus?.status ?? 'online',
            is_online: true,
            last_active: now,
            updated_at: now,
          },
          {
            onConflict: 'user_id',
          }
        );
    };

    updatePresence();

    const interval =
      window.setInterval(
        updatePresence,
        60_000
      );

    const handleVisibility = () => {
      if (
        document.visibilityState ===
        'visible'
      ) {
        updatePresence();
      }
    };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {
      window.clearInterval(interval);

      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );
    };
  }, [
    user?.id,
    couple?.id,
  ]);

  /*
   * ==========================================
   * CALCULATED PARTNER ONLINE
   * ==========================================
   */

  const partnerIsOnline =
    useMemo(() => {
      if (!partnerStatus) return false;

      const lastActive =
        new Date(
          partnerStatus.last_active
        ).getTime();

      const age =
        Date.now() - lastActive;

      /*
       * Consider online if active within
       * the last 2 minutes.
       */

      return (
        partnerStatus.is_online &&
        age < 2 * 60 * 1000
      );
    }, [
      partnerStatus,
    ]);

  const partnerStatusInfo =
    getStatusInfo(
      partnerStatus?.status ??
        'online'
    );

  const partnerMoodInfo =
    getMoodInfo(
      partnerMood?.mood ?? null
    );

  const myStatusInfo =
    getStatusInfo(
      myStatus?.status ?? 'online'
    );

  /*
   * ==========================================
   * NO PARTNER
   * ==========================================
   */

  if (!partner) {
    return null;
  }

  /*
   * ==========================================
   * COMPACT VERSION
   * ==========================================
   */

  if (compact) {
    return (
      <div
        className="
          relative
          rounded-2xl
          bg-white
          border
          border-cream-200
          p-4
          shadow-sm
        "
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="
                w-11
                h-11
                rounded-full
                bg-gradient-to-br
                from-rose-300
                to-rose-500
                flex
                items-center
                justify-center
                text-white
                font-semibold
              "
            >
              {partner.display_name
                ?.charAt(0)
                .toUpperCase() ?? '?'}
            </div>

            {partnerIsOnline && (
              <span
                className="
                  absolute
                  right-0
                  bottom-0
                  w-3
                  h-3
                  rounded-full
                  bg-emerald-500
                  border-2
                  border-white
                "
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink-900">
              {partner.display_name}
            </p>

            <p className="text-xs text-ink-400">
              {partnerIsOnline
                ? `${partnerStatusInfo.emoji} ${partnerStatusInfo.label}`
                : `Last active ${formatLastActive(
                    partnerStatus?.last_active ??
                      new Date().toISOString()
                  )}`}
            </p>
          </div>

          {partnerMoodInfo && (
            <span className="text-xl">
              {partnerMoodInfo.emoji}
            </span>
          )}
        </div>
      </div>
    );
  }

  /*
   * ==========================================
   * FULL CARD
   * ==========================================
   */

  return (
    <div className="space-y-4">
      {/* PARTNER CARD */}

      <div
        className="
          rounded-3xl
          bg-white
          border
          border-cream-200
          shadow-sm
          overflow-hidden
        "
      >
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* AVATAR */}

              <div className="relative">
                <div
                  className="
                    w-14
                    h-14
                    rounded-2xl
                    bg-gradient-to-br
                    from-rose-300
                    to-rose-500
                    flex
                    items-center
                    justify-center
                    text-white
                    text-lg
                    font-semibold
                    shadow-sm
                  "
                >
                  {partner.display_name
                    ?.charAt(0)
                    .toUpperCase() ?? '?'}
                </div>

                {/* ONLINE DOT */}

                {partnerIsOnline && (
                  <span
                    className="
                      absolute
                      right-[-2px]
                      bottom-[-2px]
                      w-4
                      h-4
                      rounded-full
                      bg-emerald-500
                      border-[3px]
                      border-white
                      animate-pulse
                    "
                  />
                )}
              </div>

              <div>
                <h3 className="font-serif text-xl text-ink-900">
                  ❤️ {partner.display_name}
                </h3>

                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`
                      w-2
                      h-2
                      rounded-full
                      ${
                        partnerIsOnline
                          ? 'bg-emerald-500'
                          : 'bg-ink-300'
                      }
                    `}
                  />

                  <span className="text-xs text-ink-400">
                    {partnerIsOnline
                      ? 'Online'
                      : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <Activity className="w-5 h-5 text-rose-400" />
          </div>

          {/* CURRENTLY */}

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">
              Currently
            </p>

            <div
              className="
                flex
                items-center
                gap-3
                rounded-2xl
                bg-cream-50
                border
                border-cream-100
                px-4
                py-3
              "
            >
              <span className="text-2xl">
                {partnerStatusInfo.emoji}
              </span>

              <div>
                <p className="text-sm font-medium text-ink-800">
                  {partnerStatusInfo.label}
                </p>

                {partnerStatus?.custom_message && (
                  <p className="text-xs text-ink-400 mt-0.5">
                    {partnerStatus.custom_message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* MOOD */}

          {partnerMoodInfo && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider text-ink-400 mb-2">
                Mood
              </p>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-2xl
                  bg-rose-50
                  border
                  border-rose-100
                  px-4
                  py-3
                "
              >
                <span className="text-2xl">
                  {partnerMoodInfo.emoji}
                </span>

                <div>
                  <p className="text-sm font-medium text-ink-800">
                    {partnerMoodInfo.label}
                  </p>

                  {partnerMood?.note && (
                    <p className="text-xs text-ink-400 mt-0.5">
                      {partnerMood.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LAST ACTIVE */}

          <div className="flex items-center gap-2 mt-4 text-xs text-ink-400">
            <Clock className="w-3.5 h-3.5" />

            <span>
              {partnerIsOnline
                ? 'Active now'
                : `Last active ${formatLastActive(
                    partnerStatus?.last_active ??
                      new Date().toISOString()
                  )}`}
            </span>
          </div>
        </div>
      </div>

      {/* MY STATUS */}

      <div
        className="
          rounded-3xl
          bg-white
          border
          border-cream-200
          p-5
          shadow-sm
        "
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-ink-900">
              Your Status
            </p>

            <p className="text-xs text-ink-400 mt-0.5">
              Let your partner know what you're doing.
            </p>
          </div>

          <Sparkles className="w-5 h-5 text-rose-400" />
        </div>

        {/* STATUS BUTTON */}

        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setShowStatusMenu(
                (value) => !value
              )
            }
            disabled={savingStatus}
            className="
              w-full
              flex
              items-center
              gap-3
              rounded-2xl
              bg-cream-50
              border
              border-cream-200
              px-4
              py-3
              text-left
              hover:bg-cream-100
              transition-colors
            "
          >
            <span className="text-2xl">
              {myStatusInfo.emoji}
            </span>

            <span className="flex-1">
              <span className="block text-sm font-medium text-ink-800">
                {myStatusInfo.label}
              </span>

              <span className="block text-xs text-ink-400 mt-0.5">
                Tap to change
              </span>
            </span>

            {savingStatus ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <span className="text-ink-300">
                ↓
              </span>
            )}
          </button>

          {showStatusMenu && (
            <div
              className="
                absolute
                left-0
                right-0
                top-full
                mt-2
                z-30
                rounded-2xl
                bg-white
                border
                border-cream-200
                shadow-xl
                p-2
              "
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateStatus(
                        option.value
                      )
                    }
                    className="
                      w-full
                      flex
                      items-center
                      gap-3
                      px-3
                      py-2.5
                      rounded-xl
                      text-left
                      hover:bg-cream-50
                      transition-colors
                    "
                  >
                    <span className="text-xl">
                      {option.emoji}
                    </span>

                    <span className="flex-1 text-sm text-ink-800">
                      {option.label}
                    </span>

                    {myStatus?.status ===
                      option.value && (
                      <Check className="w-4 h-4 text-rose-500" />
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* MOOD */}

        <div className="mt-4">
          <button
            type="button"
            onClick={() =>
              setShowMoodMenu(
                (value) => !value
              )
            }
            disabled={savingMood}
            className="
              w-full
              flex
              items-center
              gap-3
              rounded-2xl
              bg-rose-50
              border
              border-rose-100
              px-4
              py-3
              text-left
              hover:bg-rose-100
              transition-colors
            "
          >
            <span className="text-2xl">
              {getMoodInfo(
                myMood?.mood ?? null
              )?.emoji ?? '😊'}
            </span>

            <span className="flex-1">
              <span className="block text-sm font-medium text-ink-800">
                {getMoodInfo(
                  myMood?.mood ?? null
                )?.label ?? 'Set your mood'}
              </span>

              <span className="block text-xs text-ink-400 mt-0.5">
                Tap to change mood
              </span>
            </span>

            {savingMood ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <span className="text-ink-300">
                ↓
              </span>
            )}
          </button>

          {showMoodMenu && (
            <div
              className="
                mt-2
                grid
                grid-cols-2
                gap-2
              "
            >
              {MOOD_OPTIONS.map(
                (option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateMood(
                        option.value
                      )
                    }
                    className="
                      flex
                      items-center
                      gap-2
                      p-3
                      rounded-xl
                      bg-white
                      border
                      border-cream-200
                      hover:border-rose-200
                      hover:bg-rose-50
                      transition-all
                    "
                  >
                    <span className="text-xl">
                      {option.emoji}
                    </span>

                    <span className="text-xs font-medium text-ink-700">
                      {option.label}
                    </span>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            className="
              mt-4
              rounded-xl
              bg-rose-50
              border
              border-rose-100
              text-rose-600
              text-xs
              p-3
            "
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}