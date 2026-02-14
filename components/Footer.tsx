'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Mail, Coffee } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();

  // 테스트 진행 중인 페이지에서만 Footer 숨김 (result 페이지는 제외)
  if (pathname?.startsWith('/test') && !pathname?.endsWith('/result')) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-6 h-6 text-primary-500" />
              <span className="text-xl font-bold text-primary-600">언연이</span>
            </div>
            <p className="text-sm text-gray-600">
              언제 연애하는게 이득일까?<br />
              현재의 마음 상태를 분석해서 연애할 타이밍을 알려드려요.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-primary-500" />
              더 나은 서비스를 위해
            </h4>
            <a
              href="https://litt.ly/miniface"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors font-medium text-sm"
            >
              <Coffee className="w-4 h-4" />
              서비스 고마워요, 후원하기
            </a>
            <p className="text-xs text-gray-500 mt-2">
              여러분의 소중한 후원은 더 정확하고 따뜻한 서비스를 만드는 데 사용됩니다.
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
          <p className="mb-2">
            이 결과는 참고용이며, 전문 심리 상담이나 의료 진단을 대체하지 않습니다.
          </p>
          <div className="flex justify-center gap-4 mb-2">
            <Link href="/terms" className="hover:text-gray-700 hover:underline">
              이용약관
            </Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-gray-700 hover:underline">
              개인정보처리방침
            </Link>
          </div>
          <p>© 2026 와하공방. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
