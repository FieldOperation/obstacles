import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { usernameToEmail } from '../lib/authConstants';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'WORKER' | 'OTHERS';
  zoneId?: string | null;
  zone?: {
    id: string;
    name: string;
  } | null;
}

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const timeoutId = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) {
          setLoading(false);
          return;
        }
        if (session?.user) {
          setSupabaseUser(session.user);
          fetchUserProfile(session.user.id).catch(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        try {
          await fetchUserProfile(session.user.id);
        } catch {
          if (mounted) setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setSupabaseUser(session.user);
      } else if (event === 'INITIAL_SESSION' && session?.user && !user) {
        setSupabaseUser(session.user);
        try {
          await fetchUserProfile(session.user.id);
        } catch {
          if (mounted) setLoading(false);
        }
      } else if (event === 'INITIAL_SESSION' && !session) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const safetyTimeout = setTimeout(() => {
      fetchingRef.current = false;
      setLoading(false);
    }, 10000);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, zone_id')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user) {
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: authUser.user.email || '',
                name: authUser.user.email?.split('@')[0] || 'User',
                role: 'OTHERS',
              })
              .select('id, email, name, role, zone_id')
              .single();

            if (!createError && newUser) {
              setUser({
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                zoneId: newUser.zone_id,
                zone: null,
              });
              return;
            }
          }
        }
        setUser({
          id: userId,
          email: '',
          name: 'User',
          role: 'OTHERS',
          zoneId: null,
          zone: null,
        });
        return;
      }

      if (data) {
        let zone = null;
        if (data.zone_id) {
          const { data: zoneData } = await supabase
            .from('zones')
            .select('id, name')
            .eq('id', data.zone_id)
            .single();
          if (zoneData) zone = { id: zoneData.id, name: zoneData.name };
        }
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          zoneId: data.zone_id,
          zone,
        });
      }
    } catch {
      setUser({
        id: userId,
        email: '',
        name: 'User',
        role: 'OTHERS',
        zoneId: null,
        zone: null,
      });
    } finally {
      clearTimeout(safetyTimeout);
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    const email = usernameToEmail(usernameOrEmail);
    if (!email) throw new Error('Username is required');

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials') || error.status === 400) {
          throw new Error('Invalid username or password. Please check your credentials.');
        }
        if (error.message?.includes('Email logins are disabled') || error.status === 422) {
          throw new Error('Email login is disabled. Contact your administrator.');
        }
        throw error;
      }

      if (data.user) {
        setSupabaseUser(data.user);
        await fetchUserProfile(data.user.id);
        import('../services/notificationService').then(({ registerPushToken }) =>
          registerPushToken().catch((e) => console.warn('Push registration:', e))
        );
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        throw new Error('Login failed: No user data returned');
      }
    } catch (error: any) {
      setLoading(false);
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSupabaseUser(null);
    } catch (error: any) {
      setUser(null);
      setSupabaseUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
