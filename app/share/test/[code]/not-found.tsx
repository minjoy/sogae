'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">😅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          잘못된 링크입니다
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          공유 링크가 올바르지 않거나 만료되었어요.<br />
          직접 테스트를 해보시는 건 어떨까요?
        </p>
        <Button
          variant="primary"
          className="px-8 py-3 text-lg"
          onClick={() => router.push('/test')}
        >
          나도 테스트 해보기 →
        </Button>
      </div>
    </div>
  );
}
