'use client';

import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💝</span>
              <span className="text-xl font-bold text-primary-600">나마진</span>
            </div>
            <p className="text-sm text-gray-600">
              나를 진단하고, 마음이 준비되면 시작하세요.<br />
              진심 어린 마음으로 여러분의 행복을 응원해요.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">💌 더 나은 서비스를 위해</h4>
            <p className="text-sm text-gray-600 mb-1">
              ☕ 후원 계좌: 기업은행 074-105458-01-014
            </p>
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
          <p>© 2026 나마진. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
