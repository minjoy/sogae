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

// 테스트 타입별 상세 설명
const TYPE_DESCRIPTIONS: Record<number, Record<string, {
  desc: string;
  emoji: string;
  tip: string;
  comment: string;
  idealPartner: string;
  partnerDesc: string;
}>> = {
  1: { // 애착유형
    '안정형': {
      desc: '관계에서 편안함을 느끼고 파트너를 신뢰해요',
      emoji: '🤗',
      tip: '안정적인 연애가 가능한 타입!',
      comment: '안정형은 어린 시절 일관된 돌봄을 받아 관계에 대한 긍정적인 기대를 형성했어요. 친밀감을 자연스럽게 받아들이고, 갈등 상황에서도 침착하게 대처할 수 있어요. 상대방의 감정을 잘 읽고 공감하는 능력이 뛰어나 건강한 관계를 유지하기 좋은 유형이에요.',
      idealPartner: '모든 유형',
      partnerDesc: '안정형은 어떤 유형과도 잘 맞아요! 특히 불안형이나 회피형 파트너의 안전기지가 되어줄 수 있어요.'
    },
    '불안형': {
      desc: '사랑받고 싶은 마음이 크고 관계에 민감해요',
      emoji: '💓',
      tip: '깊은 감정 교류를 원하는 타입',
      comment: '불안형은 사랑에 대한 갈망이 크고 감정 표현이 풍부해요. 상대방의 작은 변화도 민감하게 감지하며, 확인받고 싶은 욕구가 있어요. 이런 특성은 깊은 감정적 연결을 원하기 때문이에요. 자신을 믿고 기다려주는 파트너를 만나면 놀라운 사랑을 보여줄 수 있어요.',
      idealPartner: '안정형',
      partnerDesc: '안정형 파트너가 불안을 안정시켜주고 일관된 사랑을 보여줄 때 가장 행복한 연애가 가능해요.'
    },
    '회피형': {
      desc: '독립적이고 자기만의 공간을 중요시해요',
      emoji: '🌿',
      tip: '천천히 다가가면 마음을 열어요',
      comment: '회피형은 독립적이고 자기만의 시간과 공간을 소중히 여겨요. 감정 표현이 서툴 수 있지만, 마음속으론 깊이 사랑하고 있어요. 거리를 두는 것처럼 보여도 이건 자기 보호 방식이에요. 압박하지 않고 기다려주면 서서히 마음을 열고 진정한 친밀감을 나눌 수 있어요.',
      idealPartner: '안정형',
      partnerDesc: '안정형 파트너가 공간을 존중하면서도 꾸준히 곁에 있어주면 신뢰를 쌓아갈 수 있어요.'
    },
    '혼란형': {
      desc: '친밀함을 원하면서도 두려워하는 복잡한 마음',
      emoji: '🌀',
      tip: '이해와 인내가 필요한 타입',
      comment: '혼란형은 사랑받고 싶으면서도 상처받을까 두려워하는 복잡한 마음을 가지고 있어요. 다가갔다 물러나는 패턴을 보일 수 있지만, 이건 과거의 상처에서 비롯된 것이에요. 일관되게 사랑해주는 파트너를 만나면 점차 안정감을 찾고 깊은 연결을 형성할 수 있어요.',
      idealPartner: '안정형',
      partnerDesc: '안정형 파트너의 일관된 사랑과 인내가 혼란형의 마음을 안정시켜줄 수 있어요.'
    },
  },
  2: { // 갈등대처
    '대화형': {
      desc: '갈등을 대화로 해결하려고 노력해요',
      emoji: '💬',
      tip: '소통이 잘 되는 연애 스타일!',
      comment: '대화형은 문제가 생기면 숨기지 않고 대화로 해결하려 해요. 상대방의 의견을 듣고 자신의 생각도 명확히 전달하는 능력이 있어요. 감정을 억누르지 않고 건강하게 표현하며, 서로의 입장을 이해하려 노력해요. 이런 소통 능력은 오래가는 관계의 핵심이에요.',
      idealPartner: '대화형, 순응형',
      partnerDesc: '함께 대화하며 문제를 풀어가는 파트너와 깊은 이해와 신뢰를 쌓을 수 있어요.'
    },
    '회피형': {
      desc: '갈등 상황을 피하고 시간이 해결해주길 바라요',
      emoji: '🚶',
      tip: '압박하지 않으면 스스로 다가와요',
      comment: '회피형은 갈등 상황이 불편하고 시간이 지나면 자연스레 해결될 거라 생각해요. 직접적인 대립을 피하고 평화로운 관계를 원해요. 당장은 문제를 회피하는 것처럼 보이지만, 마음이 정리되면 진솔하게 이야기할 준비가 돼요. 기다려주는 배려가 필요한 타입이에요.',
      idealPartner: '대화형, 순응형',
      partnerDesc: '부드럽게 대화를 이끌어주고 기다려줄 수 있는 파트너가 잘 맞아요.'
    },
    '폭발형': {
      desc: '감정을 솔직하게 표현하고 즉각 반응해요',
      emoji: '🔥',
      tip: '쿨한 감정 처리가 필요해요',
      comment: '폭발형은 감정을 숨기지 않고 바로 표현하는 솔직한 타입이에요. 화가 나면 즉각 반응하지만, 뒤끝이 없고 금방 풀리는 편이에요. 열정적이고 에너지가 넘치며, 문제를 덮어두는 것보다 바로 해결하길 원해요. 감정의 폭풍이 지나면 다시 다정해지는 매력이 있어요.',
      idealPartner: '대화형, 안정적인 상대',
      partnerDesc: '감정을 받아주면서도 차분하게 대화할 수 있는 파트너가 좋아요.'
    },
    '순응형': {
      desc: '상대방에게 맞추려고 노력하는 편이에요',
      emoji: '🕊️',
      tip: '본인 의견도 표현해야 건강해요',
      comment: '순응형은 조화를 중시하고 상대방의 기분을 잘 맞춰줘요. 갈등이 생기면 자신이 양보해서라도 관계를 지키려 해요. 배려심이 깊고 상대방을 편하게 해주는 능력이 있어요. 다만 자신의 욕구를 표현하는 것도 중요해요. 진정한 소통은 서로의 솔직함에서 시작되니까요.',
      idealPartner: '대화형',
      partnerDesc: '내 의견도 물어봐주고 존중해주는 파트너와 함께하면 더 행복해질 수 있어요.'
    },
  },
  3: { // 연애가치관
    '로맨티스트': {
      desc: '사랑과 감정적 교류를 가장 중요시해요',
      emoji: '💕',
      tip: '로맨틱한 연애를 원해요!',
      comment: '로맨티스트는 사랑에 진심이고 감정적 교류를 가장 중요하게 생각해요. 기념일, 서프라이즈, 달콤한 말들을 통해 사랑을 표현하고 받고 싶어해요. 드라마 같은 로맨스를 꿈꾸며, 연인과의 순간순간을 특별하게 만들고 싶어해요. 사랑받을 때 가장 빛나는 타입이에요.',
      idealPartner: '로맨티스트, 열정주의자',
      partnerDesc: '함께 로맨틱한 순간을 만들고 감정을 나눌 수 있는 파트너와 환상의 케미를 이뤄요.'
    },
    '현실주의자': {
      desc: '안정과 미래 계획을 중요하게 생각해요',
      emoji: '🏠',
      tip: '진지한 관계를 추구해요',
      comment: '현실주의자는 연애도 인생의 중요한 파트너십이라고 생각해요. 감정만큼이나 현실적인 조건과 미래 계획을 중요하게 여겨요. 함께 성장하고 안정적인 미래를 만들어갈 수 있는 관계를 원해요. 책임감이 강하고 약속을 잘 지키며, 신뢰할 수 있는 파트너가 되어줄 거예요.',
      idealPartner: '현실주의자, 계획형',
      partnerDesc: '같은 방향을 바라보며 미래를 함께 계획할 수 있는 파트너가 잘 맞아요.'
    },
    '자유주의자': {
      desc: '개인의 자유와 성장을 존중해요',
      emoji: '🦋',
      tip: '서로를 존중하는 관계가 이상적',
      comment: '자유주의자는 연애 중에도 개인의 정체성과 자유를 중요하게 생각해요. 서로 구속하지 않고 각자의 삶을 존중하면서 함께하는 관계를 원해요. 독립적이면서도 깊은 신뢰로 연결된 관계가 이상적이에요. 상대방의 꿈과 성장을 응원하고, 함께 더 나은 사람이 되길 원해요.',
      idealPartner: '자유주의자, 열정주의자',
      partnerDesc: '서로의 공간을 존중하면서도 깊이 연결될 수 있는 파트너가 좋아요.'
    },
    '열정주의자': {
      desc: '함께하는 경험과 모험을 중요시해요',
      emoji: '✨',
      tip: '함께 새로운 것을 도전해요!',
      comment: '열정주의자는 연인과 함께 새로운 경험을 만들어가는 것을 좋아해요. 여행, 새로운 취미, 도전적인 활동들을 함께하며 추억을 쌓고 싶어해요. 일상도 특별하게 만드는 능력이 있고, 함께 있으면 지루할 틈이 없어요. 삶을 즐기는 방법을 아는 매력적인 타입이에요.',
      idealPartner: '열정주의자, 로맨티스트',
      partnerDesc: '함께 모험하고 새로운 것에 도전하는 걸 즐기는 파트너와 최고의 시너지!'
    },
  },
  4: { // 소비습관
    '계획형': {
      desc: '체계적으로 돈을 관리하고 저축해요',
      emoji: '📊',
      tip: '안정적인 미래를 준비하는 타입',
      comment: '계획형은 돈을 체계적으로 관리하고 미래를 위해 저축하는 타입이에요. 충동구매보다는 필요한 것을 계획적으로 구매해요. 재정적 안정을 중요시하며, 함께하는 사람에게도 안정감을 줄 수 있어요. 장기적인 목표를 위해 절제할 줄 아는 현명한 사람이에요.',
      idealPartner: '계획형, 가치형',
      partnerDesc: '비슷한 금전 감각을 가진 파트너와 안정적인 미래를 함께 만들어갈 수 있어요.'
    },
    '즉흥형': {
      desc: '현재의 행복을 위해 기꺼이 소비해요',
      emoji: '🎉',
      tip: '함께 즐거운 경험을 만들어요',
      comment: '즉흥형은 지금 이 순간의 행복을 중요하게 생각해요. 좋은 경험, 맛있는 음식, 특별한 순간을 위해 기꺼이 지갑을 열어요. 연인과 함께하는 시간을 풍요롭게 만들어주며, 삶을 즐길 줄 아는 타입이에요. 함께 있으면 즐거운 추억이 계속 쌓여요.',
      idealPartner: '즉흥형, 가치형',
      partnerDesc: '함께 즐거운 경험을 만들고 현재를 즐기는 파트너와 케미가 좋아요.'
    },
    '가치형': {
      desc: '의미 있는 곳에 투자하는 것을 좋아해요',
      emoji: '💎',
      tip: '퀄리티를 중시하는 타입',
      comment: '가치형은 가격보다 가치를 중요시해요. 싸다고 무조건 사는 게 아니라, 정말 좋은 것에 투자하는 타입이에요. 자기계발, 경험, 품질 좋은 물건에 돈을 쓰며, 연인에게도 의미 있는 선물과 경험을 선사해요. 삶의 질을 높이는 방법을 아는 사람이에요.',
      idealPartner: '가치형, 계획형',
      partnerDesc: '의미 있는 소비를 함께 즐기고 가치관을 공유하는 파트너가 잘 맞아요.'
    },
    '절약형': {
      desc: '필요한 것만 구매하는 실용주의자예요',
      emoji: '🐿️',
      tip: '알뜰하고 현명한 소비 스타일',
      comment: '절약형은 필요한 것과 원하는 것을 구분할 줄 알아요. 불필요한 지출을 줄이고 알뜰하게 생활하는 타입이에요. 돈의 가치를 알고 현명하게 사용해요. 미래를 위한 준비도 철저하며, 안정적인 경제 생활을 할 수 있어요. 실용적이고 믿음직한 파트너예요.',
      idealPartner: '절약형, 계획형',
      partnerDesc: '비슷한 소비 습관을 가진 파트너와 갈등 없이 행복한 살림을 꾸릴 수 있어요.'
    },
  },
  5: { // 번아웃
    '활력 충만': {
      desc: '에너지가 넘치고 새로운 관계에 적극적!',
      emoji: '⚡',
      tip: '지금 연애 시작하기 좋은 상태!',
      comment: '지금 에너지가 충만하고 마음의 여유가 있는 상태예요! 새로운 사람을 만나고 관계를 시작하기에 최적의 컨디션이에요. 긍정적인 에너지가 넘치고, 상대방에게도 좋은 영향을 줄 수 있어요. 자신감 있게 연애를 시작해보세요!',
      idealPartner: '모든 유형',
      partnerDesc: '지금 상태라면 어떤 유형의 파트너와도 좋은 관계를 만들어갈 수 있어요!'
    },
    '안정적': {
      desc: '균형 잡힌 상태로 관계를 잘 유지할 수 있어요',
      emoji: '🌿',
      tip: '건강한 연애가 가능해요',
      comment: '마음의 균형이 잘 잡혀있고 안정적인 상태예요. 일과 개인 생활의 밸런스를 유지하면서 연애도 할 수 있는 컨디션이에요. 상대방의 감정을 배려할 여유가 있고, 건강한 관계를 유지할 수 있어요. 좋은 연애를 할 준비가 되어있어요!',
      idealPartner: '안정적인 상대',
      partnerDesc: '함께 균형 잡힌 일상을 만들어갈 수 있는 파트너와 잘 맞아요.'
    },
    '주의 필요': {
      desc: '약간의 피로감이 있지만 관리 가능해요',
      emoji: '🔋',
      tip: '자기 관리와 함께 연애해요',
      comment: '약간의 피로감이 느껴지는 상태예요. 연애를 못할 정도는 아니지만, 자기 관리도 함께 신경 써야 해요. 무리하지 않는 선에서 관계를 발전시키고, 에너지 충전 시간도 확보하세요. 나를 돌보면서 연애하면 더 좋은 관계를 만들 수 있어요.',
      idealPartner: '이해심 많은 상대',
      partnerDesc: '내 상태를 이해하고 기다려줄 수 있는 배려심 깊은 파트너가 필요해요.'
    },
    '회복 필요': {
      desc: '지금은 나를 돌보는 시간이 필요해요',
      emoji: '🧘',
      tip: '충분히 쉬고 에너지 충전!',
      comment: '지금은 연애보다 나 자신을 돌보는 시간이 필요해요. 충분한 휴식과 자기 케어를 통해 에너지를 회복하세요. 지친 상태에서 시작한 연애는 오래가기 어려워요. 지금은 나를 위한 시간을 갖고, 컨디션이 좋아지면 그때 멋진 연애를 시작해도 늦지 않아요!',
      idealPartner: '기다려줄 수 있는 상대',
      partnerDesc: '지금은 연애보다 회복에 집중하세요. 충전 후에 더 좋은 만남이 기다리고 있어요!'
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
