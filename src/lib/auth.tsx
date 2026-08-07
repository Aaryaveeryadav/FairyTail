/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import type {
  Session,
  User,
} from '@supabase/supabase-js';

import { supabase } from './supabase';
import type {
  Profile,
  Couple,
} from './types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  partner: Profile | null;
  couple: Couple | null;
  loading: boolean;
  profileError: string | null;

  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error: string | null }>;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;

  signOut: () => Promise<void>;

  refreshProfile: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [partner, setPartner] =
    useState<Profile | null>(null);

  const [couple, setCouple] =
    useState<Couple | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [profileError, setProfileError] =
    useState<string | null>(null);

  /*
   * =========================================================
   * LOAD PROFILE
   * =========================================================
   */

  const loadProfileData = async (
    userId: string
  ): Promise<void> => {
    try {
      setProfileError(null);

      console.log(
        '[AUTH] Loading profile:',
        userId
      );

      const {
        data: prof,
        error: profileFetchError,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileFetchError) {
        console.error(
          '[AUTH] Profile error:',
          profileFetchError
        );

        setProfile(null);
        setPartner(null);
        setCouple(null);

        setProfileError(
          profileFetchError.message ||
            'Unable to load profile.'
        );

        return;
      }

      if (!prof) {
        console.warn(
          '[AUTH] Profile does not exist:',
          userId
        );

        setProfile(null);
        setPartner(null);
        setCouple(null);

        return;
      }

      console.log(
        '[AUTH] Profile:',
        prof
      );

      setProfile(prof as Profile);

      /*
       * =====================================================
       * COUPLE
       * =====================================================
       */

      if (!prof.couple_id) {
        console.log(
          '[AUTH] User is not linked to a couple.'
        );

        setCouple(null);
        setPartner(null);

        return;
      }

      const {
        data: cpl,
        error: coupleError,
      } = await supabase
        .from('couples')
        .select('*')
        .eq('id', prof.couple_id)
        .maybeSingle();

      if (coupleError) {
        console.error(
          '[AUTH] Couple error:',
          coupleError
        );

        setCouple(null);

        setProfileError(
          coupleError.message ||
            'Unable to load couple.'
        );

        return;
      }

      if (!cpl) {
        console.warn(
          '[AUTH] Couple not found:',
          prof.couple_id
        );

        setCouple(null);
        setPartner(null);

        return;
      }

      console.log(
        '[AUTH] Couple loaded:',
        cpl
      );

      setCouple(cpl as Couple);

      /*
       * =====================================================
       * PARTNER
       * =====================================================
       */

      if (prof.partner_id) {
        console.log(
          '[AUTH] Loading partner:',
          prof.partner_id
        );

        const {
          data: part,
          error: partnerError,
        } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', prof.partner_id)
          .maybeSingle();

        if (partnerError) {
          console.error(
            '[AUTH] Partner error:',
            partnerError
          );

          setPartner(null);

          setProfileError(
            partnerError.message ||
              'Unable to load partner.'
          );

          return;
        }

        setPartner(
          (part as Profile | null) ?? null
        );

        console.log(
          '[AUTH] Partner loaded:',
          part
        );

        return;
      }

      /*
       * =====================================================
       * FALLBACK
       * =====================================================
       *
       * If partner_id has not yet been populated, try finding
       * the other member of the couple.
       */

      console.log(
        '[AUTH] partner_id is empty. Trying fallback.'
      );

      const {
        data: other,
        error: fallbackError,
      } = await supabase
        .from('profiles')
        .select('*')
        .eq('couple_id', prof.couple_id)
        .neq('id', prof.id)
        .maybeSingle();

      if (fallbackError) {
        console.error(
          '[AUTH] Partner fallback error:',
          fallbackError
        );

        setPartner(null);

        /*
         * Do not destroy the couple state just because
         * partner lookup is unavailable.
         */
        return;
      }

      setPartner(
        (other as Profile | null) ?? null
      );

      console.log(
        '[AUTH] Partner fallback:',
        other
      );

    } catch (error) {
      console.error(
        '[AUTH] Unexpected profile error:',
        error
      );

      setProfileError(
        error instanceof Error
          ? error.message
          : 'Unexpected authentication error.'
      );
    }
  };

  /*
   * =========================================================
   * INITIAL SESSION
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        console.log(
          '[AUTH] Initializing...'
        );

        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error(
            '[AUTH] Session error:',
            error
          );

          if (mounted) {
            setProfileError(error.message);
          }

          return;
        }

        if (!mounted) return;

        const currentSession =
          data.session ?? null;

        const currentUser =
          currentSession?.user ?? null;

        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          await loadProfileData(
            currentUser.id
          );
        }

      } catch (error) {
        console.error(
          '[AUTH] Initialization error:',
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    /*
     * =======================================================
     * AUTH STATE
     * =======================================================
     */

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (!mounted) return;

          console.log(
            '[AUTH] Event:',
            event
          );

          setSession(newSession);

          const newUser =
            newSession?.user ?? null;

          setUser(newUser);

          if (event === 'SIGNED_OUT') {
            setProfile(null);
            setPartner(null);
            setCouple(null);
            setProfileError(null);

            return;
          }

          if (newUser) {
            setTimeout(() => {
              if (!mounted) return;

              loadProfileData(
                newUser.id
              );
            }, 0);
          }
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * =========================================================
   * SIGN UP
   * =========================================================
   */

const signUp = async (
  email: string,
  password: string,
  displayName: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    console.error('Signup error:', error);

    return {
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      error: 'Account could not be created.',
    };
  }

  return {
    error: null,
  };
};

  /*
   * =========================================================
   * SIGN IN
   * =========================================================
   */

  const signIn = async (
    email: string,
    password: string
  ) => {
    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        return {
          error: error.message,
        };
      }

      if (data.user) {
        setSession(data.session);
        setUser(data.user);

        await loadProfileData(
          data.user.id
        );
      }

      return {
        error: null,
      };

    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to sign in.',
      };
    }
  };

  /*
   * =========================================================
   * SIGN OUT
   * =========================================================
   */

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setPartner(null);
      setCouple(null);
      setProfileError(null);
    }
  };

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   *
   * IMPORTANT:
   * Don't rely only on React's "user" state.
   */

  const refreshProfile = async () => {
    let currentUser = user;

    if (!currentUser) {
      const {
        data,
      } = await supabase.auth.getSession();

      currentUser =
        data.session?.user ?? null;

      if (currentUser) {
        setSession(
          data.session ?? null
        );

        setUser(currentUser);
      }
    }

    if (!currentUser) {
      console.warn(
        '[AUTH] refreshProfile: no user'
      );

      return;
    }

    console.log(
      '[AUTH] Refreshing:',
      currentUser.id
    );

    await loadProfileData(
      currentUser.id
    );
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        partner,
        couple,
        loading,
        profileError,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}