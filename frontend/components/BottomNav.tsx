'use client';

import { useEffect, useState, MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ListTodo, User } from 'lucide-react';
import { supabase } from '@/apis/supabaseApi';
import { toast } from 'sonner';
import { useT } from '@/hooks/useTranslation';

export default function BottomNav() {
  const pathname = usePathname();

  // Track session state
  const [hasSession, setHasSession] = useState(false);

  // Localised strings
  const homeLabel = useT('Home');
  const accountLabel = useT('Account');
  const loginFirstToast = useT('Please log in to access Home');

  // Fetch session once & subscribe to auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setHasSession(!!session)
    );
    return () => subscription.unsubscribe();
  }, []);

  const navItems = [
    { href: '/', icon: ListTodo, label: homeLabel, protected: true },
    { href: '/account', icon: User, label: accountLabel, protected: false },
  ];

  // Click handler for protected routes when signed out
  const handleProtectedClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!hasSession) {
      e.preventDefault();
      toast.error(loginFirstToast);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white py-1.5 shadow-sm text-[11px] dark:bg-zinc-900 dark:border-zinc-700">
      {navItems.map(({ href, icon: Icon, label, protected: isProtected }) => {
        const isActive = pathname === href;
        const disabled = isProtected && !hasSession;

        return (
          <Link
            key={href}
            href={
              disabled ? pathname : href
            } /* stay on the same page if disabled */
            onClick={disabled ? handleProtectedClick : undefined}
            aria-disabled={disabled}
            className={clsx(
              'flex flex-col items-center transition-colors px-3 py-1 rounded-md',
              disabled && 'cursor-not-allowed opacity-60',
              !disabled &&
                !isActive &&
                'text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white',
              isActive &&
                'text-blue-600 dark:text-blue-400 font-medium bg-blue-100/60 dark:bg-blue-900/40'
            )}
          >
            <Icon size={18} strokeWidth={1.6} />
            <span className="mt-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
