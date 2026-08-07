import {
  useEffect,
  useState,
} from 'react';

import {
  Heart,
  Link2,
  Copy,
  Check,
  Calendar,
  Sparkles,
  User as UserIcon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

function generateCode(): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let code = '';

  for (let i = 0; i < 6; i++) {
    code +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];
  }

  return code;
}

export function PartnerLinking() {
  const {
    user,
    profile,
    couple,
    partner,
    refreshProfile,
    signOut,
  } = useAuth();

  const [
    step,
    setStep,
  ] = useState<
    'choose' | 'create' | 'join'
  >('choose');

  const [
    inviteCode,
    setInviteCode,
  ] = useState('');

  const [
    joinCode,
    setJoinCode,
  ] = useState('');

  const [
    startDate,
    setStartDate,
  ] = useState('');

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    checking,
    setChecking,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    success,
    setSuccess,
  ] = useState<string | null>(null);

  const [
    copied,
    setCopied,
  ] = useState(false);

  /*
   * =========================================================
   * AUTOMATIC DASHBOARD DETECTION
   * =========================================================
   */
useEffect(() => {
  if (!couple || profile?.partner_id) {
    return;
  }

  const checkPartner = async () => {
    await refreshProfile();
  };

  checkPartner();

  const interval = window.setInterval(() => {
    checkPartner();
  }, 2000);

  return () => {
    window.clearInterval(interval);
  };
}, [
  couple,
  profile?.partner_id,
  refreshProfile,
]);

  /*
   * =========================================================
   * CREATE SPACE
   * =========================================================
   */

  const handleCreate = async () => {
    if (!user) {
      setError(
        'You are not authenticated.'
      );
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const code =
        generateCode();

      let normalizedStart:
        | string
        | null = null;

      if (startDate) {
        const parsed =
          new Date(startDate);

        if (
          Number.isNaN(
            parsed.getTime()
          )
        ) {
          setError(
            'Please enter a valid relationship start date.'
          );

          return;
        }

        normalizedStart =
          parsed
            .toISOString()
            .split('T')[0];
      }

      console.log(
        '[CREATE] Creating space:',
        code
      );

      const {
        data,
        error: rpcError,
      } =
        await supabase.rpc(
          'rpc_create_couple',
          {
            invite_code_text:
              code,

            start_date_text:
              normalizedStart,
          }
        );

      if (rpcError) {
        console.error(
          '[CREATE] RPC error:',
          rpcError
        );

        setError(
          `Create space failed: ${rpcError.message}`
        );

        return;
      }

      console.log(
        '[CREATE] RPC result:',
        data
      );

      const result =
        data as {
          status?: string;
          message?: string;
          couple_id?: string;
        } | null;

      if (
        result?.status ===
        'error'
      ) {
        setError(
          result.message ||
            'Failed to create space.'
        );

        return;
      }

      setInviteCode(code);

      setSuccess(
        'Your private space has been created. Share this code with your partner.'
      );

      await refreshProfile();

    } catch (error) {
      console.error(
        '[CREATE] Error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      );

    } finally {
      setBusy(false);
    }
  };

  /*
   * =========================================================
   * JOIN SPACE
   * =========================================================
   */

  const handleJoin = async () => {
    if (!user) {
      setError(
        'You are not authenticated.'
      );
      return;
    }

    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const normalized =
        joinCode
          .trim()
          .toUpperCase();

      if (
        normalized.length !== 6
      ) {
        setError(
          'Please enter a 6-character invite code.'
        );

        return;
      }

      console.log(
        '[JOIN] Starting join...'
      );

      console.log(
        '[JOIN] User:',
        user.id
      );

      console.log(
        '[JOIN] Code:',
        normalized
      );

      /*
       * Call the PostgreSQL RPC.
       */

      const {
        data,
        error: rpcError,
      } =
        await supabase.rpc(
          'rpc_join_couple',
          {
            invite_code_text:
              normalized,
          }
        );

      console.log(
        '[JOIN] RPC response:',
        data
      );

      if (rpcError) {
        console.error(
          '[JOIN] RPC ERROR:',
          rpcError
        );

        setError(
          `Join failed: ${rpcError.message}`
        );

        return;
      }

      const result =
        data as {
          status?: string;
          message?: string;
          couple_id?: string;
          partner_id?: string;
        } | null;

      console.log(
        '[JOIN] Parsed result:',
        result
      );

      if (
        result?.status ===
        'error'
      ) {
        setError(
          result.message ||
            'Failed to join the space.'
        );

        return;
      }

      /*
       * The server MUST return couple_id.
       */

      if (!result?.couple_id) {
        setError(
          'The space was joined, but no couple ID was returned.'
        );

        return;
      }

      /*
       * Show success.
       */

      setSuccess(
        'Space joined successfully! Connecting you both...'
      );

      /*
       * Refresh profile.
       */

      console.log(
        '[JOIN] Refreshing profile...'
      );

      await refreshProfile();

      /*
       * Give Supabase/React a short moment,
       * then refresh one more time.
       */

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 500)
      );

      await refreshProfile();

      console.log(
        '[JOIN] Profile refresh completed.'
      );

    } catch (error) {
      console.error(
        '[JOIN] Unexpected error:',
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong.'
      );

    } finally {
      setBusy(false);
    }
  };

  /*
   * =========================================================
   * CHECK PARTNER
   * =========================================================
   */

  const handleCheckPartner =
    async () => {
      if (!user) return;

      setChecking(true);
      setError(null);

      try {
        console.log(
          '[CHECK] Checking partner...'
        );

        await refreshProfile();

        /*
         * Get the newest profile directly.
         */

        const {
          data: freshProfile,
          error: profileError,
        } =
          await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
          throw profileError;
        }

        console.log(
          '[CHECK] Fresh profile:',
          freshProfile
        );

        if (
          freshProfile.couple_id
        ) {
          console.log(
            '[CHECK] Couple exists:',
            freshProfile.couple_id
          );

          await refreshProfile();

          setSuccess(
            'Your partner has joined! Opening your shared space...'
          );

          return;
        }

        setSuccess(
          'Your partner has not joined yet. We will keep checking.'
        );

      } catch (error) {
        console.error(
          '[CHECK] Error:',
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : 'Failed to check partner.'
        );

      } finally {
        setChecking(false);
      }
    };

  /*
   * =========================================================
   * COPY CODE
   * =========================================================
   */

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(
        inviteCode
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        2000
      );

    } catch {
      setError(
        'Could not copy the invite code.'
      );
    }
  };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 via-cream-100 to-rose-100">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl animate-float" />

        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-rose-300/20 rounded-full blur-3xl animate-float"
          style={{
            animationDelay: '1s',
          }}
        />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">

        <div className="text-center mb-6">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-400 to-rose-600 shadow-lg shadow-rose-300/50 mb-3">
            <Heart
              className="w-8 h-8 text-white"
              fill="white"
            />
          </div>

          <h1 className="font-serif text-3xl text-ink-900 mb-1">
            Welcome,{' '}
            {profile?.display_name}
          </h1>

          <p className="text-ink-500 text-sm">
            Let's link you with your partner
          </p>

        </div>

        <div className="glass rounded-3xl shadow-xl shadow-rose-200/30 p-8 border border-white/60">

          {step === 'choose' && (
            <div className="space-y-4 animate-fade-in">

              <p className="text-center text-ink-600 text-sm mb-6">
                To create your private shared space,
                choose one option below. One of you
                creates the space and shares a code;
                the other joins with it.
              </p>

              <button
                type="button"
                onClick={() => {
                  setStep('create');
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 text-left hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-1">
                  <Sparkles className="w-5 h-5 text-rose-500" />

                  <span className="font-medium text-ink-900">
                    Create Our Space
                  </span>
                </div>

                <p className="text-sm text-ink-500 pl-8">
                  Start a new shared space and get
                  an invite code for your partner
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('join');
                  setError(null);
                  setSuccess(null);
                }}
                className="w-full p-5 rounded-2xl bg-gradient-to-br from-cream-50 to-cream-200 border border-cream-300 text-left hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-1">
                  <Link2 className="w-5 h-5 text-rose-500" />

                  <span className="font-medium text-ink-900">
                    Join with a Code
                  </span>
                </div>

                <p className="text-sm text-ink-500 pl-8">
                  Your partner already created the
                  space — enter their invite code
                </p>
              </button>

              <button
                type="button"
                onClick={signOut}
                className="w-full text-sm text-ink-400 hover:text-ink-600 mt-4"
              >
                Sign out
              </button>

            </div>
          )}

          {step === 'create' && (
            <div className="space-y-5 animate-fade-in">

              {!inviteCode ? (
                <>
                  <div>

                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-ink-700 mb-1.5"
                    >
                      When did your relationship begin?
                    </label>

                    <div className="relative">

                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />

                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) =>
                          setStartDate(
                            e.target.value
                          )
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-cream-50 border border-cream-300"
                      />

                    </div>

                    <p className="text-xs text-ink-400 mt-1.5">
                      This powers your relationship
                      timer and anniversary countdown
                    </p>

                  </div>

                  {error && (
                    <ErrorBox
                      message={error}
                    />
                  )}

                  <div className="flex gap-3">

                    <button
                      type="button"
                      onClick={() => {
                        setStep('choose');
                        setError(null);
                      }}
                      className="px-4 py-3 rounded-xl text-ink-500"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={busy}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {busy ? (
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      ) : (
                        <>
                          <Heart
                            className="w-4 h-4"
                            fill="white"
                          />
                          Create Space
                        </>
                      )}
                    </button>

                  </div>
                </>
              ) : (
                <div className="text-center space-y-5 animate-fade-in">

                  <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-rose-600" />
                  </div>

                  <div>
                    <h3 className="font-serif text-xl text-ink-900 mb-1">
                      Your space is ready
                    </h3>

                    <p className="text-sm text-ink-500">
                      Share this code with your partner
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-cream-50 border-2 border-dashed border-rose-200">

                    <span className="font-mono text-3xl font-bold tracking-[0.3em] text-rose-600">
                      {inviteCode}
                    </span>

                    <button
                      type="button"
                      onClick={copyCode}
                      className="p-2 rounded-lg hover:bg-rose-50"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-rose-600" />
                      ) : (
                        <Copy className="w-5 h-5 text-ink-400" />
                      )}
                    </button>

                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100">

                    <p className="text-sm text-ink-600">

                      <UserIcon className="w-4 h-4 inline mr-1.5 text-rose-400" />

                      Waiting for your partner to join...

                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleCheckPartner}
                    disabled={checking}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {checking ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Check if partner joined
                      </>
                    )}
                  </button>

                  {success && (
                    <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
                      {success}
                    </div>
                  )}

                  {error && (
                    <ErrorBox
                      message={error}
                    />
                  )}

                </div>
              )}

            </div>
          )}

          {step === 'join' && (
            <div className="space-y-5 animate-fade-in">

              <div>

                <label
                  htmlFor="joinCode"
                  className="block text-sm font-medium text-ink-700 mb-1.5"
                >
                  Enter your partner's invite code
                </label>

                <input
                  id="joinCode"
                  name="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(
                      e.target.value
                        .replace(
                          /[^A-Z0-9]/gi,
                          ''
                        )
                        .toUpperCase()
                        .slice(0, 6)
                    )
                  }
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-cream-50 border border-cream-300 text-center font-mono text-2xl tracking-[0.3em]"
                />

              </div>

              {error && (
                <ErrorBox
                  message={error}
                />
              )}

              {success && (
                <div className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
                  {success}
                </div>
              )}

              <div className="flex gap-3">

                <button
                  type="button"
                  onClick={() => {
                    setStep('choose');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="px-4 py-3 rounded-xl text-ink-500"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={
                    busy ||
                    joinCode.length !== 6
                  }
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Join Space
                    </>
                  )}
                </button>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex gap-2">

      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

      <span>{message}</span>

    </div>
  );
}