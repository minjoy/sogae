'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
    setIsLoggedIn(false);
  };

  // /test 경로인지 확인
  const isTestPage = pathname?.startsWith('/test');

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">💝</span>
            <span className="text-xl font-bold text-primary-600">나마진</span>
          </button>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => router.push('/my')}
                  className="text-sm text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  마이페이지
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="text-sm text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  로그인
                </button>
                {!isTestPage && (
                  <button
                    onClick={() => router.push('/test')}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    시작하기
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
