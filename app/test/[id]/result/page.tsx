'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ALL_TESTS } from '@/lib/tests/test-data';
import { scoreTest } from '@/lib/tests/scoring';
import { encodeTestResult } from '@/lib/share-code';
import Button from '@/components/Button';

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

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const testId = parseInt(params?.id as string);

  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const testDef = ALL_TESTS[testId];

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 메타태그 동적 업데이트
  useEffect(() => {
    if (result && testDef) {
      const title = `${testDef.title} 결과 | 언연이`;
      const description = `나의 ${testDef.title}: ${result.scores?.primaryLabel || ''} - ${testDef.description}`;
      const url = window.location.href;

      // 기본 메타태그
      document.title = title;
      updateMetaTag('name', 'description', description);

      // Open Graph
      updateMetaTag('property', 'og:title', title);
      updateMetaTag('property', 'og:description', description);
      updateMetaTag('property', 'og:url', url);
      updateMetaTag('property', 'og:type', 'article');
      updateMetaTag('property', 'og:site_name', '언연이 - 나만의 연애 사용설명서');
      updateMetaTag('property', 'og:image', window.location.origin + '/images/og-test-result.png');

      // Twitter Card
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', title);
      updateMetaTag('name', 'twitter:description', description);
      updateMetaTag('name', 'twitter:image', window.location.origin + '/images/og-test-result.png');
    }
  }, [result, testDef]);

  const updateMetaTag = (attr: string, key: string, content: string) => {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  const fetchResult = async () => {
    try {
      // 1. 먼저 방금 테스트한 결과가 있는지 확인 (localStorage)
      const recentResult = localStorage.getItem(`testResult_${testId}`);
      if (recentResult) {
        const parsedResult = JSON.parse(recentResult);
        setResult({
          testType: testId,
          label: parsedResult.label,
          scores: {
            primaryLabel: parsedResult.label,
            secondaryLabel: parsedResult.secondaryLabel,
            subscales: parsedResult.subscales,
          },
          comment: parsedResult.comment,
          recommendations: parsedResult.recommendations,
          isGuest: parsedResult.isGuest,
        });
        // 사용 후 삭제 (재방문 시 API에서 가져오도록)
        localStorage.removeItem(`testResult_${testId}`);
        setIsLoading(false);
        return;
      }

      // 2. 로그인된 사용자: API에서 기존 결과 가져오기
      const response = await fetch('/api/test/results');
      const data = await response.json();

      if (data.success && data.results) {
        const testResult = data.results.find((r: Record<string, any>) => r.testType === testId);
        // 로그인 사용자도 compatibility 정보를 위해 점수 재계산
        if (testResult && testResult.rawAnswers) {
          const calculatedScore = scoreTest(testId, testResult.rawAnswers);
          testResult.compatibility = calculatedScore.compatibility;
        }
        setResult(testResult);
        // 로그인 사용자만 5개 테스트 완료 확인
        setAllTestsCompleted(data.results.length >= 5);
      } else {
        // 3. 비회원: guestResults에서 가져오기 (이전 방식 호환)
        const guestResults = JSON.parse(localStorage.getItem('guestResults') || '[]');
        const guestResult = guestResults.find((r: Record<string, any>) => r.testType === testId);

        // 비회원은 "모든 테스트 완료" 표시하지 않음
        setAllTestsCompleted(false);

        if (guestResult && guestResult.answers) {
          // 점수 계산
          const calculatedScore = scoreTest(testId, guestResult.answers);

          setResult({
            testType: testId,
            label: calculatedScore.primaryLabel,
            scores: {
              primaryLabel: calculatedScore.primaryLabel,
              secondaryLabel: calculatedScore.secondaryLabel,
              subscales: calculatedScore.subscales,
            },
            comment: calculatedScore.comment,
            recommendations: calculatedScore.recommendations,
            compatibility: calculatedScore.compatibility,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch result:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    // 결과를 인코딩하여 공유 URL 생성
    const scores = result?.scores as Record<string, any>;
    const shareCode = encodeTestResult(
      testId,
      scores?.primaryLabel || '',
      scores?.secondaryLabel,
      result?.comment,
      scores?.subscales
    );
    const shareUrl = `${window.location.origin}/share/test/${shareCode}`;

    // 클립보드에 URL만 복사
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('링크를 복사하지 못했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">✨</div>
          <p className="text-gray-600 text-lg">결과를 분석하고 있어요...</p>
        </div>
      </div>
    );
  }

  if (!result || !testDef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            결과를 찾을 수 없습니다
          </h1>
          <Button onClick={() => router.push('/test')}>
            테스트 목록으로
          </Button>
        </div>
      </div>
    );
  }

  const scores = result.scores as Record<string, any>;
  const typeInfo = TYPE_DESCRIPTIONS[testId]?.[scores.primaryLabel];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm mb-2">{testDef.title} 결과</p>
          <div className="text-6xl mb-3">{typeInfo?.emoji || testDef.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {scores.primaryLabel}
          </h1>
          {scores.secondaryLabel && (
            <p className="text-lg text-gray-600">{scores.secondaryLabel}</p>
          )}
        </div>

        {/* 한 줄 설명 */}
        {typeInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4 text-center">
            <p className="text-xl text-gray-800 font-medium leading-relaxed">
              {typeInfo.desc}
            </p>
            <div className="mt-4 inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold">
              💡 {typeInfo.tip}
            </div>
          </div>
        )}

        {/* 전문가 분석 */}
        {typeInfo && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                🔮 전문가 분석
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed text-base">
                {typeInfo.comment}
              </p>
            </div>
          </div>
        )}

        {/* 나와 어울리는 연애 상대 */}
        {typeInfo && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                💕 나와 어울리는 연애 상대
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary-100 text-primary-700 px-4 py-2 rounded-full font-bold">
                  {scores.primaryLabel}
                </span>
                <span className="text-2xl">→</span>
                <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold">
                  {typeInfo.idealPartner}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {typeInfo.partnerDesc}
              </p>
            </div>
          </div>
        )}

        {/* 하위척도 점수 */}
        {scores.subscales && scores.subscales.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                📊 세부 점수 분석
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {scores.subscales.map((subscale: Record<string, any>, index: number) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {subscale.name}
                    </span>
                    <span className="text-sm font-bold text-primary-600">
                      {subscale.percentile}점
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${subscale.percentile}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 추천사항 */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                💡 실천 가이드
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {result.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 5개 테스트 완료 시 사용설명서 안내 */}
        {allTestsCompleted && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-center text-white shadow-xl mb-4">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-2xl font-bold mb-2">
              모든 테스트 완료!
            </h3>
            <p className="text-base mb-4 opacity-90">
              5가지 테스트 결과를 종합한<br />
              <strong>나만의 사용설명서 카드</strong>를 확인해보세요
            </p>
            <Button
              variant="secondary"
              className="bg-white text-primary-600 hover:bg-gray-50 px-6 py-2 font-semibold"
              onClick={() => router.push('/my')}
            >
              나만의 사용설명서 보러가기 →
            </Button>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => router.push('/test')}
            className="flex flex-col items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-2xl">📝</span>
            <span className="text-xs font-semibold text-gray-700">다른 테스트</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            {isCopied ? (
              <>
                <span className="text-2xl text-white">✓</span>
                <span className="text-xs font-semibold text-white">복사 완료</span>
              </>
            ) : (
              <>
                <span className="text-2xl text-white">🔗</span>
                <span className="text-xs font-semibold text-white">공유하기</span>
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/my')}
            className="flex flex-col items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs font-semibold text-gray-700">마이페이지</span>
          </button>
        </div>

        {/* 5개 완료 CTA 강조 영역 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-2xl mb-4 border-4 border-yellow-300">
          {/* 반짝이는 효과 */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-2 left-4 text-2xl animate-pulse">✨</div>
            <div className="absolute top-4 right-6 text-xl animate-pulse delay-100">⭐</div>
            <div className="absolute bottom-4 left-8 text-lg animate-pulse delay-200">✨</div>
            <div className="absolute bottom-2 right-4 text-2xl animate-pulse delay-300">🌟</div>
          </div>

          <div className="relative z-10">
            <div className="text-5xl mb-3 text-center animate-bounce">🎁</div>
            <h3 className="text-2xl font-black mb-2 text-center drop-shadow-lg">
              5개 테스트 모두 완료하세요!
            </h3>

            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 mb-4">
              <p className="text-center text-sm font-semibold mb-3">
                🔮 5개 완료 시 특별 혜택
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-400 text-amber-900 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>나만의 <strong>4글자 성격코드</strong> (MBTI처럼!)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-400 text-amber-900 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>5가지 영역 종합 <strong>완벽한 상대 분석</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-400 text-amber-900 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span><strong>공유 가능한 사용설명서 카드</strong></span>
                </li>
              </ul>
            </div>

            {!isLoggedIn && (
              <div className="bg-red-600/80 border-2 border-white/50 rounded-xl p-4 mb-4">
                <p className="text-center font-bold text-base flex items-center justify-center gap-2">
                  <span className="text-xl">🔐</span>
                  로그인하면 진행 상황이 저장돼요!
                </p>
                <p className="text-center text-xs mt-1 opacity-90">
                  5개 완료 후 통합 결과를 보려면 로그인이 필요합니다
                </p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {!isLoggedIn ? (
                <>
                  <Button
                    variant="secondary"
                    className="bg-white text-orange-600 hover:bg-gray-50 font-bold shadow-lg"
                    onClick={() => router.push('/signup')}
                  >
                    무료 회원가입
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/20 font-semibold"
                    onClick={() => router.push('/login')}
                  >
                    로그인
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  className="bg-white text-orange-600 hover:bg-gray-50 font-bold shadow-lg px-8"
                  onClick={() => router.push('/test')}
                >
                  다른 테스트 하러가기 →
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 진행 상황 안내 */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-5 text-center text-white">
          <p className="text-sm mb-2">
            💡 지금은 <strong>1가지 테스트 결과</strong>만 본 거예요
          </p>
          <p className="text-base font-bold text-yellow-400">
            5개 모두 완료 → 진짜 나와 맞는 상대를 알 수 있어요!
          </p>
          {!isLoggedIn && (
            <p className="text-xs text-gray-400 mt-2">
              ※ 로그인 없이도 테스트는 가능하지만, 진행 상황 저장 및 통합 결과는 로그인 후 이용 가능합니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
