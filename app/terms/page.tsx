import Link from 'next/link';

export const metadata = {
  title: '이용약관 | 마이타입',
  description: '마이타입 서비스 이용약관',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">이용약관</h1>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed">
          <p className="text-gray-500 mb-6">시행일: 2024년 1월 1일</p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제1조 (목적)</h2>
            <p className="text-gray-700">
              본 약관은 와하공방(이하 &quot;회사&quot;)이 제공하는 마이타입 서비스(이하 &quot;서비스&quot;)의
              이용조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제2조 (정의)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>&quot;서비스&quot;란 회사가 제공하는 심리 테스트, 관상 분석 등 모든 서비스를 의미합니다.</li>
              <li>&quot;회원&quot;이란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</li>
              <li>&quot;콘텐츠&quot;란 서비스에서 제공하는 테스트, 분석 결과, 텍스트, 이미지 등 모든 정보를 말합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
              <li>약관이 변경되는 경우 회사는 변경 내용을 시행일 7일 전부터 서비스 내 공지합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제4조 (서비스의 제공)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>회사는 다음과 같은 서비스를 제공합니다:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>심리 테스트 및 성격 분석 서비스</li>
                  <li>AI 기반 관상 분석 서비스</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ul>
              </li>
              <li>일부 서비스는 만 20세 이상 회원만 이용할 수 있습니다.</li>
              <li>회사는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 공지합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제5조 (회원가입)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>회원가입은 카카오 계정을 통한 소셜 로그인으로 진행됩니다.</li>
              <li>회원은 정확한 정보를 제공해야 하며, 허위 정보 제공 시 서비스 이용이 제한될 수 있습니다.</li>
              <li>회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>타인의 정보를 도용한 경우</li>
                  <li>이전에 서비스에서 제명된 경우</li>
                  <li>기타 회사가 정한 이용신청 요건을 충족하지 못한 경우</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제6조 (회원의 의무)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>회원은 서비스 이용 시 다음 행위를 해서는 안 됩니다:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>타인의 정보 도용</li>
                  <li>서비스 운영 방해</li>
                  <li>타인의 명예 훼손 또는 불이익을 주는 행위</li>
                  <li>저작권 등 지적재산권 침해</li>
                  <li>기타 불법적이거나 부당한 행위</li>
                </ul>
              </li>
              <li>회원은 본 약관 및 관계법령을 준수해야 합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제7조 (서비스 이용제한)</h2>
            <p className="text-gray-700">
              회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우,
              경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제8조 (면책조항)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>서비스에서 제공하는 테스트 결과 및 분석 내용은 오락 및 참고 목적으로만 제공됩니다.</li>
              <li>서비스의 결과는 전문적인 심리 상담, 의료 진단, 법적 조언을 대체하지 않습니다.</li>
              <li>회사는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제9조 (저작권)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>서비스 내 콘텐츠에 대한 저작권은 회사에 귀속됩니다.</li>
              <li>회원은 서비스를 통해 얻은 정보를 회사의 사전 승낙 없이 상업적으로 이용할 수 없습니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제10조 (분쟁해결)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>회사와 회원 간 분쟁이 발생한 경우, 양 당사자는 원만한 해결을 위해 성실히 협의합니다.</li>
              <li>협의가 이루어지지 않을 경우, 관할 법원은 회사 소재지 관할 법원으로 합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">부칙</h2>
            <p className="text-gray-700">본 약관은 2024년 1월 1일부터 시행됩니다.</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← 로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
