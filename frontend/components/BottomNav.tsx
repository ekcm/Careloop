'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { ListTodo, User } from 'lucide-react';
import { useT } from '@/hooks/useTranslation'; // Import translation hook

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: ListTodo, label: useT('Home') },
    { href: '/account', icon: User, label: useT('Account') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white py-1.5 shadow-sm text-[11px] dark:bg-zinc-900 dark:border-zinc-700">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center transition-colors',
              'px-3 py-1 rounded-md',
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
