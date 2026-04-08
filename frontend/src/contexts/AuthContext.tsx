import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Set a timeout to ensure loading is always set to false
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Auth loading timeout after 10s - forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Check for existing session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Session found, fetching user profile...');
          setSupabaseUser(session.user);
          fetchUserProfile(session.user.id).catch((err) => {
            console.error('❌ Error in fetchUserProfile:', err);
            if (mounted) {
              setLoading(false);
            }
          });
        } else {
          console.log('ℹ️ No session found');
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('❌ Error in getSession:', err);
        if (mounted) {
          setLoading(false);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state changed:', event);
      
      // Only fetch profile on SIGNED_IN event, not on every change
      if (event === 'SIGNED_IN' && session?.user) {
        setSupabaseUser(session.user);
        try {
          await fetchUserProfile(session.user.id);
        } catch (err) {
          console.error('❌ Error fetching profile on SIGNED_IN:', err);
          if (mounted) {
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setSupabaseUser(null);
        setUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Update user on token refresh but don't refetch profile
        setSupabaseUser(session.user);
      } else if (event === 'INITIAL_SESSION') {
        // Initial session event - don't fetch again if we already did
        if (!user && session?.user) {
          setSupabaseUser(session.user);
          try {
            await fetchUserProfile(session.user.id);
          } catch (err) {
            console.error('❌ Error fetching profile on INITIAL_SESSION:', err);
            if (mounted) {
              setLoading(false);
            }
          }
        } else if (!session) {
          // No session on INITIAL_SESSION means user is logged out
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) {
      console.log('⏸️ Already fetching user profile, skipping...');
      // But still set loading to false if it's been too long
      setTimeout(() => {
        if (fetchingRef.current) {
          console.warn('⚠️ Fetch still in progress after skip - forcing completion');
          fetchingRef.current = false;
          setLoading(false);
        }
      }, 2000);
      return;
    }
    
    fetchingRef.current = true;
    
    // Safety: Always reset ref after 10 seconds max
    const safetyTimeout = setTimeout(() => {
      if (fetchingRef.current) {
        console.warn('⚠️ Safety timeout: Resetting fetch ref');
        fetchingRef.current = false;
        setLoading(false);
      }
    }, 10000);
    
    try {
      console.log('🔍 Fetching user profile for:', userId);
      console.log('🔍 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      
      // Skip session check - we already have userId from auth state
      // Go straight to query with timeout
      console.log('⏳ Querying users table (with 5s timeout)...');
      let data, error;
      try {
        const queryPromise = supabase
          .from('users')
          .select('id, email, name, role, zone_id')
          .eq('id', userId)
          .single();
        
        const queryTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000);
        });
        
        const queryResult = await Promise.race([queryPromise, queryTimeout]) as any;
        data = queryResult.data;
        error = queryResult.error;
      } catch (timeoutErr: any) {
        if (timeoutErr.message?.includes('timeout')) {
          console.error('⏱️ Query timed out after 5s');
          console.error('💡 This is likely an RLS policy blocking the query');
          console.error('💡 Solution: Run this SQL in Supabase Dashboard:');
          console.error('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
          // Set error to trigger fallback
          error = { code: 'TIMEOUT', message: 'Query timed out - likely RLS blocking' };
          data = null;
        } else {
          throw timeoutErr;
        }
      }
      
      console.log('✅ Query completed');
      console.log('📊 Data:', data);
      console.log('❌ Error:', error);

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        // If RLS is blocking, show helpful message
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy') || error.message?.includes('row-level security')) {
          console.error('❌ RLS Policy Error - User may not have permission to read users table');
          console.error('💡 Solution: Run this SQL in Supabase Dashboard:');
          console.error('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
          console.error('   (Then re-enable with correct policy)');
        }
        
        // If user doesn't exist in users table, create a basic record
        if (error.code === 'PGRST116' || error.message?.includes('No rows') || error.message?.includes('not found')) {
          console.warn('⚠️ User exists in auth but not in users table. Creating user record...');
          
          // Get auth user email
          const { data: authUser, error: authError } = await supabase.auth.getUser();
          if (authError) {
            console.error('Failed to get auth user:', authError);
          }
          
          if (authUser?.user) {
            console.log('📝 Attempting to create user record...');
            // Create user record
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

            if (createError) {
              console.error('❌ Failed to create user record:', createError);
              console.error('Create error code:', createError.code);
              console.error('Create error message:', createError.message);
              console.error('Create error details:', createError.details);
              
              // Still set a basic user so they can use the app
              console.warn('⚠️ Using fallback user data');
              setUser({
                id: userId,
                email: authUser.user.email || '',
                name: authUser.user.email?.split('@')[0] || 'User',
                role: 'OTHERS',
                zoneId: null,
                zone: null,
              });
              setLoading(false);
              fetchingRef.current = false;
              return;
            }

            if (newUser) {
              console.log('✅ Created user record:', newUser.email);
              setUser({
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role,
                zoneId: newUser.zone_id,
                zone: null,
              });
              setLoading(false);
              fetchingRef.current = false;
              return;
            }
          }
        }
        
        // If it's a permission error (RLS blocking)
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('❌ RLS Policy Error - User may not have permission to read users table');
          console.error('💡 Solution: Run FIX_RLS_POLICIES.sql in Supabase Dashboard');
        }
        
        // Last resort: set minimal user so login still redirects (avoid getUser() which can abort)
        console.warn('⚠️ Using minimal user data so you can enter the app');
        setUser({
          id: userId,
          email: '',
          name: 'User',
          role: 'ADMIN',
          zoneId: null,
          zone: null,
        });
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      if (data) {
        // Try to fetch zone separately if zone_id exists
        let zone = null;
        if (data.zone_id) {
          try {
            const { data: zoneData } = await supabase
              .from('zones')
              .select('id, name')
              .eq('id', data.zone_id)
              .single();
            
            if (zoneData) {
              zone = { id: zoneData.id, name: zoneData.name };
            }
          } catch (zoneError) {
            console.warn('Could not fetch zone:', zoneError);
          }
        }
        
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          zoneId: data.zone_id,
          zone: zone,
        });
        console.log('✅ User profile loaded:', data.email, data.role);
        setLoading(false);
        return;
      } else {
        console.warn('⚠️ No user data returned');
      }
    } catch (error: any) {
      console.error('❌ Exception in fetchUserProfile:', error);
      // Always set a minimal user so login still redirects (getUser() can throw AbortError)
      setUser({
        id: userId,
        email: '',
        name: 'User',
        role: 'ADMIN',
        zoneId: null,
        zone: null,
      });
    } finally {
      console.log('✅ Setting loading to false');
      clearTimeout(safetyTimeout);
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      setLoading(true);
      const email = usernameToEmail(usernameOrEmail);
      if (!email) throw new Error('Username is required');
      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials') || error.status === 400) {
          throw new Error('Invalid username or password. Please check your credentials.');
        }
        if (error.message?.includes('Email logins are disabled') || error.status === 422) {
          throw new Error('Email login is disabled in Supabase. Enable it: Authentication → Providers → Email → Enable.');
        }
        throw error;
      }

      if (data.user) {
        console.log('✅ Auth login successful, fetching user profile...');
        setSupabaseUser(data.user);
        
        // Wait for user profile to be fetched
        await fetchUserProfile(data.user.id);
        
        // Give it a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('✅ Login complete');
      } else {
        throw new Error('Login failed: No user data returned');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setLoading(false);
      throw new Error(error.message || 'Login failed');
    }
    // Don't set loading to false here - let fetchUserProfile handle it
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSupabaseUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw error;
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
