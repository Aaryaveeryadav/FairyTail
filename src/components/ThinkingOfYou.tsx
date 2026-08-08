import { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface ThinkingEvent {
  id: string;
  couple_id: string;
  sender_id: string;
  created_at: string;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('en', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ThinkingOfYou() {
  const { user, partner, couple } = useAuth();

  const [history, setHistory] = useState<ThinkingEvent[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const partnerName = partner?.display_name ?? 'your partner';

  /*
   * Load today's Thinking of You history
   */
  useEffect(() => {
    if (!couple) return;

    const loadHistory = async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('thinking_of_you')
        .select('*')
        .eq('couple_id', couple.id)
        .gte('created_at', startOfDay.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setHistory(data as ThinkingEvent[]);
      }
    };

    void loadHistory();
  }, [couple]);

  /*
   * Listen for new Thinking of You events
   *
   * This component will update immediately when
   * your partner sends one.
   */
  useEffect(() => {
    if (!couple || !user) return;

    const channel = supabase
      .channel(`thinking-of-you-${couple.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'thinking_of_you',
          filter: `couple_id=eq.${couple.id}`,
        },
        (payload) => {
          const event = payload.new as ThinkingEvent;

          setHistory((previous) => {
            if (previous.some((item) => item.id === event.id)) {
              return previous;
            }

            return [event, ...previous].slice(0, 20);
          });

          /*
           * Do not show the received animation
           * for our own event.
           */
          if (event.sender_id !== user.id) {
            showReceivedNotification();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [couple, user]);

  const showReceivedNotification = () => {
    window.dispatchEvent(
      new CustomEvent('thinking-of-you-received', {
        detail: {
          name: partnerName,
        },
      })
    );
  };

  const sendThinkingOfYou = async () => {
    if (!couple || !user || sending) return;

    setSending(true);
    setSent(false);

    const { data, error } = await supabase
      .from('thinking_of_you')
      .insert({
        couple_id: couple.id,
        sender_id: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setHistory((previous) => [
        data as ThinkingEvent,
        ...previous.filter((item) => item.id !== data.id),
      ].slice(0, 20));

      setSent(true);

      setTimeout(() => {
        setSent(false);
      }, 2500);
    }

    setSending(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 via-white to-pink-50 border border-rose-100 p-6 shadow-sm">
        
        {/* Decorative hearts */}
        <div className="absolute -top-6 -right-6 text-rose-100">
          <Heart className="w-32 h-32" fill="currentColor" />
        </div>

        <div className="relative text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-rose-100 flex items-center justify-center">
            <Heart
              className={`w-8 h-8 text-rose-500 ${
                sending ? 'animate-ping' : ''
              }`}
              fill="currentColor"
            />
          </div>

          <h2 className="font-serif text-xl text-ink-900">
            Thinking of You
          </h2>

          <p className="text-sm text-ink-400 mt-1 mb-5">
            Send a little love to {partnerName}
          </p>

          <button
            type="button"
            onClick={sendThinkingOfYou}
            disabled={sending}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium shadow-lg shadow-rose-200/60 hover:from-rose-600 hover:to-rose-700 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Sparkles className="w-5 h-5 animate-pulse" />
                Sending Love...
              </>
            ) : sent ? (
              <>
                <Heart className="w-5 h-5" fill="white" />
                Sent with Love ❤️
              </>
            ) : (
              <>
                <Heart className="w-5 h-5" />
                I'm Thinking of You
              </>
            )}
          </button>
        </div>
      </div>

      {/* Today's History */}
      <div className="rounded-2xl bg-white border border-cream-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-ink-900">
            Today
          </h3>

          <span className="text-xs text-ink-400">
            {history.length} {history.length === 1 ? 'moment' : 'moments'}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-5">
            <div className="text-3xl mb-2">💗</div>
            <p className="text-sm text-ink-400">
              No Thinking of You moments yet today.
            </p>
            <p className="text-xs text-ink-300 mt-1">
              Be the first to send one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((event) => {
              const mine = event.sender_id === user?.id;

              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center">
                    <Heart
                      className="w-4 h-4 text-rose-500"
                      fill="currentColor"
                    />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-ink-700">
                      {mine
                        ? `You thought of ${partnerName}`
                        : `${partnerName} thought of you`}
                    </p>

                    <p className="text-xs text-ink-300 mt-0.5">
                      {formatTime(event.created_at)}
                    </p>
                  </div>

                  <span className="text-lg">
                    {mine ? '❤️' : '💕'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}