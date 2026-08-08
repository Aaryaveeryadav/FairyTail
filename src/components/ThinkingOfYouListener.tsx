import { useEffect, useRef, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface ThinkingEvent {
  id: string;
  couple_id: string;
  sender_id: string;
  created_at: string;
}

export function ThinkingOfYouListener() {
  const { user, couple, partner } = useAuth();

  const [visible, setVisible] = useState(false);
  const [senderName, setSenderName] = useState('Your partner');

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!couple || !user) return;

    const channel = supabase
      .channel(`global-thinking-of-you-${couple.id}`)
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

          /*
           * Ignore our own Thinking of You.
           */
          if (event.sender_id === user.id) {
            return;
          }

          setSenderName(partner?.display_name ?? 'Your partner');
          setVisible(true);

          if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = window.setTimeout(() => {
            setVisible(false);
          }, 5000);

          /*
           * Browser notification if permission
           * has already been granted.
           */
          if (
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            new Notification('💕 Thinking of You', {
              body: `${partner?.display_name ?? 'Your partner'} is thinking of you.`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [couple, user, partner]);

  const closeNotification = () => {
    setVisible(false);
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  if (!visible) {
    return (
      <button
        type="button"
        onClick={enableNotifications}
        className="fixed bottom-24 right-4 z-50 hidden"
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-start justify-center pt-8 px-4">
      <div className="pointer-events-auto relative w-full max-w-sm animate-slide-up">
        <div className="relative overflow-hidden rounded-3xl bg-white border border-rose-100 shadow-2xl shadow-rose-200/50 p-5">
          
          {/* Glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-rose-200/30 blur-2xl" />

          <button
            type="button"
            onClick={closeNotification}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-cream-100 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4 text-ink-400" />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="relative w-14 h-14 shrink-0 rounded-full bg-rose-100 flex items-center justify-center">
              <Heart
                className="w-7 h-7 text-rose-500 animate-pulse"
                fill="currentColor"
              />

              <span className="absolute inset-0 rounded-full border-2 border-rose-300 animate-ping opacity-40" />
            </div>

            <div className="pr-6">
              <p className="text-xs font-medium text-rose-500 uppercase tracking-wide">
                A little love
              </p>

              <h3 className="font-serif text-lg text-ink-900">
                {senderName} is thinking of you
              </h3>

              <p className="text-sm text-ink-400 mt-0.5">
                💕 Your partner sent you some love.
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-3 mt-4 text-lg">
            <span className="animate-bounce">💕</span>
            <span className="animate-bounce [animation-delay:100ms]">
              ❤️
            </span>
            <span className="animate-bounce [animation-delay:200ms]">
              💗
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}