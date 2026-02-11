'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { validateNickname, generateRandomNickname } from '@/lib/nickname';

// 지역 목록
const REGIONS = [
  { code: 'seoul', name: '서울' },
  { code: 'gyeonggi', name: '경기' },
  { code: 'incheon', name: '인천' },
  { code: 'busan', name: '부산' },
  { code: 'daegu', name: '대구' },
  { code: 'daejeon', name: '대전' },
  { code: 'gwangju', name: '광주' },
  { code: 'ulsan', name: '울산' },
  { code: 'sejong', name: '세종' },
  { code: 'gangwon', name: '강원' },
  { code: 'chungbuk', name: '충북' },
  { code: 'chungnam', name: '충남' },
  { code: 'jeonbuk', name: '전북' },
  { code: 'jeonnam', name: '전남' },
  { code: 'gyeongbuk', name: '경북' },
  { code: 'gyeongnam', name: '경남' },
  { code: 'jeju', name: '제주' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: 닉네임/프로필
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState<boolean | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Step 2: 지역
  const [region, setRegion] = useState('서울');
  const [regionCode, setRegionCode] = useState('seoul');

  // 이미 온보딩이 완료된 경우 홈으로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isOnboarded) {
      router.push('/');
    }
  }, [session, status, router]);

  // 인증되지 않은 경우 로그인으로 리다이렉트
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 닉네임 중복 체크
  const checkNickname = useCallback(async (value: string) => {
    if (!value || value.length < 2) {
      setIsNicknameAvailable(null);
      return;
    }

    // 클라이언트 측 검증
    const validation = validateNickname(value);
    if (!validation.valid) {
      setNicknameError(validation.error || null);
      setIsNicknameAvailable(false);
      return;
    }

    setIsCheckingNickname(true);
    setNicknameError(null);

    try {
      const res = await fetch(`/api/users/check-nickname?nickname=${encodeURIComponent(value)}`);
      const data = await res.json();

      if (data.available) {
        setIsNicknameAvailable(true);
        setNicknameError(null);
      } else {
        setIsNicknameAvailable(false);
        setNicknameError(data.error || '이미 사용 중인 닉네임입니다.');
      }
    } catch {
      setNicknameError('닉네임 확인 중 오류가 발생했습니다.');
      setIsNicknameAvailable(null);
    } finally {
      setIsCheckingNickname(false);
    }
  }, []);

  // 닉네임 입력 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      if (nickname) {
        checkNickname(nickname);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [nickname, checkNickname]);

  // 랜덤 닉네임 생성
  const handleRandomNickname = () => {
    const randomNickname = generateRandomNickname();
    setNickname(randomNickname);
  };

  // 지역 선택
  const handleRegionSelect = (code: string, name: string) => {
    setRegionCode(code);
    setRegion(name);
  };

  // Step 1 완료
  const handleStep1Complete = () => {
    if (!nickname || !isNicknameAvailable) {
      setNicknameError('닉네임을 확인해주세요.');
      return;
    }
    setStep(2);
  };

  // 온보딩 완료
  const handleComplete = async () => {
    if (!nickname || !isNicknameAvailable) {
      setError('닉네임을 확인해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          region,
          regionCode,
          profileImage,
          isOnboarded: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || '프로필 저장에 실패했습니다.');
      }

      // 세션 업데이트
      await update();

      // 홈으로 이동
      router.push('/');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : '프로필 저장에 실패했습니다.');
    } finally {
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
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* 진행 상태 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 1 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${step >= 2 ? 'bg-yellow-500' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= 2 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            {step === 1 ? '프로필 설정' : '지역 선택'}
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {/* Step 1: 닉네임/프로필 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              프로필을 설정해주세요
            </h2>

            {/* 프로필 이미지 */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="프로필"
                      width={96}
                      height={96}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-4xl">👤</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  프로필 이미지 (선택)
                </p>
              </div>
            </div>

            {/* 닉네임 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                닉네임 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    nicknameError
                      ? 'border-red-300 focus:ring-red-200'
                      : isNicknameAvailable
                      ? 'border-green-300 focus:ring-green-200'
                      : 'border-gray-300 focus:ring-yellow-200'
                  }`}
                  maxLength={10}
                />
                {isCheckingNickname && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500" />
                  </div>
                )}
                {!isCheckingNickname && isNicknameAvailable && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    ✓
                  </div>
                )}
              </div>
              {nicknameError && (
                <p className="mt-1 text-sm text-red-500">{nicknameError}</p>
              )}
              {!nicknameError && isNicknameAvailable && (
                <p className="mt-1 text-sm text-green-500">사용 가능한 닉네임입니다.</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                2~10자, 한글/영문/숫자/언더스코어(_) 사용 가능
              </p>
            </div>

            {/* 랜덤 닉네임 버튼 */}
            <button
              type="button"
              onClick={handleRandomNickname}
              className="w-full py-2 px-4 mb-6 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
            >
              🎲 랜덤 닉네임 생성
            </button>

            {/* 다음 버튼 */}
            <button
              onClick={handleStep1Complete}
              disabled={!nickname || !isNicknameAvailable || isCheckingNickname}
              className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}

        {/* Step 2: 지역 선택 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              지역을 선택해주세요
            </h2>

            {/* 지역 그리드 */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => handleRegionSelect(r.code, r.name)}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    regionCode === r.code
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 px-6 border border-gray-300 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex-1 py-4 px-6 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    저장 중...
                  </span>
                ) : (
                  '시작하기'
                )}
              </button>
            </div>
          </div>
        )}

        {/* 안내 문구 */}
        <p className="mt-6 text-center text-xs text-gray-500">
          프로필 정보는 나중에 설정에서 변경할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
