'use client';
import React, { useState, FC, ChangeEvent, MouseEvent, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUPABASE_URL';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * A simple notification component to display messages.
 */
const Notification: FC<{
  message: string;
  onClose: () => void;
  isError?: boolean;
}> = ({ message, onClose, isError }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed top-5 right-5 p-4 rounded-md shadow-lg text-white ${isError ? 'bg-red-500' : 'bg-blue-500'}`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 font-bold">
        X
      </button>
    </div>
  );
};

const AuthPage: FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    isError?: boolean;
  } | null>(null);

  /**
   * Effect hook to check for an active session and listen for auth state changes.
   */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Shows a notification message for a few seconds.
   */
  const showNotification = (message: string, isError: boolean = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  /**
   * Handles the user login process.
   * @param {MouseEvent<HTMLButtonElement>} e - The mouse event from the button click.
   */
  const handleLogin = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch {
      showNotification(
        'An error occurred while logging in. Please check your login details.',
        true
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the user signup process.
   * @param {MouseEvent<HTMLButtonElement>} e - The mouse event from the button click.
   */
  const handleSignup = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      showNotification('Check your email for the confirmation link!');
    } catch {
      showNotification(
        'An error occurred while signing up. Please check your details and try again.',
        true
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the user logout process.
   */
  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch {
      showNotification(
        'An error occurred while logging out. Please try again.',
        true
      );
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center p-4">
        <Notification
          message={notification?.message || ''}
          isError={notification?.isError}
          onClose={() => setNotification(null)}
        />
        <div className="w-full max-w-md p-8 space-y-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Welcome!</h1>
          <p className="text-gray-600">You are logged in as:</p>
          <p className="text-lg font-medium text-blue-400 break-all">
            {session.user.email}
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 mt-4 font-semibold text-white bg-red-400 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Log Out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center p-4">
      <Notification
        message={notification?.message || ''}
        isError={notification?.isError}
        onClose={() => setNotification(null)}
      />
      <div className="w-full max-w-md p-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-center text-gray-800">
            Welcome
          </h1>
          <p className="text-center text-gray-500 mt-2">
            Sign in or create an account.
          </p>
        </header>
        <form className="space-y-4">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>
          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>
          {/* Action Buttons */}
          <div className="flex flex-row gap-4 ">
            <button
              onClick={handleLogin}
              className="w-full h-full px-4 py-2 font-semibold text-white bg-blue-400 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
            <button
              onClick={handleSignup}
              className="w-full h-full px-4 py-2 font-semibold text-white bg-green-400 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
