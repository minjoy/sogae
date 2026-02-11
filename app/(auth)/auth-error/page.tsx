'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ErrorInfo {
  title: string;
  message: string;
  showRetry: boolean;
  showHomeButton: boolean;
}

const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  age_restricted: {
    title: '성인 인증 실패',
    message: '마이타입은 만 20세 이상만 이용 가능한 서비스입니다. 카카오 계정의 생년월일을 확인해주세요.',
    showRetry: false,
    showHomeButton: true,
  },
  banned: {
    title: '이용 제한 계정',
    message: '회원님의 계정은 서비스 이용이 제한되었습니다.',
    showRetry: false,
    showHomeButton: true,
  },
  kakao_banned: {
    title: '가입 제한',
    message: '해당 카카오 계정은 서비스 이용이 제한되어 있습니다.',
    showRetry: false,
    showHomeButton: true,
  },
  OAuthCallback: {
    title: '로그인 오류',
    message: '카카오 로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    showRetry: true,
    showHomeButton: true,
  },
  AccessDenied: {
    title: '접근 거부',
    message: '카카오 로그인이 거부되었습니다. 필수 동의 항목을 확인해주세요.',
    showRetry: true,
    showHomeButton: true,
  },
  default: {
    title: '오류 발생',
    message: '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    showRetry: true,
    showHomeButton: true,
  },
};

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState<ErrorInfo>(ERROR_MESSAGES.default);
  const [banExpiry, setBanExpiry] = useState<string | null>(null);

  useEffect(() => {
    const errorCode = searchParams.get('error') || 'default';
    const bannedUntil = searchParams.get('bannedUntil');

    const info = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;
    setErrorInfo(info);

    // 정지 만료 시간 처리
    if (bannedUntil && bannedUntil !== 'permanent') {
      const expiryDate = new Date(bannedUntil);
      if (!isNaN(expiryDate.getTime())) {
        setBanExpiry(
          expiryDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      }
    } else if (bannedUntil === 'permanent') {
      setBanExpiry('영구 정지');
    }
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/login');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 에러 아이콘 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorInfo.title}</h1>
        </div>

        {/* 에러 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* 에러 메시지 */}
          <div className="bg-red-50 text-red-700 px-4 py-4 rounded-lg text-sm mb-4">
            <p className="leading-relaxed">{errorInfo.message}</p>
            {banExpiry && (
              <p className="mt-2 font-semibold">
                {banExpiry === '영구 정지'
                  ? '영구 정지된 계정입니다.'
                  : `정지 해제 예정: ${banExpiry}`}
              </p>
            )}
          </div>

          {/* 버튼 그룹 */}
          <div className="space-y-3">
            {errorInfo.showRetry && (
              <button
                onClick={handleRetry}
                className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-all"
              >
                다시 로그인하기
              </button>
            )}
            {errorInfo.showHomeButton && (
              <button
                onClick={handleGoHome}
                className="w-full py-4 px-6 border border-gray-300 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-50"
              >
                홈으로 돌아가기
              </button>
            )}
          </div>

          {/* 문의 안내 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              문제가 지속되면 고객센터로 문의해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
