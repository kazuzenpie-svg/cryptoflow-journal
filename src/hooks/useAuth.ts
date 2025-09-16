import { useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User as AppUser } from '@/types/database';

// Enhanced cache for user profile with better performance
let profileCache: { [key: string]: AppUser } = {};
let lastFetchTime: { [key: string]: number } = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (increased cache duration)

// Preload user session to avoid blocking
let sessionPromise: Promise<any> | null = null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const fetchProfile = useCallback(async (userId: string, forceRefresh = false) => {
    try {
      // Check cache first (unless force refresh)
      const now = Date.now();
      const cachedProfile = profileCache[userId];
      const lastFetch = lastFetchTime[userId];
      
      if (!forceRefresh && cachedProfile && lastFetch && (now - lastFetch) < CACHE_DURATION) {
        console.log('📦 Using cached profile for user:', userId);
        setProfile(cachedProfile);
        return cachedProfile;
      }

      console.log('🔄 Fetching fresh profile for user:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, username, bio, currency, avatar_url, trader_uid')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        throw error;
      }
      
      if (data) {
        const profileData = data as AppUser;
        // Update cache
        profileCache[userId] = profileData;
        lastFetchTime[userId] = now;
        setProfile(profileData);
        return profileData;
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      throw error;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      console.log('🚀 Initializing auth...');
      
      // Use cached session promise if available
      if (!sessionPromise) {
        sessionPromise = supabase.auth.getSession();
      }
      
      const { data: { session }, error } = await sessionPromise;
      
      if (error) {
        console.error('❌ Auth session error:', error);
        sessionPromise = null; // Clear cache on error
        throw error;
      }

      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('👤 User found, fetching profile...');
        // Fetch profile in parallel with UI rendering
        fetchProfile(session.user.id).catch(console.error);
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
      sessionPromise = null; // Clear cache on error
    } finally {
      setLoading(false);
      setInitializing(false);
      console.log('✅ Auth initialization complete');
    }
  }, [fetchProfile]);

  useEffect(() => {
    // Initialize auth on mount
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only fetch profile if we don't have it or user changed
          if (!profile || profile.id !== session.user.id) {
            await fetchProfile(session.user.id);
          }
        } else {
          setProfile(null);
          // Clear cache on logout
          profileCache = {};
          lastFetchTime = {};
        }
        
        if (!initializing) {
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [initializeAuth, initializing, profile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      console.log('🔄 Force refreshing profile...');
      await fetchProfile(user.id, true);
    }
  }, [user, fetchProfile]);

  const signUp = async (email: string, password: string, userData: { 
    role: 'trader' | 'investor';
    username: string;
  }) => {
    console.log('📝 Signing up user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Signing in user...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  const signOut = async () => {
    console.log('👋 Signing out user...');
    // Clear cache before sign out
    profileCache = {};
    lastFetchTime = {};
    
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Memoize computed values to prevent unnecessary re-renders
  const memoizedValues = useMemo(() => ({
    isAuthenticated: !!user,
    isTrader: profile?.role === 'trader',
    isInvestor: profile?.role === 'investor'
  }), [user, profile?.role]);

  return {
    user,
    profile,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    ...memoizedValues
  };
}