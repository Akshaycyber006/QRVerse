import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { clearLocalStore } from '../store/store';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const requireClient = () => {
  if (!supabase) throw new Error('Authentication is not configured. Set the Supabase URL and publishable key in .env.local.');
  return supabase;
};

const firstParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

const exchangeAuthCallback = async (url: string, client: NonNullable<typeof supabase>) => {
  const { queryParams } = ExpoLinking.parse(url);
  const errorDescription = firstParam(queryParams?.error_description) ?? firstParam(queryParams?.error);
  if (errorDescription) throw new Error(decodeURIComponent(errorDescription.replace(/\\+/g, ' ')));

  const code = firstParam(queryParams?.code);
  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const hashParams = new URLSearchParams(url.split('#')[1] ?? '');
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return;
  }

  throw new Error('Authentication callback did not contain a valid session.');
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));
  const activeCallback = useRef<string | null>(null);
  const callbackUrl = ExpoLinking.useLinkingURL();

  useEffect(() => {
    let mounted = true;
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !callbackUrl || !supabase) return;
    const { path, queryParams } = ExpoLinking.parse(callbackUrl);
    if (path !== 'auth/callback' && path !== 'callback') return;
    const callbackKey = firstParam(queryParams?.code) ?? callbackUrl;
    if (activeCallback.current === callbackKey) return;
    activeCallback.current = callbackKey;
    exchangeAuthCallback(callbackUrl, supabase).catch(() => {
      activeCallback.current = null;
    });
  }, [callbackUrl]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    if (AppState.currentState === 'active') client.auth.startAutoRefresh();
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await requireClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = requireClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: ExpoLinking.createURL('auth/callback') },
    });
    if (error) throw error;
    return !data.session;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const client = requireClient();
    const redirectTo = ExpoLinking.createURL('auth/callback');
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error('Google sign-in did not return an authorization URL.');

    if (Platform.OS === 'web') {
      window.location.assign(data.url);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && result.url) {
      const { queryParams } = ExpoLinking.parse(result.url);
      const code = queryParams?.code;
      if (typeof code !== 'string') throw new Error('Google sign-in returned no authorization code.');
      if (activeCallback.current !== code) {
        activeCallback.current = code;
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          activeCallback.current = null;
          throw exchangeError;
        }
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Google sign-in was cancelled.');
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await requireClient().auth.signOut();
    if (error) throw error;
    await clearLocalStore();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    session,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }), [loading, session, signIn, signUp, signInWithGoogle, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
};
