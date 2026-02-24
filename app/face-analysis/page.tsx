'use client';

import { useRouter } from 'next/navigation';
import FaceAnalysisToggle from '@/components/FaceAnalysisToggle';

export default function FaceAnalysisPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#EDF4F8' }}>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* 페이지 전환 토글 */}
        <FaceAnalysisToggle variant="light" />

        {/* 리뉴얼 안내 */}
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-sm w-full">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
              <span className="text-5xl">🔧</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              리뉴얼 중입니다
            </h1>

            <p className="text-gray-500 leading-relaxed mb-2">
              더 정확하고 재미있는 관상 분석을 위해
            </p>
            <p className="text-gray-500 leading-relaxed mb-6">
              서비스를 개선하고 있습니다.
            </p>

            <div className="bg-amber-50 rounded-xl p-4 mb-6">
              <p className="text-amber-700 text-sm font-medium">
                곧 새로운 모습으로 찾아뵙겠습니다!
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              🏠 홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
