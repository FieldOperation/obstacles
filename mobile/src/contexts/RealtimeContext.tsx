import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

interface RealtimeContextType {
  connected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      return;
    }

    const casesChannel = supabase
      .channel('cases-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cases' },
        (payload) => {
          Alert.alert('New Case', `New ${(payload.new as any).type} case created`);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases', filter: 'status=eq.CLOSED' },
        () => {
          Alert.alert('Case Closed', 'A case has been closed');
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnected(true);
      });

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
          const n = payload.new as any;
          Alert.alert(n.title || 'Notification', n.message || '');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(casesChannel);
      supabase.removeChannel(notificationsChannel);
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

export function useSocket() {
  const { connected } = useRealtime();
  return { socket: null, connected };
}
