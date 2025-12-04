export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <main className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            💰 Sogae (소개)
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            경제 성향 기반 매칭 서비스 MVP
          </p>
          <p className="text-gray-500">
            MBTI처럼 경제 성향을 3글자 코드로 분석하는 데이팅 서비스
          </p>
        </div>

        {/* Status */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">
              ✅ API 서버가 정상 작동 중입니다
            </p>
            <p className="text-green-600 text-sm mt-1">
              현재는 백엔드 API만 구현되어 있습니다 (프론트엔드 UI는 개발 예정)
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="font-bold text-lg mb-2">경제 성향 설문</h3>
            <p className="text-gray-600 text-sm">
              8개 문항으로 3글자 코드 생성 (SPL, CFR 등)
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="font-bold text-lg mb-2">회원가입/인증</h3>
            <p className="text-gray-600 text-sm">
              이메일 인증 + JWT 기반 인증
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">💕</div>
            <h3 className="font-bold text-lg mb-2">자동 매칭</h3>
            <p className="text-gray-600 text-sm">
              매일 9시 궁합 기반 5명 추천
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-3">💳</div>
            <h3 className="font-bold text-lg mb-2">연락처 공개</h3>
            <p className="text-gray-600 text-sm">
              상호 매칭 시 결제 후 공개
            </p>
          </div>
        </div>

        {/* Economic Types */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            🎯 경제 성향 8가지 타입
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['SPL', 'SPR', 'SFL', 'SFR', 'CPL', 'CPR', 'CFL', 'CFR'].map((type) => (
              <div key={type} className="bg-indigo-50 rounded-lg p-4 text-center border border-indigo-200">
                <div className="text-2xl font-bold text-indigo-600">{type}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {type[0] === 'S' ? '절약형' : '소비형'} +{' '}
                  {type[1] === 'P' ? '계획형' : '유연형'} +{' '}
                  {type[2] === 'L' ? '안정형' : '공격형'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Documentation */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            📡 API 엔드포인트
          </h2>

          <div className="space-y-6">
            {/* Auth APIs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg mb-4 text-blue-600">인증 API</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">POST</span>
                  <span className="text-gray-700">/api/auth/signup</span>
                  <span className="text-gray-500 text-xs">회원가입</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">POST</span>
                  <span className="text-gray-700">/api/auth/login</span>
                  <span className="text-gray-500 text-xs">로그인</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">GET</span>
                  <span className="text-gray-700">/api/auth/verify-email</span>
                  <span className="text-gray-500 text-xs">이메일 인증</span>
                </div>
              </div>
            </div>

            {/* Survey APIs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg mb-4 text-purple-600">설문 API</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">POST</span>
                  <span className="text-gray-700">/api/survey/complete</span>
                  <span className="text-gray-500 text-xs">설문 완료</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">GET</span>
                  <span className="text-gray-700">/api/survey/my-result</span>
                  <span className="text-gray-500 text-xs">내 결과 조회 🔒</span>
                </div>
              </div>
            </div>

            {/* Match APIs */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg mb-4 text-pink-600">매칭 API</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">POST</span>
                  <span className="text-gray-700">/api/match/preference</span>
                  <span className="text-gray-500 text-xs">매칭 설정 🔒</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">GET</span>
                  <span className="text-gray-700">/api/match/today-candidates</span>
                  <span className="text-gray-500 text-xs">오늘의 후보 🔒</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">POST</span>
                  <span className="text-gray-700">/api/match/select</span>
                  <span className="text-gray-500 text-xs">후보 선택 🔒</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">GET</span>
                  <span className="text-gray-700">/api/match/mutual</span>
                  <span className="text-gray-500 text-xs">상호 매칭 목록 🔒</span>
                </div>
              </div>
            </div>

            {/* Payment API */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-bold text-lg mb-4 text-orange-600">결제 API</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-3">
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-bold">POST</span>
                  <span className="text-gray-700">/api/payment/pay-for-match</span>
                  <span className="text-gray-500 text-xs">결제 시뮬레이션 🔒</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-sm text-yellow-800">
              <strong>🔒 = 인증 필요</strong>: Authorization 헤더에 JWT 토큰 필요
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              API 테스트는 Postman, Thunder Client, curl 등을 사용하세요
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>Made with ❤️ for economic matching</p>
          <p className="mt-2">
            <a
              href="https://github.com"
              className="text-indigo-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            {' · '}
            <a
              href="/api"
              className="text-indigo-600 hover:underline"
            >
              API Docs
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
