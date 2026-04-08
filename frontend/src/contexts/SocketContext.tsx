import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeContextType {
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  useEffect(() => {
    if (!user) {
      // Disconnect all channels when user logs out
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setChannels([]);
      setConnected(false);
      return;
    }

    // Subscribe to cases changes
    const casesChannel = supabase
      .channel('cases-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cases',
        },
        (payload) => {
          toast.success(`New ${payload.new.type} case created`);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cases',
          filter: 'status=eq.CLOSED',
        },
        () => {
          toast.success('Case closed');
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
        }
      });

    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          toast.success(`${notification.title}: ${notification.message}`, {
            duration: 5000
          });
        }
      )
      .subscribe();

    setChannels([casesChannel, notificationsChannel]);

    return () => {
      // Cleanup channels on unmount
      supabase.removeChannel(casesChannel);
      supabase.removeChannel(notificationsChannel);
      setChannels([]);
      setConnected(false);
    };
  }, [user]);

  return (
    <RealtimeContext.Provider value={{ connected }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

// Keep useSocket for backward compatibility
export function useSocket() {
  const { connected } = useRealtime();
  return { socket: null, connected };
}
