import { useState, useRef, useEffect } from 'react';
import {
  Youtube,
  Pencil,
  Gamepad2,
  Play,
  Pause,
  Search,
  X,
  Heart,
  Eraser,
  Send,
  Music,
  SkipForward,
  SkipBack,
  Users,
  Radio,
} from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Activity = 'youtube' | 'music' | 'draw' | 'quiz';

type MusicSyncMessage =
  | {
      type: 'load';
      videoId: string;
      time: number;
      playing: boolean;
      senderId: string;
    }
  | {
      type: 'play';
      time: number;
      senderId: string;
    }
  | {
      type: 'pause';
      time: number;
      senderId: string;
    }
  | {
      type: 'seek';
      time: number;
      senderId: string;
    }
  | {
      type: 'request-state';
      senderId: string;
    }
  | {
      type: 'state';
      videoId: string;
      time: number;
      playing: boolean;
      senderId: string;
    };

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

declare namespace YT {
  class Player {
    constructor(
      element: HTMLElement | string,
      options: {
        height?: string;
        width?: string;
        videoId?: string;
        playerVars?: Record<string, number | string>;
        events?: {
          onReady?: (event: { target: Player }) => void;
          onStateChange?: (event: {
            data: number;
            target: Player;
          }) => void;
        };
      }
    );

    loadVideoById(
      videoId: string,
      startSeconds?: number
    ): void;

    cueVideoById(
      videoId: string,
      startSeconds?: number
    ): void;

    playVideo(): void;
    pauseVideo(): void;

    seekTo(
      seconds: number,
      allowSeekAhead?: boolean
    ): void;

    getCurrentTime(): number;
    getPlayerState(): number;
    destroy(): void;
  }

  const PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

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
  const [activity, setActivity] =
    useState<Activity | null>(null);

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      <h2 className="font-serif text-2xl text-ink-900">
        Together
      </h2>

      {!activity && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setActivity('youtube')}
            className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100 border border-rose-200 text-left hover:shadow-lg transition-all group"
          >
            <Youtube className="w-8 h-8 text-rose-500 mb-3" />

            <h3 className="font-medium text-ink-900 mb-1">
              Watch Together
            </h3>

            <p className="text-xs text-ink-500">
              Sync YouTube videos and watch side by side
            </p>
          </button>

          <button
            onClick={() => setActivity('music')}
            className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200 text-left hover:shadow-lg transition-all group"
          >
            <Music className="w-8 h-8 text-emerald-500 mb-3" />

            <h3 className="font-medium text-ink-900 mb-1">
              Music Together
            </h3>

            <p className="text-xs text-ink-500">
              Listen to YouTube Music together in real time
            </p>
          </button>

          <button
            onClick={() => setActivity('draw')}
            className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 text-left hover:shadow-lg transition-all group"
          >
            <Pencil className="w-8 h-8 text-amber-500 mb-3" />

            <h3 className="font-medium text-ink-900 mb-1">
              Drawing Board
            </h3>

            <p className="text-xs text-ink-500">
              Draw together on a shared canvas in real time
            </p>
          </button>

          <button
            onClick={() => setActivity('quiz')}
            className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200 text-left hover:shadow-lg transition-all group"
          >
            <Gamepad2 className="w-8 h-8 text-purple-500 mb-3" />

            <h3 className="font-medium text-ink-900 mb-1">
              Couple Quiz
            </h3>

            <p className="text-xs text-ink-500">
              Answer questions and learn more about each other
            </p>
          </button>
        </div>
      )}

      {activity === 'youtube' && (
        <YouTubeSync
          onBack={() => setActivity(null)}
        />
      )}

      {activity === 'music' && (
        <MusicTogether
          onBack={() => setActivity(null)}
        />
      )}

      {activity === 'draw' && (
        <DrawingBoard
          onBack={() => setActivity(null)}
        />
      )}

      {activity === 'quiz' && (
        <CoupleQuiz
          onBack={() => setActivity(null)}
        />
      )}
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function profileInitial(name?: string | null) {
  return name?.charAt(0).toUpperCase() ?? '?';
}

function extractYouTubeId(url: string) {
  const value = url.trim();

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:music\.youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
    return value;
  }

  return '';
}

/* =========================================================
   MUSIC TOGETHER
   ========================================================= */

function MusicTogether({
  onBack,
}: {
  onBack: () => void;
}) {
  const { user, partner, couple } = useAuth();

  const [videoId, setVideoId] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [connected, setConnected] = useState(false);
  const [partnerConnected, setPartnerConnected] =
    useState(false);
  const [status, setStatus] = useState(
    'Ready to listen together'
  );

  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef =
    useRef<HTMLDivElement>(null);

  const channelRef = useRef<
    ReturnType<typeof supabase.channel> | null
  >(null);

  const isRemoteAction = useRef(false);

  const videoIdRef = useRef('');
  const playingRef = useRef(false);

  const lastBroadcastRef = useRef(0);

  /* ---------------------------------------------------------
     KEEP REFS UPDATED
     --------------------------------------------------------- */

  useEffect(() => {
    videoIdRef.current = videoId;
  }, [videoId]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  /* ---------------------------------------------------------
     LOAD YOUTUBE IFRAME API
     --------------------------------------------------------- */

  useEffect(() => {
    if (window.YT?.Player) {
      setPlayerReady(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );

    if (existingScript) {
      const previous =
        window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        setPlayerReady(true);
      };

      return () => {
        window.onYouTubeIframeAPIReady =
          previous;
      };
    }

    const script = document.createElement('script');

    script.src =
      'https://www.youtube.com/iframe_api';

    script.async = true;

    window.onYouTubeIframeAPIReady = () => {
      setPlayerReady(true);
    };

    document.body.appendChild(script);

    return () => {
      window.onYouTubeIframeAPIReady = undefined;
    };
  }, []);

  /* ---------------------------------------------------------
     BROADCAST HELPER
     --------------------------------------------------------- */

  const broadcast = async (
    message: MusicSyncMessage
  ) => {
    if (!channelRef.current) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'music-sync',
      payload: message,
    });
  };

  /* ---------------------------------------------------------
     SUPABASE REALTIME ROOM
     --------------------------------------------------------- */

  useEffect(() => {
    if (!couple?.id || !user?.id) return;

    const channelName =
      `music-together-${couple.id}`;

    const channel =
      supabase.channel(channelName, {
        config: {
          broadcast: {
            self: false,
          },
          presence: {
            key: user.id,
          },
        },
      });

    channel
      .on(
        'broadcast',
        { event: 'music-sync' },
        ({ payload }) => {
          const message =
            payload as MusicSyncMessage;

          if (!message) return;

          if (
            'senderId' in message &&
            message.senderId === user.id
          ) {
            return;
          }

          /* -------------------------------------------------
             PARTNER REQUESTS CURRENT STATE
             ------------------------------------------------- */

          if (message.type === 'request-state') {
            setPartnerConnected(true);

            if (
              videoIdRef.current &&
              user.id
            ) {
              const player =
                playerRef.current;

              const currentTime =
                player?.getCurrentTime() ?? 0;

              void broadcast({
                type: 'state',
                videoId:
                  videoIdRef.current,
                time: currentTime,
                playing:
                  playingRef.current,
                senderId: user.id,
              });
            }

            return;
          }

          setPartnerConnected(true);

          const player =
            playerRef.current;

          if (!player) {
            return;
          }

          /* -------------------------------------------------
             LOAD
             ------------------------------------------------- */

          if (message.type === 'load') {
            isRemoteAction.current = true;

            setVideoId(message.videoId);
            setPlaying(message.playing);

            videoIdRef.current =
              message.videoId;

            playingRef.current =
              message.playing;

            setStatus(
              `${partner?.display_name ?? 'Your partner'} selected a song ❤️`
            );

            player.loadVideoById(
              message.videoId,
              message.time
            );

            if (message.playing) {
              setTimeout(() => {
                player.playVideo();
              }, 400);
            } else {
              setTimeout(() => {
                player.pauseVideo();
              }, 400);
            }

            setTimeout(() => {
              isRemoteAction.current = false;
            }, 1000);

            return;
          }

          /* -------------------------------------------------
             STATE
             ------------------------------------------------- */

          if (message.type === 'state') {
            isRemoteAction.current = true;

            setVideoId(message.videoId);
            setPlaying(message.playing);

            videoIdRef.current =
              message.videoId;

            playingRef.current =
              message.playing;

            player.loadVideoById(
              message.videoId,
              message.time
            );

            if (message.playing) {
              setTimeout(() => {
                player.playVideo();
              }, 500);
            } else {
              setTimeout(() => {
                player.pauseVideo();
              }, 500);
            }

            setStatus(
              `${partner?.display_name ?? 'Your partner'} synced the room ❤️`
            );

            setTimeout(() => {
              isRemoteAction.current = false;
            }, 1200);

            return;
          }

          /* -------------------------------------------------
             PLAY
             ------------------------------------------------- */

          if (message.type === 'play') {
            isRemoteAction.current = true;

            player.seekTo(
              message.time,
              true
            );

            player.playVideo();

            setPlaying(true);
            playingRef.current = true;

            setStatus(
              `${partner?.display_name ?? 'Your partner'} is listening 🎵`
            );

            setTimeout(() => {
              isRemoteAction.current = false;
            }, 700);

            return;
          }

          /* -------------------------------------------------
             PAUSE
             ------------------------------------------------- */

          if (message.type === 'pause') {
            isRemoteAction.current = true;

            player.seekTo(
              message.time,
              true
            );

            player.pauseVideo();

            setPlaying(false);
            playingRef.current = false;

            setStatus('Music paused');

            setTimeout(() => {
              isRemoteAction.current = false;
            }, 700);

            return;
          }

          /* -------------------------------------------------
             SEEK
             ------------------------------------------------- */

          if (message.type === 'seek') {
            isRemoteAction.current = true;

            player.seekTo(
              message.time,
              true
            );

            setTimeout(() => {
              isRemoteAction.current = false;
            }, 500);
          }
        }
      )
      .on(
        'presence',
        { event: 'sync' },
        () => {
          const state =
            channel.presenceState();

          const users =
            Object.keys(state);

          setPartnerConnected(
            users.some(
              (id) => id !== user.id
            )
          );
        }
      )
      .subscribe(
        async (subscriptionStatus) => {
          if (
            subscriptionStatus ===
            'SUBSCRIBED'
          ) {
            setConnected(true);

            await channel.track({
              user_id: user.id,
              online_at:
                new Date().toISOString(),
            });

            setStatus(
              'Connected with your partner ❤️'
            );

            /*
             * Ask the partner for the
             * current music state.
             */
            await channel.send({
              type: 'broadcast',
              event: 'music-sync',
              payload: {
                type: 'request-state',
                senderId: user.id,
              } satisfies MusicSyncMessage,
            });
          }
        }
      );

    channelRef.current = channel;

    return () => {
      void channel.untrack();

      supabase.removeChannel(channel);

      channelRef.current = null;

      setConnected(false);
      setPartnerConnected(false);
    };
  }, [
    couple?.id,
    user?.id,
    partner?.display_name,
  ]);

  /* ---------------------------------------------------------
     CREATE YOUTUBE PLAYER
     --------------------------------------------------------- */

  useEffect(() => {
    if (!playerReady) return;
    if (!videoId) return;
    if (!playerContainerRef.current) return;

    if (playerRef.current) {
      playerRef.current.loadVideoById(
        videoId
      );

      return;
    }

    playerRef.current =
      new window.YT.Player(
        playerContainerRef.current,
        {
          height: '100%',
          width: '100%',
          videoId,

          playerVars: {
            autoplay: 0,
            controls: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
          },

          events: {
            onReady: () => {
              setPlayerReady(true);
            },

            onStateChange: (event) => {
              if (
                isRemoteAction.current
              ) {
                return;
              }

              if (
                event.data ===
                window.YT.PlayerState.PLAYING
              ) {
                setPlaying(true);
                playingRef.current = true;

                broadcastPlay();
              }

              if (
                event.data ===
                window.YT.PlayerState.PAUSED
              ) {
                setPlaying(false);
                playingRef.current = false;

                broadcastPause();
              }
            },
          },
        }
      );

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [playerReady, videoId]);

  /* ---------------------------------------------------------
     PERIODIC DRIFT CORRECTION
     --------------------------------------------------------- */

  useEffect(() => {
    if (!connected) return;

    const interval =
      window.setInterval(() => {
        if (
          !playerRef.current ||
          !videoIdRef.current ||
          !playingRef.current ||
          isRemoteAction.current
        ) {
          return;
        }

        /*
         * Every 5 seconds the current listener
         * sends the position to the partner.
         *
         * This prevents the two players from
         * slowly drifting apart.
         */
        const now = Date.now();

        if (
          now - lastBroadcastRef.current <
          5000
        ) {
          return;
        }

        lastBroadcastRef.current = now;

        const time =
          playerRef.current.getCurrentTime();

        if (!user?.id) return;

        void broadcast({
          type: 'seek',
          time,
          senderId: user.id,
        });
      }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [connected, user?.id]);

  /* ---------------------------------------------------------
     PLAY
     --------------------------------------------------------- */

  const broadcastPlay = () => {
    if (
      !user?.id ||
      isRemoteAction.current
    ) {
      return;
    }

    const player =
      playerRef.current;

    if (!player || !videoIdRef.current) {
      return;
    }

    const time =
      player.getCurrentTime();

    void broadcast({
      type: 'play',
      time,
      senderId: user.id,
    });

    setStatus(
      'You are playing 🎵'
    );
  };

  /* ---------------------------------------------------------
     PAUSE
     --------------------------------------------------------- */

  const broadcastPause = () => {
    if (
      !user?.id ||
      isRemoteAction.current
    ) {
      return;
    }

    const player =
      playerRef.current;

    if (!player || !videoIdRef.current) {
      return;
    }

    const time =
      player.getCurrentTime();

    void broadcast({
      type: 'pause',
      time,
      senderId: user.id,
    });

    setStatus(
      'You paused the music'
    );
  };

  /* ---------------------------------------------------------
     LOAD MUSIC
     --------------------------------------------------------- */

  const loadMusic = () => {
    const id =
      extractYouTubeId(inputUrl);

    if (!id) {
      setStatus(
        'Please enter a valid YouTube Music link'
      );

      return;
    }

    setVideoId(id);

    videoIdRef.current = id;

    setPlaying(false);

    playingRef.current = false;

    setStatus(
      'Loading music for both of you...'
    );

    if (!user?.id) return;

    void broadcast({
      type: 'load',
      videoId: id,
      time: 0,
      playing: false,
      senderId: user.id,
    });
  };

  /* ---------------------------------------------------------
     PLAY / PAUSE
     --------------------------------------------------------- */

  const togglePlay = () => {
    const player =
      playerRef.current;

    if (!player) return;

    if (playingRef.current) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  /* ---------------------------------------------------------
     SEEK
     --------------------------------------------------------- */

  const seek = (seconds: number) => {
    const player =
      playerRef.current;

    if (!player || !user?.id) {
      return;
    }

    const current =
      player.getCurrentTime();

    const newTime =
      Math.max(
        0,
        current + seconds
      );

    isRemoteAction.current = true;

    player.seekTo(
      newTime,
      true
    );

    void broadcast({
      type: 'seek',
      time: newTime,
      senderId: user.id,
    });

    setTimeout(() => {
      isRemoteAction.current = false;
    }, 500);
  };

  /* ---------------------------------------------------------
     MANUAL SYNC
     --------------------------------------------------------- */

  const syncCurrentPosition = () => {
    const player =
      playerRef.current;

    if (!player || !user?.id) {
      return;
    }

    const time =
      player.getCurrentTime();

    void broadcast({
      type: 'seek',
      time,
      senderId: user.id,
    });

    setStatus(
      'Position synchronized ❤️'
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <button
            onClick={onBack}
            className="p-2 hover:bg-cream-100 rounded-lg"
            aria-label="Back"
          >
            <X className="w-5 h-5 text-ink-400" />
          </button>

          <div>
            <h3 className="font-serif text-xl text-ink-900">
              Music Together
            </h3>

            <p className="text-xs text-ink-400">
              YouTube Music • synced together
            </p>
          </div>

        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${
            connected
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-cream-100 text-ink-400'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />

          {connected
            ? 'Connected'
            : 'Connecting...'}
        </div>

      </div>

      {/* PARTNER STATUS */}

      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-cream-200">

        <div className="flex items-center gap-3">

          <div className="relative">

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center text-white text-sm font-medium">
              {profileInitial(
                partner?.display_name
              )}
            </div>

            {partnerConnected && (
              <span className="absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            )}

          </div>

          <div>

            <p className="text-sm font-medium text-ink-800">
              {partner?.display_name ??
                'Your partner'}
            </p>

            <p className="text-xs text-ink-400">
              {partnerConnected
                ? 'Listening with you 🎵'
                : 'Waiting for your partner...'}
            </p>

          </div>

        </div>

        <Users className="w-5 h-5 text-rose-400" />

      </div>

      {/* URL INPUT */}

      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">

        <div className="flex items-center gap-2 mb-3">

          <Music className="w-5 h-5 text-emerald-600" />

          <h4 className="font-medium text-ink-900">
            Choose music
          </h4>

        </div>

        <div className="flex gap-2">

          <div className="relative flex-1">

            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />

            <label
              htmlFor="musicUrl"
              className="sr-only"
            >
              YouTube Music URL
            </label>

            <input
              id="musicUrl"
              name="musicUrl"
              type="text"
              value={inputUrl}
              onChange={(e) =>
                setInputUrl(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  loadMusic();
                }
              }}
              placeholder="Paste a YouTube Music link..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />

          </div>

          <button
            onClick={loadMusic}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
          >
            Load
          </button>

        </div>

        <p className="text-[11px] text-ink-400 mt-2">
          Paste a YouTube Music song link. The room
          synchronizes the song, play/pause and position
          between both partners.
        </p>

      </div>

      {/* PLAYER */}

      {videoId ? (

        <div className="space-y-3">

          <div className="rounded-2xl overflow-hidden bg-black aspect-video">

            <div
              ref={playerContainerRef}
              className="w-full h-full"
            />

          </div>

          {/* CONTROLS */}

          <div className="p-4 rounded-2xl bg-white border border-cream-200">

            <div className="flex items-center justify-center gap-3">

              <button
                onClick={() => seek(-10)}
                className="p-3 rounded-xl bg-cream-100 hover:bg-cream-200 transition-colors"
                title="Back 10 seconds"
              >
                <SkipBack className="w-5 h-5 text-ink-600" />
              </button>

              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 transition-all hover:scale-105"
                title={
                  playing
                    ? 'Pause'
                    : 'Play'
                }
              >
                {playing ? (
                  <Pause
                    className="w-6 h-6"
                    fill="white"
                  />
                ) : (
                  <Play
                    className="w-6 h-6 ml-1"
                    fill="white"
                  />
                )}
              </button>

              <button
                onClick={() => seek(10)}
                className="p-3 rounded-xl bg-cream-100 hover:bg-cream-200 transition-colors"
                title="Forward 10 seconds"
              >
                <SkipForward className="w-5 h-5 text-ink-600" />
              </button>

            </div>

            <button
              onClick={syncCurrentPosition}
              className="w-full mt-3 py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 text-sm text-ink-600 font-medium transition-colors"
            >
              🔄 Sync With Partner
            </button>

          </div>

          {/* STATUS */}

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-center">

            <p className="text-sm text-rose-600 flex items-center justify-center gap-2">

              <Heart
                className="w-4 h-4"
                fill="currentColor"
              />

              {status}

            </p>

          </div>

        </div>

      ) : (

        <div className="flex flex-col items-center justify-center py-16 text-center">

          <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">

            <Music className="w-8 h-8 text-emerald-400" />

          </div>

          <p className="font-serif text-lg text-ink-500">
            Choose your music
          </p>

          <p className="text-sm text-ink-300 mt-1 max-w-sm">
            Paste a YouTube Music link and your
            partner will receive the same music room
            automatically.
          </p>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   WATCH TOGETHER
   ========================================================= */

function YouTubeSync({
  onBack,
}: {
  onBack: () => void;
}) {
  const { partner } = useAuth();

  const [videoId, setVideoId] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [playing, setPlaying] = useState(false);

  const loadVideo = () => {
    const id =
      extractYouTubeId(inputUrl) ||
      inputUrl.trim();

    if (id.length === 11) {
      setVideoId(id);
      setPlaying(true);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">

      <div className="flex items-center gap-3">

        <button
          onClick={onBack}
          className="p-2 hover:bg-cream-100 rounded-lg"
        >
          <X className="w-5 h-5 text-ink-400" />
        </button>

        <h3 className="font-serif text-xl text-ink-900">
          Watch Together
        </h3>

      </div>

      <div className="flex gap-2">

        <div className="relative flex-1">

          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />

          <label
            htmlFor="youtubeUrl"
            className="sr-only"
          >
            YouTube URL
          </label>

          <input
            id="youtubeUrl"
            name="youtubeUrl"
            type="text"
            value={inputUrl}
            onChange={(e) =>
              setInputUrl(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              loadVideo()
            }
            placeholder="Paste a YouTube link..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />

        </div>

        <button
          onClick={loadVideo}
          className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium"
        >
          Load
        </button>

      </div>

      {videoId ? (

        <div className="space-y-3">

          <div className="rounded-2xl overflow-hidden bg-black aspect-video">

            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              title="YouTube video"
            />

          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-cream-200">

            <p className="text-sm text-ink-600 flex items-center gap-2">

              <Heart className="w-4 h-4 text-rose-400" />

              Watching with{' '}
              {partner?.display_name}

            </p>

            <button
              onClick={() =>
                setPlaying(!playing)
              }
              className="p-2 rounded-lg bg-cream-100 hover:bg-cream-200"
            >
              {playing ? (
                <Pause className="w-4 h-4 text-ink-600" />
              ) : (
                <Play className="w-4 h-4 text-ink-600" />
              )}
            </button>

          </div>

        </div>

      ) : (

        <div className="flex flex-col items-center justify-center py-16 text-center">

          <Youtube className="w-12 h-12 text-ink-200 mb-3" />

          <p className="text-sm text-ink-400">
            Paste a YouTube link above to start
            watching together
          </p>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   DRAWING BOARD
   ========================================================= */

function DrawingBoard({
  onBack,
}: {
  onBack: () => void;
}) {
  const { partner } = useAuth();

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const [drawing, setDrawing] =
    useState(false);

  const [color, setColor] =
    useState('#e11d48');

  const [size, setSize] =
    useState(4);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext('2d');

    if (!ctx) return;

    ctx.fillStyle = '#ffffff';

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  }, []);

  const getPos = (
    e: React.MouseEvent |
      React.TouchEvent
  ) => {
    const canvas =
      canvasRef.current!;

    const rect =
      canvas.getBoundingClientRect();

    const scaleX =
      canvas.width / rect.width;

    const scaleY =
      canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x:
          (e.touches[0].clientX -
            rect.left) *
          scaleX,

        y:
          (e.touches[0].clientY -
            rect.top) *
          scaleY,
      };
    }

    return {
      x:
        (e.clientX -
          rect.left) *
        scaleX,

      y:
        (e.clientY -
          rect.top) *
        scaleY,
    };
  };

  const startDraw = (
    e: React.MouseEvent |
      React.TouchEvent
  ) => {
    setDrawing(true);

    const ctx =
      canvasRef.current?.getContext(
        '2d'
      );

    if (!ctx) return;

    const pos =
      getPos(e);

    ctx.beginPath();
    ctx.moveTo(
      pos.x,
      pos.y
    );
  };

  const draw = (
    e: React.MouseEvent |
      React.TouchEvent
  ) => {
    if (!drawing) return;

    const ctx =
      canvasRef.current?.getContext(
        '2d'
      );

    if (!ctx) return;

    const pos =
      getPos(e);

    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.lineTo(
      pos.x,
      pos.y
    );

    ctx.stroke();
  };

  const stopDraw = () =>
    setDrawing(false);

  const clear = () => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const ctx =
      canvas.getContext('2d');

    if (!ctx) return;

    ctx.fillStyle = '#ffffff';

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );
  };

  const colors = [
    '#e11d48',
    '#f59e0b',
    '#10b981',
    '#3b82f6',
    '#8b5cf6',
    '#1a1625',
  ];

  return (
    <div className="space-y-4 animate-fade-in">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <button
            onClick={onBack}
            className="p-2 hover:bg-cream-100 rounded-lg"
          >
            <X className="w-5 h-5 text-ink-400" />
          </button>

          <h3 className="font-serif text-xl text-ink-900">
            Drawing Board
          </h3>

        </div>

        <button
          onClick={clear}
          className="p-2 bg-cream-100 hover:bg-cream-200 rounded-lg"
        >
          <Eraser className="w-5 h-5 text-ink-500" />
        </button>

      </div>

      <div className="flex items-center gap-2">

        {colors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full border-2 transition-all ${
              color === c
                ? 'border-ink-400 scale-110'
                : 'border-cream-200'
            }`}
            style={{
              backgroundColor: c,
            }}
          />
        ))}

        <label
          htmlFor="brushSize"
          className="sr-only"
        >
          Brush size
        </label>

        <input
          id="brushSize"
          name="brushSize"
          type="range"
          min={1}
          max={20}
          value={size}
          onChange={(e) =>
            setSize(
              Number(e.target.value)
            )
          }
          className="ml-2 flex-1 accent-rose-500"
        />

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

      <p className="text-xs text-ink-400 text-center">
        Draw something sweet for{' '}
        {partner?.display_name} 💕
      </p>

    </div>
  );
}

/* =========================================================
   COUPLE QUIZ
   ========================================================= */

function CoupleQuiz({
  onBack,
}: {
  onBack: () => void;
}) {
  const { partner } = useAuth();

  const [currentQ, setCurrentQ] =
    useState(0);

  const [myAnswer, setMyAnswer] =
    useState('');

  const [answers, setAnswers] =
    useState<
      Record<
        number,
        {
          mine?: string;
          theirs?: string;
        }
      >
    >({});

  const question =
    QUIZ_QUESTIONS[
      currentQ %
        QUIZ_QUESTIONS.length
    ];

  const submit = () => {
    if (!myAnswer.trim()) return;

    setAnswers((prev) => ({
      ...prev,

      [currentQ]: {
        ...prev[currentQ],
        mine: myAnswer,
      },
    }));

    setMyAnswer('');
  };

  const next = () => {
    setCurrentQ(
      (p) => p + 1
    );

    setMyAnswer('');
  };

  return (
    <div className="space-y-4 animate-fade-in">

      <div className="flex items-center gap-3">

        <button
          onClick={onBack}
          className="p-2 hover:bg-cream-100 rounded-lg"
        >
          <X className="w-5 h-5 text-ink-400" />
        </button>

        <h3 className="font-serif text-xl text-ink-900">
          Couple Quiz
        </h3>

      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-100 border border-purple-200">

        <p className="text-xs text-purple-500 font-medium mb-2">
          Question {currentQ + 1}
        </p>

        <p className="font-serif text-lg text-ink-900 text-balance">
          {question}
        </p>

      </div>

      {answers[currentQ]?.mine ? (

        <div className="space-y-3">

          <div className="p-4 rounded-2xl bg-white border border-cream-200">

            <p className="text-xs text-ink-400 mb-1">
              Your answer
            </p>

            <p className="text-sm text-ink-800 font-serif italic">
              {answers[currentQ].mine}
            </p>

          </div>

          {answers[currentQ]?.theirs ? (

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">

              <p className="text-xs text-ink-400 mb-1">
                {partner?.display_name}'s answer
              </p>

              <p className="text-sm text-ink-800 font-serif italic">
                {answers[currentQ].theirs}
              </p>

            </div>

          ) : (

            <p className="text-sm text-ink-400 text-center">
              Waiting for{' '}
              {partner?.display_name}...
            </p>

          )}

          <button
            onClick={next}
            className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium"
          >
            Next Question
          </button>

        </div>

      ) : (

        <div className="space-y-2">

          <label
            htmlFor="quizAnswer"
            className="sr-only"
          >
            Your answer
          </label>

          <textarea
            id="quizAnswer"
            name="quizAnswer"
            value={myAnswer}
            onChange={(e) =>
              setMyAnswer(
                e.target.value
              )
            }
            placeholder="Your answer..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-300 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          />

          <button
            onClick={submit}
            disabled={!myAnswer.trim()}
            className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />

            Submit Answer
          </button>

        </div>

      )}

    </div>
  );
}