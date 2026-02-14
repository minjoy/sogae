'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  User,
  Heart,
  Sparkles,
  Cookie,
  Loader2,
  MessageCircle,
  Wallet,
  Zap,
  MessageSquare,
  Battery,
  ArrowRight,
} from 'lucide-react';

interface TestResult {
  testType: number;
  label: string;
  createdAt: string;
}

interface FaceResult {
  shareCode: string;
  score: number;
  gender: string;
}

interface Store {
  id: string;
  name: string;
  category: string;
  address: string;
  isHidden: boolean;
  createdAt: string;
}

const TEST_INFO: Record<number, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  1: { title: '감정 반응 패턴', icon: MessageCircle },
  2: { title: '소비 심리', icon: Wallet },
  3: { title: '일 처리 방식', icon: Zap },
  4: { title: '갈등 대처법', icon: MessageSquare },
  5: { title: '번아웃 체크', icon: Battery },
};

export default function MyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [faceResult, setFaceResult] = useState<FaceResult | null>(null);
  const [myStores, setMyStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 테스트 결과 조회
      const testRes = await fetch('/api/test/results');
      if (testRes.ok) {
        const testData = await testRes.json();
        if (testData.success) {
          setTestResults(testData.results);
        }
      }

      // 두쫀쿠 매장 조회
      const storeRes = await fetch('/api/my/stores');
      if (storeRes.ok) {
        const storeData = await storeRes.json();
        if (storeData.success) {
          setMyStores(storeData.stores);
        }
      }

      // 최근 관상 결과 (localStorage에서 faceAnalysisList 확인)
      const faceListStr = localStorage.getItem('faceAnalysisList');
      if (faceListStr) {
        try {
          const faceList = JSON.parse(faceListStr);
          if (Array.isArray(faceList) && faceList.length > 0) {
            // 가장 최근 분석 결과 가져오기
            const lastFace = faceList[faceList.length - 1];
            if (lastFace?.id) {
              const faceRes = await fetch(`/api/face/result/${lastFace.id}`);
              if (faceRes.ok) {
                const faceData = await faceRes.json();
                if (faceData.success) {
                  setFaceResult({
                    shareCode: lastFace.id,
                    score: faceData.result.score,
                    gender: faceData.result.gender,
                  });
                }
              }
            }
          }
        } catch {
          // JSON 파싱 오류 무시
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const completedTests = testResults.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 프로필 헤더 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                {session.user.profileImage ? (
                  <img
                    src={session.user.profileImage}
                    alt="프로필"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary-600" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {session.user.nickname}
                </h1>
                <p className="text-sm text-gray-500">
                  {session.user.region} · Lv.{session.user.level}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 언연이 기록 */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-500" /> 언연이 기록
            </h2>
            <span className="text-sm text-primary-600 font-medium">
              {completedTests}/5 완료
            </span>
          </div>

          {completedTests > 0 ? (
            <div className="space-y-3">
              {testResults.map((result) => (
                <Link
                  key={result.testType}
                  href={`/test/${result.testType}/result`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      {(() => {
                        const IconComponent = TEST_INFO[result.testType]?.icon;
                        return IconComponent ? <IconComponent className="w-5 h-5 text-primary-600" /> : null;
                      })()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {TEST_INFO[result.testType]?.title}
                      </p>
                      <p className="text-sm text-gray-500">{result.label}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}

              {completedTests < 5 && (
                <Link
                  href="/test"
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors"
                >
                  <span>+</span>
                  <span>남은 테스트 진행하기</span>
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/test"
              className="block text-center p-6 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
            >
              <p className="text-primary-600 font-medium">
                아직 테스트 기록이 없어요
              </p>
              <p className="text-sm text-primary-500 mt-1">
                언연이 테스트 시작하기 →
              </p>
            </Link>
          )}
        </section>

        {/* 최근 관상 */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" /> 최근 관상
            </h2>
          </div>

          {faceResult ? (
            <Link
              href={`/face-analysis/result/${faceResult.shareCode}`}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    관상 점수: {faceResult.score}점
                  </p>
                  <p className="text-sm text-gray-500">
                    자세한 분석 결과 보기
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </Link>
          ) : (
            <Link
              href="/face-analysis"
              className="block text-center p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <p className="text-purple-600 font-medium">
                아직 관상 분석 기록이 없어요
              </p>
              <p className="text-sm text-purple-500 mt-1">
                관상 분석 시작하기 →
              </p>
            </Link>
          )}
        </section>

        {/* 두쫀쿠맵 등록 관리 */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Cookie className="w-5 h-5 text-orange-500" /> 두쫀쿠맵 등록
            </h2>
            <Link
              href="/dujjonku-map"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              매장 등록하기 →
            </Link>
          </div>

          {myStores.length > 0 ? (
            <div className="space-y-3">
              {myStores.slice(0, 3).map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-gray-900">{store.name}</p>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                      {store.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {store.isHidden && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                        숨김
                      </span>
                    )}
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                      {store.category === 'dujjonku'
                        ? '두쫀쿠'
                        : store.category === 'dubai'
                        ? '두바이'
                        : '시그니처'}
                    </span>
                  </div>
                </div>
              ))}

              {myStores.length > 3 && (
                <p className="text-center text-sm text-gray-500">
                  외 {myStores.length - 3}개 매장
                </p>
              )}
            </div>
          ) : (
            <Link
              href="/dujjonku-map"
              className="block text-center p-6 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <p className="text-orange-600 font-medium">
                등록한 매장이 없어요
              </p>
              <p className="text-sm text-orange-500 mt-1">
                두쫀쿠 매장 등록하러 가기 →
              </p>
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
