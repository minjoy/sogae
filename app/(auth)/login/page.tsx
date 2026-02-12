'use client';

import { useEffect, useState, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 에러 메시지 처리
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'OAuthCallback':
          setError('카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
          break;
        case 'AccessDenied':
          setError('로그인이 거부되었습니다.');
          break;
        default:
          setError('로그인 중 오류가 발생했습니다.');
      }
    }
  }, [searchParams]);

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (!session.user.isOnboarded) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    }
  }, [session, status, router]);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn('kakao', {
        callbackUrl: '/onboarding',
      });
    } catch (err) {
      console.error('Kakao login error:', err);
      setError('카카오 로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto" />
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 로고 및 타이틀 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔮</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">마이타입</h1>
          <p className="text-gray-600">AI 관상 분석 서비스</p>
        </div>

        {/* 로그인 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* 카카오 로그인 버튼 */}
          <button
            onClick={handleKakaoLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900" />
                <span>로그인 중...</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 4C7.029 4 3 7.13 3 10.95C3 13.38 4.558 15.52 6.932 16.78L5.936 20.42C5.879 20.64 6.119 20.82 6.313 20.69L10.613 17.82C11.067 17.87 11.53 17.9 12 17.9C16.971 17.9 21 14.77 21 10.95C21 7.13 16.971 4 12 4Z"
                    fill="#191919"
                  />
                </svg>
                <span>카카오로 시작하기</span>
              </>
            )}
          </button>

          {/* 안내 문구 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              로그인 시{' '}
              <a href="/terms" className="text-blue-500 hover:underline">
                서비스 이용약관
              </a>
              {' '}및{' '}
              <a href="/privacy" className="text-blue-500 hover:underline">
                개인정보 처리방침
              </a>
              에 동의하게 됩니다.
            </p>
          </div>

          {/* 성인 인증 안내 */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-800 leading-relaxed">
              <span className="font-semibold">⚠️ 성인 전용 서비스</span>
              <br />
              카카오 계정의 생년월일 정보를 통해 만 20세 이상임을 확인합니다.
              미성년자는 서비스를 이용할 수 없습니다.
            </p>
          </div>
        </div>

        {/* 비회원 이용 안내 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/face-analysis')}
            className="text-gray-500 hover:text-gray-700 text-sm underline"
          >
            로그인 없이 관상 분석 체험하기
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto" />
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  );
}
