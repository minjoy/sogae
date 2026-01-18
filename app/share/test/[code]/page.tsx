'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { decodeTestResult, TEST_INFO } from '@/lib/share-code';
import Button from '@/components/Button';

interface DecodedResult {
  t: number;
  p: string;
  s?: string;
  c?: string;
  sc?: { n: string; v: number }[];
}

// 테스트 타입별 상세 설명 (실제 스코어링 결과 라벨과 일치)
const TYPE_DESCRIPTIONS: Record<number, Record<string, {
  desc: string;
  emoji: string;
  tip: string;
  comment: string;
  idealPartner: string;
  partnerDesc: string;
}>> = {
  1: { // 감정 타입 테스트
    '안정형': {
      desc: '답장 안 와도 "바쁘겠지"하고 기다릴 수 있는 희귀종',
      emoji: '🌟',
      tip: '안정적인 연애가 가능한 타입!',
      comment: '당신은 희귀종입니다. 답장 안 와도 "바쁘겠지"하고 기다릴 수 있고, 붙어 있어도 숨 안 막혀요. 하지만 조심하세요. 상대가 불안형/회피형일 경우, 당신의 "편안함"이 그들에겐 "관심 없음"으로 읽힐 수 있어요. 당신은 괜찮아도 상대는 불안할 수 있다는 걸 기억하세요.',
      idealPartner: '대부분의 유형과 호환',
      partnerDesc: '당신은 어떤 유형과도 잘 맞을 수 있어요. 특히 불안형이나 회피형 파트너를 만나면 그들에게 안정감을 줄 수 있습니다. 같은 안정형을 만나면 가장 편안한 관계가 됩니다.'
    },
    '불안형': {
      desc: '답장 3시간만 늦어도 "나 싫어진 거 아니야?" 생각하는 타입',
      emoji: '💗',
      tip: '깊은 감정 교류를 원하는 타입',
      comment: '솔직히 말하면, 답장 3시간만 늦어도 "나 싫어진 거 아니야?"라고 생각해본 적 있죠? 이건 약점이 아니라 신호예요. 연애할 때 안정감을 충전하는 속도가 빠르게 소모된다는 뜻. 상대의 "좋아해"를 듣고도 며칠 지나면 또 확인하고 싶어지는 이유입니다.',
      idealPartner: '안정형 상대',
      partnerDesc: '답장 늦어도 "바쁘겠지" 하고 기다릴 수 있는 사람. 당신의 확인 욕구에 귀찮아하지 않고 "괜찮아, 좋아해"라고 꾸준히 말해줄 수 있는 파트너가 이상적이에요.'
    },
    '회피형': {
      desc: '"혼자 있고 싶어"를 말하면 서운해할까 봐 잠수 타는 타입',
      emoji: '🦋',
      tip: '천천히 다가가면 마음을 열어요',
      comment: '"혼자 있고 싶어"를 말하면 상대가 서운해할까 봐 그냥 잠수 타버린 적, 있죠? 당신은 나쁜 사람이 아니에요. 다만 감정 처리 시스템이 "혼자 모드"로 설정되어 있을 뿐. 문제는 상대가 그걸 "냉정함"으로 오해한다는 거예요. 달아나기 전에 5초만 말해보세요.',
      idealPartner: '안정형 또는 독립적인 상대',
      partnerDesc: '당신의 "혼자 시간"을 이해하고 존중해주는 사람. 매번 "왜 연락 안 해?"라고 추궁하지 않고, 적당한 거리감을 편하게 유지할 수 있는 파트너가 좋아요.'
    },
    '혼합형 (불안+회피)': {
      desc: '"보고 싶다"고 연락했다가 만나면 "숨 막혀"지는 복잡한 타입',
      emoji: '🎭',
      tip: '이해와 인내가 필요한 타입',
      comment: '가장 복잡한 유형. "보고 싶다"고 연락했다가 만나면 "숨 막혀"지는 모순. 이게 바로 밀당의 정체예요. 상대는 "도대체 뭘 원해?"라고 혼란스럽고, 당신도 스스로 이해 못 해서 지쳐요. 하지만 이건 패턴일 뿐, 당신 자체가 문제는 아닙니다.',
      idealPartner: '매우 안정적인 상대',
      partnerDesc: '당신의 밀고 당기기에 흔들리지 않고 일관된 태도를 유지할 수 있는 사람. "오늘은 멀리 있고 싶어도 내일은 다시 올 거야"라고 믿고 기다려줄 수 있는 파트너가 필요해요.'
    },
  },
  2: { // 소비 성향 심리
    '위로형': {
      desc: '짜증나면 결제창 열리는 타입',
      emoji: '💆',
      tip: '감정과 지갑을 분리하세요!',
      comment: '짜증나면 결제창 열리죠? "화났는데 배달비 5,000원? 걍 시킨다" 이게 당신입니다. 문제는 감정과 지갑이 직통으로 연결돼 있다는 거예요. 스트레스 받을 때마다 쇼핑몰 켜는 습관, 이거 연애하면 "싸우고 나서 충동구매" 패턴으로 이어집니다.',
      idealPartner: '통제형 또는 안정적인 소비 스타일',
      partnerDesc: '당신이 감정적으로 지출하려 할 때 "잠깐, 진짜 필요해?"라고 부드럽게 물어봐줄 수 있는 사람. 하지만 너무 잔소리하지 않고 가끔은 함께 "오늘은 쓰자!"라고 할 수 있는 유연함도 필요해요.'
    },
    '인정형': {
      desc: '소개팅 전날 옷 새로 사는 타입',
      emoji: '👔',
      tip: '있는 그대로의 나도 충분해요',
      comment: '솔직하게 물어볼게요. 소개팅 전날 옷 새로 산 적 있죠? "좋아 보여야 해"라는 압박이 지갑을 엽니다. 문제는 관계가 시작되면 "계속 좋아 보여야 해"로 이어진다는 거예요. 선물, 데이트 비용, 외모 관리... 인정받으려고 쓴 돈은 나중에 원망으로 돌아와요.',
      idealPartner: '있는 그대로를 인정해주는 상대',
      partnerDesc: '"비싼 거 안 사도 돼, 네가 좋아"라고 진심으로 말해주는 사람. 외모나 소유물보다 당신 자체를 봐주고, 과시하지 않아도 인정받는다는 걸 느끼게 해줄 파트너가 좋아요.'
    },
    '통제형': {
      desc: '예산표 없이는 못 사는 타입',
      emoji: '📊',
      tip: '가끔은 즉흥도 괜찮아요!',
      comment: '예산표 없이는 못 사는 타입. 통장 쪼개기, 가계부 앱 3개 깔려 있죠? 문제는 상대가 "갑자기 제주도 갈래?"라고 하면 당신은 멘붕 온다는 거예요. "예산에 없는데..."라고 말하면 상대는 "재미없다"고 느끼고, 당신은 답답해합니다.',
      idealPartner: '비슷하거나 약간 유연한 소비 스타일',
      partnerDesc: '같이 가계부 쓰고, 예산 회의하는 게 즐거운 사람. 또는 당신의 계획을 존중하면서도 가끔 "오늘은 예산 잊자"라고 유연하게 제안할 수 있는 파트너도 좋아요.'
    },
    '충동형': {
      desc: '"할인 끝나기 3시간 전!"에 약한 타입',
      emoji: '⚡',
      tip: '결제 전 24시간 대기가 필요해요',
      comment: '"할인 끝나기 3시간 전!" 이 문구에 약하죠? 쿠폰, 타임딜, 마감 임박... 이런 말만 보면 이성이 증발합니다. 장바구니에 담았던 거 "지금 아니면 손해"라고 생각하고 결제 누르는 순간, 당신은 이미 마케팅의 노예예요.',
      idealPartner: '통제형 또는 균형 잡힌 상대',
      partnerDesc: '당신이 "이거 사야 해!"라고 할 때 "진짜 필요해? 내일 다시 생각해보자"라고 브레이크 걸어줄 수 있는 사람. 하지만 매번 잔소리가 아니라 유머로 말해주는 센스도 필요해요.'
    },
  },
  3: { // 일 처리 방식
    '계획형': {
      desc: '약속 시간 10분 전 도착이 기본인 타입',
      emoji: '📅',
      tip: '계획 틀어져도 괜찮아요!',
      comment: '당신은 "약속 시간 10분 전 도착"이 기본이고, 캘린더 없으면 불안한 사람. 문제는 상대가 "어 깜빡했어 ㅠ 30분만 늦을게"라고 하면 당신 머릿속에서 일정이 폭발한다는 거예요. "계획 틀어짐 = 나를 무시함"으로 읽히거든요.',
      idealPartner: '비슷한 계획형 또는 존중하는 상대',
      partnerDesc: '약속 시간 잘 지키고, 일정 공유하는 게 자연스러운 사람. 또는 즉흥적이더라도 "나 때문에 계획 바뀌면 미안하니까 미리 말할게"라고 배려해주는 파트너도 좋아요.'
    },
    '탐색형': {
      desc: '"지금 당장 답 줘"를 제일 싫어하는 타입',
      emoji: '🔍',
      tip: '중간 보고도 중요해요!',
      comment: '당신은 "지금 당장 답 줘"를 제일 싫어하죠. "생각 좀 해볼게"가 입버릇인데, 상대는 "왜 이렇게 답답해?"라고 느낍니다. 문제는 고민이 길어질수록 상대는 "관심 없나 봐"라고 오해한다는 거예요. 당신은 신중한 거지만, 상대는 회피로 읽습니다.',
      idealPartner: '기다려줄 수 있는 상대',
      partnerDesc: '"천천히 생각해도 돼"라고 기다려주면서도, 가끔 "여기까지 어때?"라고 부드럽게 결정을 도와줄 수 있는 사람. 당신의 신중함을 "무관심"이 아니라 "진지함"으로 이해해주는 파트너.'
    },
    '즉흥형': {
      desc: '"갑자기 부산 갈래?" 이게 당신인 타입',
      emoji: '🎲',
      tip: '상대 일정도 체크해주세요!',
      comment: '"갑자기 부산 갈래?" 이게 당신입니다. 계획? 그런 거 없어요. 떠오르면 바로 실행. 문제는 상대가 "어... 나 내일 약속 있는데"라고 하면 당신은 "재미없다"고 느낀다는 거예요. 당신의 즉흥성은 매력이지만, 상대에겐 "배려 없음"으로 읽힙니다.',
      idealPartner: '유연하고 적응력 있는 상대',
      partnerDesc: '"갑자기? 좋아 가자!"라고 함께 뛸 수 있는 사람. 또는 평소엔 계획적이지만 가끔 당신의 즉흥 제안에 "오늘은 따라갈게"라고 할 수 있는 유연한 파트너도 좋아요.'
    },
    '마감형': {
      desc: '데드라인이 가까워져야 집중력 폭발하는 타입',
      emoji: '⏰',
      tip: '바쁠 때 미리 공지해주세요!',
      comment: '당신은 마감 앞두면 연락 끊기는 사람. "바쁘니까 이해하겠지" 생각하는데, 상대는 "나한테 관심 없나 봐"라고 불안해합니다. 3일 동안 "ㅇㅋ" 한 글자만 보내면 상대는 "뭔가 잘못했나?"라고 생각해요. 당신은 일에 몰입한 것뿐인데, 상대는 거리감을 느낍니다.',
      idealPartner: '독립적이고 이해심 있는 상대',
      partnerDesc: '당신이 바쁠 때 "연락 없어도 괜찮아, 힘내"라고 기다려줄 수 있는 사람. 자기만의 일이나 취미가 있어서 당신 연락에 매달리지 않는 독립적인 파트너가 좋아요.'
    },
  },
  4: { // 갈등 대화 스타일
    '회피형': {
      desc: '싸움 날 것 같으면 "나 화장실"하고 도망치는 타입',
      emoji: '🚪',
      tip: '도망치기 전 한마디만 해주세요!',
      comment: '싸우기 시작하면 "나 화장실" 하고 도망치는 사람. 당신은 "일단 피하고 나중에 생각하자" 모드인데, 상대는 "대화 중단 = 무시"로 받아들입니다. 문제는 나중에 절대 먼저 꺼내지 않는다는 거예요. 그래서 문제는 쌓이고, 어느 날 상대가 폭발합니다.',
      idealPartner: '차분하고 기다려주는 상대',
      partnerDesc: '"시간 필요하면 기다릴게"라고 여유 있게 말해주는 사람. 당신이 도망쳐도 쫓아오지 않고, 돌아올 때까지 기다려주면서 "이제 얘기할 수 있어?"라고 부드럽게 물어봐주는 파트너.'
    },
    '공격형': {
      desc: '화나면 말이 칼이 되는 타입',
      emoji: '🔥',
      tip: '말하기 전 3초만 숨 고르세요!',
      comment: '화나면 말이 칼이 되는 사람. "너 때문에 다 망했어!" 이런 말, 싸울 때 한 번쯤 했죠? 당신은 순간 감정을 터뜨린 건데, 상대는 그 말을 평생 기억합니다. 문제는 당신도 나중에 후회한다는 거예요. 상대는 "저 사람 본심이 그거구나"라고 받아들입니다.',
      idealPartner: '흔들리지 않는 안정적인 상대',
      partnerDesc: '당신이 화내도 같이 흥분하지 않고 "일단 진정하고 얘기하자"라고 말할 수 있는 사람. 당신의 말에 상처받지 않을 만큼 단단하면서도, 나중에 "아까 그건 좀 심했어"라고 피드백 줄 수 있는 파트너.'
    },
    '설득형': {
      desc: '"객관적으로 봤을 때..." 논리로 이기려는 타입',
      emoji: '💬',
      tip: '해결책 전에 감정 인정 먼저!',
      comment: '당신은 싸울 때 "논리"로 이기려는 사람. "객관적으로 봤을 때..." 이런 말 자주 하죠? 문제는 상대는 논리가 아니라 "내 감정 좀 알아줘"를 원한다는 거예요. 당신이 팩트를 늘어놓을수록 상대는 "내 마음은 관심 없나 봐"라고 느낍니다.',
      idealPartner: '논리와 감정 모두 표현하는 상대',
      partnerDesc: '당신의 논리를 이해하면서도 "근데 나는 이렇게 느꼈어"라고 감정도 표현할 수 있는 사람. 토론이 건강한 대화가 될 수 있게 함께 만들어갈 수 있는 파트너.'
    },
    '수용형': {
      desc: '"괜찮아"가 입버릇인 양보 타입',
      emoji: '🤝',
      tip: '본인 의견도 표현해야 건강해요!',
      comment: '당신은 "괜찮아"가 입버릇. 싸우면 일단 사과하고, 상대 기분 맞춰주고, 내 불편은 삼킵니다. 문제는 참고 참다가 어느 날 "나는 항상 양보만 해!"라고 폭발한다는 거예요. 상대는 "갑자기 왜 그래?"라고 당황하고, 당신은 억울해합니다.',
      idealPartner: '당신 의견을 물어봐주는 상대',
      partnerDesc: '"너는 어떻게 생각해?"라고 먼저 물어봐주고, 당신이 양보하려 할 때 "진짜 괜찮아? 네 생각도 중요해"라고 확인해주는 사람. 당신의 배려를 당연시하지 않는 파트너.'
    },
  },
  5: { // 번아웃 위험도
    '안정 ✅': {
      desc: '지금 연애할 에너지가 있는 상태!',
      emoji: '🔋',
      tip: '지금 연애 시작하기 좋은 상태!',
      comment: '당신은 지금 연애할 에너지가 있는 상태. 아침에 일어나도 피곤하지 않고, "주말에 뭐하지?"라는 생각이 들면 실제로 약속을 잡을 여유가 있어요. 이 상태일 때 새로운 사람을 만나면 관계가 즐겁게 시작됩니다. 에너지가 있을 때 시작하세요.',
      idealPartner: '다양한 에너지 레벨과 호환',
      partnerDesc: '지금 당신은 어떤 상대와도 함께할 에너지가 있어요. 같이 활동적인 사람과 만나면 즐겁고, 조용한 사람과 만나도 배려할 여유가 있습니다.'
    },
    '주의 ⚠️': {
      desc: '피곤하지만 연애는 가능한 상태',
      emoji: '⚡',
      tip: '자기 관리와 함께 연애해요',
      comment: '솔직히 말할게요. 당신 지금 피곤한 거 맞죠? "괜찮아"라고 하지만 주말에도 쉰 것 같지 않고, 약속 잡으면 "또 나가야 해?"라는 생각 들 때 있어요. 연애는 가능하지만, 지금 상태로 무리하면 상대에게 "요즘 왜 그래?"라는 말 듣게 됩니다.',
      idealPartner: '이해심 있고 여유로운 상대',
      partnerDesc: '"오늘 피곤해? 그럼 집에서 쉬자"라고 이해해주는 사람. 매번 "나가자, 뭐하자"가 아니라 가끔은 함께 쉴 줄 아는 파트너가 좋아요.'
    },
    '위험 🔴': {
      desc: '지금은 나를 돌보는 시간이 필요해요',
      emoji: '🪫',
      tip: '충분히 쉬고 에너지 충전!',
      comment: '지금 당신은 탈진 직전입니다. "그냥 누워있고 싶다"는 생각이 자주 들고, 친구 연락도 귀찮아요. 이 상태에서 연애하면 상대가 "에너지 뱀파이어"처럼 느껴집니다. 상대가 나쁜 게 아니라, 당신이 비어 있는 거예요. 지금은 연애 말고 나를 채울 시간.',
      idealPartner: '지금은 연애보다 회복이 먼저',
      partnerDesc: '솔직히 말하면, 지금 상태에서 만나는 건 추천하지 않아요. 어떤 좋은 상대를 만나도 당신이 에너지가 없으면 부담으로 느껴질 거예요.'
    },
  },
};

export default function SharedTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [result, setResult] = useState<DecodedResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (code) {
      const decoded = decodeTestResult(code);
      if (decoded) {
        setResult(decoded);
      } else {
        setError(true);
      }
    }
  }, [code]);

  // 메타태그 동적 업데이트
  useEffect(() => {
    if (result) {
      const testInfo = TEST_INFO[result.t];
      const title = `${testInfo?.title || '테스트'} 결과 | 마이타입`;
      const description = `나의 유형: ${result.p}${result.s ? ` - ${result.s}` : ''}`;

      document.title = title;

      updateMetaTag('property', 'og:title', title);
      updateMetaTag('property', 'og:description', description);
      updateMetaTag('property', 'og:type', 'article');
      updateMetaTag('property', 'og:site_name', '마이타입 - 나만의 연애 사용설명서');
    }
  }, [result]);

  const updateMetaTag = (attr: string, key: string, content: string) => {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            잘못된 링크입니다
          </h1>
          <p className="text-gray-600 mb-6">
            공유 링크가 올바르지 않거나 만료되었습니다.
          </p>
          <Button onClick={() => router.push('/test')}>
            나도 테스트 해보기
          </Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const testInfo = TEST_INFO[result.t];
  const typeDetail = TYPE_DESCRIPTIONS[result.t]?.[result.p];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 헤더 - 더 임팩트 있게 */}
        <div className="text-center mb-6">
          <div className="inline-block bg-primary-100 text-primary-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            친구의 테스트 결과
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {testInfo?.title || '심리 테스트'}
          </h1>
        </div>

        {/* 메인 결과 카드 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border border-gray-100">
          {/* 타입 헤더 */}
          <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 p-8 text-center text-white relative overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4"></div>
            </div>

            <div className="relative">
              <div className="text-7xl mb-4">{typeDetail?.emoji || testInfo?.emoji || '✨'}</div>
              <div className="inline-block bg-white/25 backdrop-blur-sm px-8 py-4 rounded-2xl mb-3">
                <span className="text-3xl md:text-4xl font-bold">{result.p}</span>
              </div>
              {result.s && (
                <div className="inline-block bg-white/15 px-4 py-2 rounded-full text-lg ml-2">
                  {result.s}
                </div>
              )}
              {typeDetail?.desc && (
                <p className="mt-4 text-lg opacity-95 max-w-md mx-auto">
                  {typeDetail.desc}
                </p>
              )}
            </div>
          </div>

          {/* 연애 팁 */}
          {typeDetail?.tip && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-5 border-b border-yellow-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <p className="text-yellow-800 font-medium">{typeDetail.tip}</p>
              </div>
            </div>
          )}

          {/* 전문가 코멘트 */}
          {typeDetail?.comment && (
            <div className="p-6 md:p-8 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <span className="text-xl">🎓</span>
                전문가 분석
              </h3>
              <div className="bg-blue-50 rounded-xl p-5">
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                  {typeDetail.comment}
                </p>
              </div>
            </div>
          )}

          {/* 나와 어울리는 연애 상대 */}
          {typeDetail?.idealPartner && (
            <div className="p-6 md:p-8 bg-gradient-to-br from-pink-50 to-purple-50 border-b border-pink-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <span className="text-xl">💕</span>
                나와 어울리는 연애 상대
              </h3>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{typeDetail.emoji}</span>
                  <span className="text-gray-400 text-xl">→</span>
                  <span className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold">
                    {typeDetail.idealPartner}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {typeDetail.partnerDesc}
                </p>
              </div>
            </div>
          )}

          {/* 세부 점수 - 더 시각적으로 */}
          {result.sc && result.sc.length > 0 && (
            <div className="p-6 md:p-8">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                <span className="text-xl">📊</span>
                세부 분석 결과
              </h3>
              <div className="space-y-4">
                {result.sc.map((subscale, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">
                        {subscale.n}
                      </span>
                      <span className="inline-block bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {subscale.v}점
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full transition-all duration-700"
                        style={{ width: `${subscale.v}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 코멘트 */}
          {result.c && (
            <div className="px-6 md:px-8 pb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💬</span>
                  <p className="text-blue-800 leading-relaxed">
                    &ldquo;{result.c}...&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5가지 테스트 소개 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 text-center">
            🎯 5가지 테스트로 나를 완벽히 분석!
          </h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Object.entries(TEST_INFO).map(([id, info]) => (
              <div
                key={id}
                className={`text-center p-3 rounded-xl ${
                  parseInt(id) === result.t
                    ? 'bg-primary-100 ring-2 ring-primary-500'
                    : 'bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{info.emoji}</div>
                <div className="text-xs text-gray-600 leading-tight">
                  {info.title.replace(' 테스트', '')}
                </div>
                {parseInt(id) === result.t && (
                  <div className="text-xs text-primary-600 font-bold mt-1">완료!</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            친구는 아직 1개만 완료했어요. 5개 모두 하면 더 정확한 결과가!
          </p>
        </div>

        {/* 메인 CTA */}
        <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 rounded-3xl p-8 text-center text-white shadow-xl mb-6 relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="relative">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              나도 해볼까?
            </h3>
            <p className="text-lg text-white/90 mb-6">
              1분이면 나의 연애 유형을 알 수 있어요!
            </p>

            <Button
              variant="secondary"
              className="bg-white text-primary-600 hover:bg-gray-50 px-10 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              onClick={() => router.push('/test')}
            >
              무료로 테스트하기 →
            </Button>

            <p className="mt-4 text-sm text-white/70">
              ⏱️ 테스트당 1~2분 소요 · 완전 무료
            </p>
          </div>
        </div>

        {/* 5개 완료시 혜택 */}
        <div className="bg-gradient-to-r from-yellow-50 to-pink-50 rounded-2xl p-6 border border-yellow-100">
          <h4 className="font-bold text-gray-900 mb-4 text-center">
            🎁 5개 테스트 완료하면?
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <p className="text-gray-700"><strong>나만의 4글자 성격코드</strong> - MBTI처럼 나를 표현해요</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <p className="text-gray-700"><strong>연애 준비도 점수</strong> - 지금 연애해도 될까?</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <p className="text-gray-700"><strong>나와 맞는 상대 유형</strong> - 어떤 사람과 잘 맞을까?</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <p className="text-gray-700"><strong>공유용 사용설명서 카드</strong> - 친구, 연인에게 공유!</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="primary"
              className="w-full py-4 text-lg font-bold"
              onClick={() => router.push('/test')}
            >
              지금 바로 시작하기 🚀
            </Button>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>마이타입 - 나만의 연애 사용설명서</p>
        </div>
      </div>
    </div>
  );
}
