import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uarbweqbrdcqtvmyzmvb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.error('⚠️ VITE_SUPABASE_ANON_KEY is not set!');
  console.error('Get it from: Supabase Dashboard → Settings → API → anon/public key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'obstacles-app',
    },
  },
});

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'ADMIN' | 'WORKER' | 'OTHERS';
          zone_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      zones: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['zones']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['zones']['Insert']>;
      };
      roads: {
        Row: {
          id: string;
          name: string;
          zone_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['roads']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['roads']['Insert']>;
      };
      developers: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['developers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['developers']['Insert']>;
      };
      cases: {
        Row: {
          id: string;
          type: 'OBSTACLE' | 'DAMAGE';
          status: 'OPEN' | 'CLOSED';
          zone_id: string;
          road_id: string;
          developer_id: string | null;
          description: string;
          planned_work: string | null;
          latitude: number;
          longitude: number;
          created_by_id: string;
          closed_by_id: string | null;
          closed_at: string | null;
          closure_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cases']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cases']['Insert']>;
      };
      photos: {
        Row: {
          id: string;
          case_id: string;
          closure_case_id: string | null;
          filename: string;
          original_name: string;
          mime_type: string;
          size: number;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['photos']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['photos']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          case_id: string | null;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      system_settings: {
        Row: {
          id: string;
          contractor_logo: string | null;
          owner_logo: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['system_settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['system_settings']['Insert']>;
      };
    };
  };
};
