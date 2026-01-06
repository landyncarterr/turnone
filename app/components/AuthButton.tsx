'use client';

import { useState, useEffect } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === 'loading') {
    return (
      <div className="h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 hidden sm:inline">
          {session.user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium text-sm hover:bg-gray-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google', { callbackUrl: window.location.href })}
      className="px-4 py-2 bg-[#E10600] text-white rounded-lg font-medium text-sm hover:bg-[#C50500] focus:ring-2 focus:ring-[#E10600] transition-colors"
    >
      Sign In
    </button>
  );
}

