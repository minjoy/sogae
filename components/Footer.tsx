'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const [isCopied, setIsCopied] = useState(false);

  // 테스트 진행 중인 페이지에서만 Footer 숨김 (result 페이지는 제외)
  if (pathname?.startsWith('/test') && !pathname?.endsWith('/result')) {
    return null;
  }

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText('074-105458-01-014');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('계좌번호를 복사하지 못했습니다.');
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💕</span>
              <span className="text-xl font-bold text-primary-600">언연이</span>
            </div>
            <p className="text-sm text-gray-600">
              언제 연애하는게 이득일까?<br />
              현재의 마음 상태를 분석해서 연애할 타이밍을 알려드려요.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">💌 더 나은 서비스를 위해</h4>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-gray-600">
                ☕ 후원 계좌: 기업은행 074-105458-01-014
              </p>
              <button
                onClick={handleCopyAccount}
                className="px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors font-medium"
              >
                {isCopied ? '✓ 복사됨' : '복사'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-1">
              예금주: 강민종
            </p>
            <p className="text-xs text-gray-500">
              여러분의 소중한 후원은 더 정확하고 따뜻한 서비스를 만드는 데 사용됩니다.
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
          <p className="mb-1">
            이 결과는 참고용이며, 전문 심리 상담이나 의료 진단을 대체하지 않습니다.
          </p>
          <p>© 2026 언연이. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
