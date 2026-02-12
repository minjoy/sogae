import Link from 'next/link';

export const metadata = {
  title: '개인정보처리방침 | 마이타입',
  description: '마이타입 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">개인정보처리방침</h1>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed">
          <p className="text-gray-500 mb-6">시행일: 2024년 1월 1일</p>

          <p className="text-gray-700 mb-6">
            와하공방(이하 &quot;회사&quot;)은 개인정보보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고
            이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </p>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제1조 (개인정보의 수집 항목 및 수집 방법)</h2>
            <p className="text-gray-700 mb-3">1. 수집하는 개인정보 항목</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>필수항목: 카카오 계정 고유 식별자, 성별, 출생연도</li>
              <li>선택항목: 프로필 이미지, 닉네임</li>
              <li>서비스 이용 과정에서 자동 수집되는 정보: 서비스 이용 기록, 접속 로그, 기기 정보</li>
            </ul>
            <p className="text-gray-700 mt-3">2. 수집 방법</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>카카오 소셜 로그인을 통한 수집</li>
              <li>서비스 이용 과정에서 자동 수집</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제2조 (개인정보의 수집 및 이용 목적)</h2>
            <p className="text-gray-700 mb-3">회사는 다음의 목적을 위해 개인정보를 처리합니다:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>회원 가입 및 관리: 회원 식별, 서비스 이용 자격 확인, 연령 확인</li>
              <li>서비스 제공: 맞춤형 테스트 결과 제공, 서비스 이용 기록 관리</li>
              <li>서비스 개선: 서비스 이용 통계 분석, 신규 서비스 개발</li>
              <li>고객 지원: 민원 처리, 공지사항 전달</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>회원 정보: 회원 탈퇴 시까지 (탈퇴 후 즉시 파기)</li>
              <li>서비스 이용 기록: 회원 탈퇴 시까지</li>
              <li>관계 법령에 따른 보존 기간:
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                  <li>소비자 불만 또는 분쟁 처리에 관한 기록: 3년</li>
                  <li>접속에 관한 기록: 3개월</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제4조 (개인정보의 제3자 제공)</h2>
            <p className="text-gray-700">
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
              다만, 아래의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mt-2">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제5조 (개인정보의 파기)</h2>
            <p className="text-gray-700 mb-3">
              회사는 개인정보 보유 기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체 없이 해당 개인정보를 파기합니다.
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>파기 절차: 불필요한 개인정보는 개인정보 책임자의 승인을 받아 파기합니다.</li>
              <li>파기 방법: 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제6조 (이용자의 권리와 행사 방법)</h2>
            <p className="text-gray-700 mb-3">이용자는 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정·삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
              <li>회원 탈퇴</li>
            </ol>
            <p className="text-gray-700 mt-3">
              위 권리 행사는 서비스 내 설정 메뉴 또는 고객센터를 통해 가능합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제7조 (개인정보의 안전성 확보 조치)</h2>
            <p className="text-gray-700 mb-3">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>개인정보의 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>개인정보에 대한 접근 제한</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제8조 (개인정보 보호책임자)</h2>
            <p className="text-gray-700 mb-3">
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한
              이용자의 불만 처리 및 피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p><strong>개인정보 보호책임자</strong></p>
              <p>회사명: 와하공방</p>
              <p>이메일: privacy@waha.studio</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제9조 (개인정보처리방침의 변경)</h2>
            <p className="text-gray-700">
              본 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 수 있으며,
              변경 시에는 시행일 최소 7일 전에 서비스 내 공지사항을 통해 고지합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">제10조 (권익침해 구제방법)</h2>
            <p className="text-gray-700 mb-3">
              이용자는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회,
              한국인터넷진흥원 개인정보침해신고센터 등에 분쟁 해결이나 상담 등을 신청할 수 있습니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
              <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
              <li>대검찰청: 1301 (www.spo.go.kr)</li>
              <li>경찰청: 182 (ecrm.cyber.go.kr)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">부칙</h2>
            <p className="text-gray-700">본 개인정보처리방침은 2024년 1월 1일부터 시행됩니다.</p>
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
