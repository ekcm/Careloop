'use client';

import { useState, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUPABASE_URL';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserInfo {
  id: string;
  email: string;
  username: string;
}

export default function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (session: Session | null) => {
    if (!session?.user) {
      setUser({
        id: '',
        email: '',
        username: '',
      });
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();

    setUser({
      id: session.user.id || '',
      email: session.user.email ?? '',
      username: session.user.user_metadata.display_name ?? '',
    });
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => fetchProfile(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      fetchProfile(session)
    );
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
