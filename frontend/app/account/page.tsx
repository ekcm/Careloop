'use client';
import React, { useState, FC, ChangeEvent, MouseEvent, useEffect } from 'react';
import { createClient, Session } from '@supabase/supabase-js';
import { UserPage } from '@/components/account-page/UserPage';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useT } from '@/hooks/useTranslation';
import { Notification } from '@/components/Notification';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'SUPABASE_URL';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthPage: FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    isError?: boolean;
  } | null>(null);

  // Translation hooks
  const welcomeText = useT('Welcome');
  const signInText = useT('Sign in or create an account.');
  const testText = useT('Text to be dynamically translated');

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      'http://localhost:3000/';
    url = url.startsWith('http') ? url : `https://${url}`;
    url = url.endsWith('/') ? url : `${url}/`;
    return url;
  };

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

    return () => {
      subscription.unsubscribe();
    };
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
   * Handles the Google login process.
   */
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getURL(),
        },
      });
      if (error) throw error;
      // After successful sign-in, Supabase redirects to your site.
      // The onAuthStateChange listener will handle setting the session.
    } catch {
      showNotification(
        'An error occurred while signing in with Google. Please try again.',
        true
      );
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
      <>
        <Notification
          message={notification?.message || ''}
          isError={notification?.isError}
          onClose={() => setNotification(null)}
        />
        <UserPage
          session={session}
          handleLogout={handleLogout}
          loading={loading}
        />
      </>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center p-4">
      {/* create a button on top right of the page to toggle translation */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />

        <p>{testText}</p>
      </div>

      <Notification
        message={notification?.message || ''}
        isError={notification?.isError}
        onClose={() => setNotification(null)}
      />
      <div className="w-full max-w-md p-8 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-center text-gray-800">
            {welcomeText}
          </h1>
          <p className="text-center text-gray-500 mt-2">{signInText}</p>
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
      <div className="relative flex items-center justify-center my-4">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-sm text-gray-400">OR</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      {/* Google Login Button */}
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center px-4 py-2 font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 max-w-sm"
        disabled={loading}
      >
        <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
          <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 8.841C34.435 4.962 29.522 3 24 3C12.955 3 4 11.955 4 23s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
          />
          <path
            fill="#FF3D00"
            d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l4.843-4.841C34.435 4.962 29.522 3 24 3 16.318 3 9.656 6.703 6.306 12.691z"
          />
          <path
            fill="#4CAF50"
            d="M24 43c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 35c-4.438 0-8.28-2.686-10.036-6.453l-6.571 4.819A19.927 19.927 0 0 0 24 43z"
          />
          <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C43.091 34.691 44 28.711 44 23c0-1.341-.138-2.65-.389-3.917z"
          />
        </svg>
        {loading ? 'Redirecting...' : 'Sign In with Google'}
      </button>
    </div>
  );
};

export default AuthPage;
