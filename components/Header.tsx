'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  const isLoggedIn = status === 'authenticated' && !!session?.user;

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 메뉴 항목
  const menuItems = [
    { name: '언연이', href: '/test', emoji: '💕' },
    { name: '관상보기', href: '/face-analysis', emoji: '🔮' },
    { name: '두쫀쿠맵', href: '/dujjonku-map', emoji: '🍪' },
  ];

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 로고 + 로그인 버튼 영역 - 스크롤 시 숨김 */}
        <div
          className={`flex items-center justify-between overflow-hidden transition-all duration-300 ${
            isScrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-12 py-2 opacity-100'
          }`}
        >
          <Link
            href="/"
            className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <span className="text-xl font-bold text-primary-600">마이타입</span>
          </Link>

          {/* 로그인/MY 버튼 */}
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/my')}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-primary-50 text-primary-600 rounded-lg font-medium hover:bg-primary-100 transition-colors"
            >
              <span className="text-lg">👤</span>
              <span className="hidden sm:inline text-sm">MY</span>
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              로그인
            </button>
          )}
        </div>

        {/* 메뉴 영역 */}
        <div className="flex items-center justify-center py-2">
          <nav className="flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } text-sm sm:text-base`}
                >
                  <span className="text-base sm:text-lg">{item.emoji}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
