'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isLoggedIn = status === 'authenticated' && !!session?.user;

  // 메뉴 항목
  const menuItems = [
    { name: '언연이', href: '/test', emoji: '💕' },
    { name: '관상보기', href: '/face-analysis', emoji: '🔮' },
    { name: '두쫀쿠맵', href: '/dujjonku-map', emoji: '🍪' },
  ];

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* 왼쪽: 로고 + 메뉴 */}
          <div className="flex items-center gap-6">
            {/* 로고 */}
            <Link
              href="/"
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <span className="text-xl font-bold text-primary-600">마이타입</span>
            </Link>

            {/* 메뉴 */}
            <nav className="hidden sm:flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 오른쪽: 로그인/MY 버튼 */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/my')}
                className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors"
              >
                <span className="text-lg">👤</span>
                <span className="hidden sm:inline">MY</span>
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                로그인
              </button>
            )}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <nav className="flex sm:hidden items-center gap-1 mt-2 -mx-1 overflow-x-auto pb-1">
          {menuItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
