/**
 * 두 사람 궁합 분석 시스템
 * 관상 분석 결과를 기반으로 두 사람의 궁합을 분석합니다.
 * 유료 상품으로 섬세하고 울림 있는 해석을 제공합니다.
 */

import { FaceAnalysisResult } from './face-analysis';
import { PhysiognomyTraits } from './physiognomy-types';

// === 오행 (Five Elements) 정의 ===
export type FiveElement = '목' | '화' | '토' | '금' | '수';

// 오행 상생 관계 (서로 도움)
const ELEMENT_HARMONY: Record<FiveElement, FiveElement> = {
  '목': '화', // 목생화: 나무가 불을 살림
  '화': '토', // 화생토: 불이 흙을 만듦
  '토': '금', // 토생금: 흙에서 금이 나옴
  '금': '수', // 금생수: 금에서 물이 맺힘
  '수': '목', // 수생목: 물이 나무를 키움
};

// 오행 상극 관계 (서로 극함)
const ELEMENT_CONFLICT: Record<FiveElement, FiveElement> = {
  '목': '토', // 목극토: 나무가 흙의 기운을 빼앗음
  '화': '금', // 화극금: 불이 금을 녹임
  '토': '수', // 토극수: 흙이 물을 막음
  '금': '목', // 금극목: 금이 나무를 벰
  '수': '화', // 수극화: 물이 불을 끔
};

// === 궁합 결과 타입 정의 ===
export interface CompatibilityResult {
  // 종합 점수
  totalScore: number; // 0-100
  gradeLabel: string; // 천생연분, 좋은 인연 등
  gradeEmoji: string;

  // 오행 분석
  maleElement: FiveElement;
  femaleElement: FiveElement;
  elementRelation: '상생' | '상극' | '비화' | '상보';
  elementDescription: string;

  // 카테고리별 궁합 점수
  categoryScores: {
    emotion: number;      // 감정/소통 궁합
    values: number;       // 가치관 궁합
    lifestyle: number;    // 생활 습관 궁합
    future: number;       // 미래 비전 궁합
    physical: number;     // 체력/활력 궁합
  };

  // 잘 맞는 부분 (강점)
  strengths: Array<{
    title: string;
    description: string;
    emoji: string;
  }>;

  // 안 맞는 부분 (주의점)
  challenges: Array<{
    title: string;
    description: string;
    emoji: string;
    advice: string;
  }>;

  // 서로 배려해야 할 점
  mutualCare: {
    forMale: Array<{ point: string; reason: string }>;
    forFemale: Array<{ point: string; reason: string }>;
  };

  // 관계 발전 조언
  developmentAdvice: Array<{
    phase: string; // 연애 초기, 교제 중, 결혼 후
    advice: string;
    keyPoint: string;
  }>;

  // 시기별 관계 전망
  periodForecast: {
    early: { score: number; description: string };   // 만남 초기 (1-2년)
    middle: { score: number; description: string };  // 안정기 (3-7년)
    mature: { score: number; description: string };  // 성숙기 (7년+)
  };

  // 한줄 요약
  summary: string;

  // 운명적 메시지 (섬세한 울림)
  destinyMessage: string;
}

// === 오행 판정 함수 ===
function determineElement(analysis: FaceAnalysisResult): FiveElement {
  const traits = analysis.traits;
  const categories = analysis.categories;

  if (!traits) {
    // traits가 없으면 categories 기반으로 판정
    const { r1, r2, r3, r4 } = categories;
    const max = Math.max(r1, r2, r3, r4);

    if (max === r1) return '금'; // 권력/운명 → 금 (결단력, 강인함)
    if (max === r2) return '화'; // 정신/사랑 → 화 (열정, 감성)
    if (max === r3) return '수'; // 일/재물 → 수 (지혜, 융통성)
    if (max === r4) return '토'; // 성실/책임 → 토 (안정, 신뢰)
    return '목';
  }

  // traits 기반 오행 판정
  const scores = {
    '목': traits.호기심 * 2 + traits.긍정 + traits.성실함, // 성장, 창의
    '화': traits.정신력 + traits.연애운 * 2 + traits.사교력, // 열정, 감정
    '토': traits.책임감 * 2 + traits.성실함 + traits.착함, // 안정, 신뢰
    '금': traits.정신력 * 2 + traits.업무 + traits.중년운, // 결단, 실행
    '수': traits.재물 + traits.장수 + traits.체력, // 지혜, 적응
  };

  const maxElement = Object.entries(scores).reduce(
    (max, [el, score]) => (score > max.score ? { element: el, score } : max),
    { element: '목' as string, score: 0 }
  );

  return maxElement.element as FiveElement;
}

// === 오행 관계 분석 ===
function analyzeElementRelation(
  male: FiveElement,
  female: FiveElement
): { relation: '상생' | '상극' | '비화' | '상보'; description: string } {
  // 같은 오행 (비화)
  if (male === female) {
    const descriptions: Record<FiveElement, string> = {
      '목': '두 분 모두 성장과 창의를 추구하는 만큼, 함께 새로운 도전을 이끌어갈 수 있습니다. 다만 서로의 주장이 강할 수 있으니 양보의 미덕이 필요합니다.',
      '화': '열정과 감성이 풍부한 두 분! 사랑이 뜨겁게 타오르지만, 감정의 소용돌이에 휩쓸리지 않도록 서로를 진정시켜주는 여유가 필요합니다.',
      '토': '안정과 신뢰를 중시하는 두 분은 단단한 관계를 만들어갑니다. 변화를 두려워하지 말고 때로는 새로운 시도도 함께 해보세요.',
      '금': '결단력 있고 실행력 강한 두 분! 목표를 향해 함께 달릴 수 있지만, 가끔은 멈추고 서로의 감정을 살피는 시간이 필요합니다.',
      '수': '지혜롭고 유연한 두 분은 어떤 상황에서도 해결책을 찾아냅니다. 다만 결정을 미루기 쉬우니, 중요한 순간엔 함께 결단을 내려보세요.',
    };
    return { relation: '비화', description: descriptions[male] };
  }

  // 상생 관계 (남자가 여자를 도움)
  if (ELEMENT_HARMONY[male] === female) {
    const descriptions: Record<string, string> = {
      '목화': '남자분의 성장 에너지가 여자분의 열정을 더욱 타오르게 합니다. 서로에게 영감을 주며 함께 빛나는 관계입니다.',
      '화토': '남자분의 열정이 여자분에게 따뜻한 안정감으로 이어집니다. 사랑이 깊어질수록 더 단단해지는 관계입니다.',
      '토금': '남자분의 안정감이 여자분의 결단력을 뒷받침합니다. 신뢰를 바탕으로 함께 성취를 이루는 관계입니다.',
      '금수': '남자분의 실행력이 여자분의 지혜와 만나 무한한 가능성을 열어갑니다. 함께하면 더 현명해지는 관계입니다.',
      '수목': '남자분의 지혜가 여자분의 성장을 이끕니다. 서로를 통해 더 나은 사람으로 성장하는 아름다운 인연입니다.',
    };
    return { relation: '상생', description: descriptions[male + female] || '' };
  }

  // 상생 관계 (여자가 남자를 도움)
  if (ELEMENT_HARMONY[female] === male) {
    const descriptions: Record<string, string> = {
      '화목': '여자분의 열정이 남자분의 성장을 이끕니다. 서로에게 에너지를 주며 함께 발전하는 관계입니다.',
      '토화': '여자분의 안정감이 남자분의 열정에 깊이를 더합니다. 균형 잡힌 사랑을 나눌 수 있는 관계입니다.',
      '금토': '여자분의 결단력이 남자분에게 든든한 신뢰감을 줍니다. 함께 목표를 향해 나아가는 관계입니다.',
      '수금': '여자분의 지혜가 남자분의 실행력을 더욱 빛나게 합니다. 서로를 보완하며 성장하는 관계입니다.',
      '목수': '여자분의 창의성이 남자분의 지혜에 새로운 관점을 더합니다. 끊임없이 대화가 피어나는 관계입니다.',
    };
    return { relation: '상보', description: descriptions[female + male] || '' };
  }

  // 상극 관계
  const conflictDescriptions: Record<string, string> = {
    '목토': '가치관의 차이가 있을 수 있지만, 이는 서로를 성장시키는 기회가 됩니다. 차이를 인정하고 존중할 때 더 깊은 이해가 시작됩니다.',
    '화금': '열정과 냉철함의 충돌이 있을 수 있습니다. 하지만 이 긴장감이 오히려 관계를 더 단단하게 만듭니다. 감정과 이성의 균형을 찾아가세요.',
    '토수': '안정을 원하는 마음과 자유를 원하는 마음 사이에서 갈등이 생길 수 있습니다. 서로의 필요를 존중하면 더 풍요로운 관계가 됩니다.',
    '금목': '실용적인 관점과 이상적인 관점 사이에서 조율이 필요합니다. 서로 다른 시각이 오히려 더 나은 결정을 이끌어냅니다.',
    '수화': '신중함과 열정 사이에서 균형을 찾아야 합니다. 서로의 속도를 맞춰가면 더 깊고 따뜻한 관계를 만들 수 있습니다.',
  };

  return {
    relation: '상극',
    description: conflictDescriptions[male + female] || conflictDescriptions[female + male] || '서로 다른 성향이지만, 그 차이가 관계를 더 풍요롭게 만들 수 있습니다.',
  };
}

// === 카테고리별 궁합 점수 계산 ===
function calculateCategoryScores(
  male: FaceAnalysisResult,
  female: FaceAnalysisResult
): CompatibilityResult['categoryScores'] {
  const mTraits = male.traits || createDefaultTraits();
  const fTraits = female.traits || createDefaultTraits();

  // 감정/소통 궁합: 정신력, 착함, 긍정, 사교력 비교
  const emotionScore = calculateTraitCompatibility(
    [mTraits.정신력, mTraits.착함, mTraits.긍정, mTraits.사교력],
    [fTraits.정신력, fTraits.착함, fTraits.긍정, fTraits.사교력],
    [5, 3, 4, 3] // 최대값
  );

  // 가치관 궁합: 책임감, 성실함, 중년운 비교
  const valuesScore = calculateTraitCompatibility(
    [mTraits.책임감, mTraits.성실함, mTraits.중년운],
    [fTraits.책임감, fTraits.성실함, fTraits.중년운],
    [4, 3, 4]
  );

  // 생활 습관 궁합: 체력, 업무, 호기심 비교
  const lifestyleScore = calculateTraitCompatibility(
    [mTraits.체력, mTraits.업무, mTraits.호기심],
    [fTraits.체력, fTraits.업무, fTraits.호기심],
    [3, 4, 2]
  );

  // 미래 비전 궁합: 재물, 장수, 연애운 비교
  const futureScore = calculateTraitCompatibility(
    [mTraits.재물, mTraits.장수, mTraits.연애운],
    [fTraits.재물, fTraits.장수, fTraits.연애운],
    [4, 5, 3]
  );

  // 체력/활력 궁합: 체력, 긍정, 정신력 비교
  const physicalScore = calculateTraitCompatibility(
    [mTraits.체력, mTraits.긍정, mTraits.정신력],
    [fTraits.체력, fTraits.긍정, fTraits.정신력],
    [3, 4, 5]
  );

  return {
    emotion: Math.round(emotionScore),
    values: Math.round(valuesScore),
    lifestyle: Math.round(lifestyleScore),
    future: Math.round(futureScore),
    physical: Math.round(physicalScore),
  };
}

function createDefaultTraits(): PhysiognomyTraits {
  return {
    정신력: 2.5, 착함: 1.5, 외도: 0.5, 질투심: 1, 호기심: 1,
    남의시선: 1, 긍정: 2, 중년운: 2, 장수: 2.5, 재물: 2,
    연애운: 1.5, 업무: 2, 책임감: 2, 성실함: 1.5, 사교력: 1.5, 체력: 1.5,
  };
}

function calculateTraitCompatibility(
  maleTraits: number[],
  femaleTraits: number[],
  maxValues: number[]
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (let i = 0; i < maleTraits.length; i++) {
    const mNorm = maleTraits[i] / maxValues[i];
    const fNorm = femaleTraits[i] / maxValues[i];

    // 유사성 점수 (차이가 적을수록 높음)
    const similarity = 1 - Math.abs(mNorm - fNorm);

    // 평균 수준 점수 (둘 다 높을수록 좋음)
    const level = (mNorm + fNorm) / 2;

    // 보완성 점수 (한쪽이 부족해도 다른 쪽이 보완하면 OK)
    const complement = Math.max(mNorm, fNorm);

    // 가중 평균
    const score = similarity * 0.4 + level * 0.3 + complement * 0.3;
    totalScore += score * maxValues[i];
    totalWeight += maxValues[i];
  }

  return (totalScore / totalWeight) * 100;
}

// === 강점 분석 ===
function analyzeStrengths(
  male: FaceAnalysisResult,
  female: FaceAnalysisResult,
  categoryScores: CompatibilityResult['categoryScores']
): CompatibilityResult['strengths'] {
  const strengths: CompatibilityResult['strengths'] = [];
  const mTraits = male.traits || createDefaultTraits();
  const fTraits = female.traits || createDefaultTraits();

  // 감정 궁합이 높으면
  if (categoryScores.emotion >= 70) {
    strengths.push({
      title: '깊은 감정적 교감',
      description: '서로의 감정을 잘 이해하고 공감하는 능력이 뛰어납니다. 말하지 않아도 서로의 마음을 알아채는 특별한 연결고리가 있습니다.',
      emoji: '💕',
    });
  }

  // 가치관 궁합이 높으면
  if (categoryScores.values >= 70) {
    strengths.push({
      title: '같은 방향을 바라보는 인생관',
      description: '삶에서 중요하게 여기는 것들이 비슷합니다. 인생의 큰 결정을 내릴 때 서로 신뢰하며 함께 갈 수 있습니다.',
      emoji: '🎯',
    });
  }

  // 둘 다 사교력이 좋으면
  if (mTraits.사교력 >= 2 && fTraits.사교력 >= 2) {
    strengths.push({
      title: '함께하면 더 빛나는 사회성',
      description: '두 분이 함께하면 주변 사람들에게 좋은 에너지를 전파합니다. 모임의 중심이 되어 즐거운 시간을 만들어갈 수 있습니다.',
      emoji: '✨',
    });
  }

  // 착함 + 책임감 조합
  if ((mTraits.착함 >= 2 && fTraits.책임감 >= 3) || (fTraits.착함 >= 2 && mTraits.책임감 >= 3)) {
    strengths.push({
      title: '따뜻함과 신뢰의 조화',
      description: '한 분의 다정함과 다른 분의 든든함이 만나 안정적이면서도 따뜻한 관계를 만듭니다.',
      emoji: '🤝',
    });
  }

  // 둘 다 긍정적이면
  if (mTraits.긍정 >= 2.5 && fTraits.긍정 >= 2.5) {
    strengths.push({
      title: '어려움도 함께 이겨내는 긍정의 힘',
      description: '힘든 상황에서도 서로에게 희망을 주며 함께 일어설 수 있습니다. 웃음이 끊이지 않는 밝은 관계입니다.',
      emoji: '☀️',
    });
  }

  // 재물운 + 업무 능력
  if ((mTraits.재물 >= 2.5 && fTraits.업무 >= 2.5) || (fTraits.재물 >= 2.5 && mTraits.업무 >= 2.5)) {
    strengths.push({
      title: '함께 만들어가는 풍요로운 미래',
      description: '재물을 다루는 능력과 일에 대한 열정이 조화를 이루어, 경제적으로 안정된 가정을 이룰 수 있습니다.',
      emoji: '💰',
    });
  }

  // 체력 궁합이 좋으면
  if (categoryScores.physical >= 70) {
    strengths.push({
      title: '활기찬 일상의 동반자',
      description: '비슷한 에너지 레벨로 함께 활동하며 건강한 생활을 유지할 수 있습니다. 여행, 운동 등 함께하는 활동에서 큰 즐거움을 느낍니다.',
      emoji: '🏃',
    });
  }

  // 연애운이 둘 다 좋으면
  if (mTraits.연애운 >= 2 && fTraits.연애운 >= 2) {
    strengths.push({
      title: '로맨스가 살아있는 관계',
      description: '서로에게 설렘을 주고받으며 오래도록 연인 같은 감정을 유지합니다. 일상 속 작은 이벤트도 특별하게 만드는 재능이 있습니다.',
      emoji: '💝',
    });
  }

  // 최소 3개, 최대 5개 반환
  return strengths.slice(0, Math.max(3, Math.min(5, strengths.length)));
}

// === 주의점 분석 ===
function analyzeChallenges(
  male: FaceAnalysisResult,
  female: FaceAnalysisResult,
  categoryScores: CompatibilityResult['categoryScores']
): CompatibilityResult['challenges'] {
  const challenges: CompatibilityResult['challenges'] = [];
  const mTraits = male.traits || createDefaultTraits();
  const fTraits = female.traits || createDefaultTraits();

  // 감정 궁합이 낮으면
  if (categoryScores.emotion < 60) {
    challenges.push({
      title: '소통의 온도 차이',
      description: '감정을 표현하는 방식이 다를 수 있습니다. 한 분이 적극적으로 표현할 때 다른 분은 조용히 받아들이는 스타일일 수 있어요.',
      emoji: '💬',
      advice: '서로의 표현 방식을 존중하고, "당신은 어떻게 느껴?"라고 먼저 물어보는 습관을 들여보세요.',
    });
  }

  // 질투심 차이가 크면
  if (Math.abs(mTraits.질투심 - fTraits.질투심) >= 1) {
    const moreJealous = mTraits.질투심 > fTraits.질투심 ? '남자분' : '여자분';
    challenges.push({
      title: '사랑의 온도 조절',
      description: `${moreJealous}이 조금 더 독점적인 사랑을 원할 수 있습니다. 이는 그만큼 상대를 소중히 여기기 때문이에요.`,
      emoji: '💚',
      advice: '질투는 사랑의 표현이지만, 신뢰를 바탕으로 서로의 공간도 존중해주세요.',
    });
  }

  // 외도 성향 주의
  if (mTraits.외도 >= 0.8 || fTraits.외도 >= 0.8) {
    challenges.push({
      title: '새로움에 대한 호기심',
      description: '새로운 자극을 원하는 마음이 클 수 있습니다. 이는 관계를 지루하지 않게 만드는 원동력이 될 수도 있어요.',
      emoji: '🦋',
      advice: '함께 새로운 것을 경험하며 서로에게서 늘 새로운 면을 발견해보세요. 관계 안에서 설렘을 찾는 것이 중요합니다.',
    });
  }

  // 체력 차이가 크면
  if (Math.abs(mTraits.체력 - fTraits.체력) >= 1.5) {
    const moreEnergetic = mTraits.체력 > fTraits.체력 ? '남자분' : '여자분';
    challenges.push({
      title: '에너지 리듬의 차이',
      description: `${moreEnergetic}이 더 활동적인 편입니다. 휴식과 활동의 균형을 함께 찾아가야 합니다.`,
      emoji: '⚡',
      advice: '서로의 페이스를 존중하고, 때로는 상대방의 리듬에 맞춰주는 배려가 필요해요.',
    });
  }

  // 가치관 차이
  if (categoryScores.values < 60) {
    challenges.push({
      title: '삶의 우선순위 조율',
      description: '중요하게 여기는 것들이 조금 다를 수 있습니다. 이것이 갈등의 원인이 될 수 있지만, 서로의 세계를 넓히는 기회가 되기도 합니다.',
      emoji: '⚖️',
      advice: '큰 결정 전에 충분히 대화하고, 서로의 가치관을 이해하려 노력해보세요. 타협점을 찾는 과정에서 더 깊은 이해가 생깁니다.',
    });
  }

  // 정신력 차이
  if (Math.abs(mTraits.정신력 - fTraits.정신력) >= 2) {
    const stronger = mTraits.정신력 > fTraits.정신력 ? '남자분' : '여자분';
    challenges.push({
      title: '의지력의 균형',
      description: `${stronger}이 더 강한 추진력을 가지고 있습니다. 때로는 상대방이 따라가기 힘들 수 있어요.`,
      emoji: '💪',
      advice: '결정을 내릴 때 상대방의 의견도 충분히 듣고, 함께 결정한다는 느낌을 주세요.',
    });
  }

  // 최소 2개, 최대 4개 반환
  return challenges.slice(0, Math.max(2, Math.min(4, challenges.length)));
}

// === 서로 배려해야 할 점 ===
function analyzeMutualCare(
  male: FaceAnalysisResult,
  female: FaceAnalysisResult
): CompatibilityResult['mutualCare'] {
  const mTraits = male.traits || createDefaultTraits();
  const fTraits = female.traits || createDefaultTraits();

  const forMale: Array<{ point: string; reason: string }> = [];
  const forFemale: Array<{ point: string; reason: string }> = [];

  // 여자분의 특성에 따른 남자분 배려 포인트
  if (fTraits.남의시선 >= 1.5) {
    forMale.push({
      point: '공개적인 자리에서 칭찬과 존중을 표현해주세요',
      reason: '상대방은 타인의 시선을 의식하는 편이에요. 다른 사람들 앞에서 인정받는 느낌이 중요합니다.',
    });
  }

  if (fTraits.정신력 < 2) {
    forMale.push({
      point: '힘든 결정을 내릴 때 함께 고민해주세요',
      reason: '상대방은 혼자 큰 결정을 내리기 어려워할 수 있어요. 옆에서 지지해주는 것이 큰 힘이 됩니다.',
    });
  }

  if (fTraits.긍정 < 2) {
    forMale.push({
      point: '작은 것도 긍정적으로 해석하고 격려해주세요',
      reason: '상대방은 가끔 부정적인 생각에 빠질 수 있어요. 당신의 밝은 에너지가 큰 도움이 됩니다.',
    });
  }

  if (fTraits.연애운 >= 2) {
    forMale.push({
      point: '로맨틱한 순간을 잊지 마세요',
      reason: '상대방은 사랑받는 느낌을 중요하게 여겨요. 기념일이나 작은 이벤트를 챙겨주세요.',
    });
  }

  // 남자분의 특성에 따른 여자분 배려 포인트
  if (mTraits.호기심 >= 1.5) {
    forFemale.push({
      point: '새로운 것을 함께 시도하고 도전을 응원해주세요',
      reason: '상대방은 새로운 경험을 좋아해요. 함께 탐험하면 더 깊은 유대감이 생깁니다.',
    });
  }

  if (mTraits.업무 >= 3) {
    forFemale.push({
      point: '일에 몰두할 때 이해해주시고 응원해주세요',
      reason: '상대방은 일에서 성취감을 느끼는 타입이에요. 바쁠 때도 당신을 잊은 게 아닙니다.',
    });
  }

  if (mTraits.정신력 >= 3) {
    forFemale.push({
      point: '때로는 연약한 모습도 보여달라고 부드럽게 요청해보세요',
      reason: '상대방은 강한 모습을 유지하려 해요. 당신 앞에서는 편하게 쉴 수 있다는 걸 알려주세요.',
    });
  }

  if (mTraits.사교력 < 2) {
    forFemale.push({
      point: '사회적 모임에서 자연스럽게 도와주세요',
      reason: '상대방은 많은 사람 앞에서 어색할 수 있어요. 당신이 옆에 있으면 훨씬 편해집니다.',
    });
  }

  // 공통 배려 포인트 추가
  forMale.push({
    point: '감정을 솔직하게 표현하고 대화 시간을 만들어주세요',
    reason: '관계에서 가장 중요한 것은 소통입니다. 바빠도 대화 시간을 확보하세요.',
  });

  forFemale.push({
    point: '상대방의 노력을 인정하고 감사를 표현해주세요',
    reason: '작은 감사의 말이 큰 힘이 됩니다. 당연하게 여기지 말고 표현해주세요.',
  });

  return {
    forMale: forMale.slice(0, 4),
    forFemale: forFemale.slice(0, 4),
  };
}

// === 관계 발전 조언 ===
function generateDevelopmentAdvice(
  male: FaceAnalysisResult,
  female: FaceAnalysisResult,
  categoryScores: CompatibilityResult['categoryScores']
): CompatibilityResult['developmentAdvice'] {
  const advice: CompatibilityResult['developmentAdvice'] = [];

  // 연애 초기
  if (categoryScores.emotion >= 70) {
    advice.push({
      phase: '연애 초기',
      advice: '두 분의 감정적 교감이 강점이에요. 처음 만났을 때의 설렘을 기억하며, 서로를 알아가는 과정 자체를 즐기세요.',
      keyPoint: '첫인상의 좋은 느낌을 신뢰하세요',
    });
  } else {
    advice.push({
      phase: '연애 초기',
      advice: '처음에는 서로를 이해하는 데 시간이 걸릴 수 있어요. 성급하게 판단하지 말고, 다양한 상황에서 함께하며 서로를 알아가세요.',
      keyPoint: '시간을 들여 천천히 알아가세요',
    });
  }

  // 교제 중
  if (categoryScores.values >= 65) {
    advice.push({
      phase: '본격적인 교제',
      advice: '가치관이 비슷한 두 분은 중요한 결정에서 의견이 잘 맞을 거예요. 미래에 대한 대화를 나누며 함께 그려보세요.',
      keyPoint: '함께하는 미래를 구체적으로 이야기하세요',
    });
  } else {
    advice.push({
      phase: '본격적인 교제',
      advice: '가치관의 차이는 갈등의 원인이 될 수 있지만, 서로의 세계를 넓혀주기도 해요. 다름을 인정하고 존중하는 연습을 하세요.',
      keyPoint: '다름을 틀림이 아닌 다양성으로 받아들이세요',
    });
  }

  // 결혼/동거 후
  if (categoryScores.lifestyle >= 65) {
    advice.push({
      phase: '함께 사는 일상',
      advice: '생활 습관이 비슷해 일상에서의 마찰이 적을 거예요. 서로의 루틴을 존중하며 편안한 집을 만들어가세요.',
      keyPoint: '함께하는 일상의 소소한 행복을 즐기세요',
    });
  } else {
    advice.push({
      phase: '함께 사는 일상',
      advice: '생활 습관의 차이가 있을 수 있어요. 청소, 식사, 수면 시간 등 구체적인 규칙을 함께 정하면 갈등을 줄일 수 있습니다.',
      keyPoint: '명확한 생활 규칙을 함께 만들어가세요',
    });
  }

  return advice;
}

// === 시기별 관계 전망 ===
function generatePeriodForecast(
  male: FaceAnalysisResult,
  female: FaceAnalysisResult,
  categoryScores: CompatibilityResult['categoryScores']
): CompatibilityResult['periodForecast'] {
  const mTraits = male.traits || createDefaultTraits();
  const fTraits = female.traits || createDefaultTraits();

  // 초기 (1-2년): 감정 + 연애운 기반
  const earlyScore = Math.round(
    categoryScores.emotion * 0.5 +
    ((mTraits.연애운 + fTraits.연애운) / 6) * 50
  );

  // 안정기 (3-7년): 가치관 + 생활습관 기반
  const middleScore = Math.round(
    categoryScores.values * 0.4 +
    categoryScores.lifestyle * 0.4 +
    ((mTraits.책임감 + fTraits.책임감) / 8) * 20
  );

  // 성숙기 (7년+): 모든 요소 + 중년운 기반
  const matureScore = Math.round(
    (categoryScores.emotion + categoryScores.values + categoryScores.lifestyle + categoryScores.future) / 4 * 0.7 +
    ((mTraits.중년운 + fTraits.중년운) / 8) * 30
  );

  return {
    early: {
      score: earlyScore,
      description: earlyScore >= 70
        ? '처음부터 강한 끌림을 느끼며 빠르게 가까워질 수 있어요. 설렘이 가득한 시작입니다.'
        : earlyScore >= 50
        ? '서로를 알아가는 데 시간이 필요하지만, 천천히 쌓이는 감정이 더 깊고 단단합니다.'
        : '처음에는 서로를 이해하기 어려울 수 있어요. 하지만 노력한 만큼 더 특별한 인연이 됩니다.',
    },
    middle: {
      score: middleScore,
      description: middleScore >= 70
        ? '안정기에 접어들며 편안함과 신뢰가 깊어집니다. 함께하는 일상이 행복의 원천이 됩니다.'
        : middleScore >= 50
        ? '현실적인 문제들을 함께 해결해나가며 관계가 성숙해집니다. 대화와 타협이 중요한 시기예요.'
        : '이 시기에 갈등이 생길 수 있지만, 이를 함께 극복하면 더 단단한 관계가 됩니다.',
    },
    mature: {
      score: matureScore,
      description: matureScore >= 70
        ? '오랜 시간 함께하며 쌓인 추억과 신뢰가 빛을 발합니다. 서로 없이는 상상할 수 없는 소울메이트가 됩니다.'
        : matureScore >= 50
        ? '세월이 흐르며 서로를 더 깊이 이해하게 됩니다. 차분하고 평화로운 동반자 관계로 발전합니다.'
        : '오랜 시간이 지나면 새로운 형태의 관계로 진화할 수 있어요. 서로에게 여전히 배울 점을 찾아보세요.',
    },
  };
}

// === 운명적 메시지 생성 ===
function generateDestinyMessage(
  totalScore: number,
  maleElement: FiveElement,
  femaleElement: FiveElement,
  elementRelation: string
): string {
  const messages: Record<string, string[]> = {
    상생: [
      '두 분의 만남은 서로를 더 빛나게 하는 아름다운 인연입니다. 한 사람의 존재가 다른 한 사람에게 자연스러운 힘이 되는, 그런 관계의 축복을 받았습니다.',
      '당신들의 사랑은 나무가 햇살을 받아 자라듯, 물이 꽃을 피우듯 서로를 성장시키는 에너지를 품고 있습니다.',
    ],
    상보: [
      '서로를 보완하며 채워가는 아름다운 인연입니다. 혼자서는 완성할 수 없던 그림을 함께 완성해가는 여정이 당신들을 기다리고 있습니다.',
      '두 분은 퍼즐의 맞는 조각처럼, 함께할 때 비로소 완전해지는 특별한 인연입니다.',
    ],
    상극: [
      '다름 속에서 서로를 발견하는 특별한 인연입니다. 불이 물을 만나 따뜻한 온기가 되듯, 두 분의 차이는 새로운 가능성을 만들어냅니다.',
      '쉽지 않지만 그래서 더 특별한 인연입니다. 서로의 다름을 인정하고 존중할 때, 가장 깊은 사랑이 꽃핍니다.',
    ],
    비화: [
      '같은 기운을 가진 두 분은 서로를 거울처럼 비추며 성장합니다. 이해하기 쉬운 만큼, 더 깊은 곳까지 나아갈 수 있는 인연입니다.',
      '닮은 두 영혼이 만났습니다. 서로를 통해 자신을 더 잘 알게 되고, 함께 같은 방향을 바라보며 걸어갈 수 있는 동반자입니다.',
    ],
  };

  const baseMessages = messages[elementRelation] || messages['상보'];
  let message = baseMessages[Math.floor(totalScore / 50) % baseMessages.length];

  // 점수에 따른 추가 메시지
  if (totalScore >= 85) {
    message += ' 이런 인연은 흔치 않습니다. 서로를 소중히 여기세요.';
  } else if (totalScore >= 70) {
    message += ' 노력한 만큼 더 아름다워지는 관계입니다.';
  } else if (totalScore >= 55) {
    message += ' 함께 성장하며 서로의 부족함을 채워가세요.';
  }

  return message;
}

// === 등급 라벨 결정 ===
function getGradeLabel(score: number): { label: string; emoji: string } {
  if (score >= 90) return { label: '천생연분', emoji: '💫' };
  if (score >= 80) return { label: '운명적 인연', emoji: '✨' };
  if (score >= 70) return { label: '좋은 인연', emoji: '💕' };
  if (score >= 60) return { label: '발전하는 인연', emoji: '🌱' };
  if (score >= 50) return { label: '노력하는 인연', emoji: '💪' };
  return { label: '특별한 도전', emoji: '🌟' };
}

// === 메인 분석 함수 ===
export function analyzeCompatibility(
  male: FaceAnalysisResult,
  female: FaceAnalysisResult
): CompatibilityResult {
  // 1. 오행 판정
  const maleElement = determineElement(male);
  const femaleElement = determineElement(female);

  // 2. 오행 관계 분석
  const { relation: elementRelation, description: elementDescription } =
    analyzeElementRelation(maleElement, femaleElement);

  // 3. 카테고리별 궁합 점수 계산
  const categoryScores = calculateCategoryScores(male, female);

  // 4. 종합 점수 계산
  const categoryAvg =
    (categoryScores.emotion +
      categoryScores.values +
      categoryScores.lifestyle +
      categoryScores.future +
      categoryScores.physical) / 5;

  // 오행 관계에 따른 보너스/페널티
  const elementBonus =
    elementRelation === '상생' ? 8 :
    elementRelation === '상보' ? 5 :
    elementRelation === '비화' ? 3 :
    -3; // 상극

  const totalScore = Math.min(100, Math.max(0, Math.round(categoryAvg + elementBonus)));

  // 5. 등급 결정
  const { label: gradeLabel, emoji: gradeEmoji } = getGradeLabel(totalScore);

  // 6. 강점 분석
  const strengths = analyzeStrengths(male, female, categoryScores);

  // 7. 주의점 분석
  const challenges = analyzeChallenges(male, female, categoryScores);

  // 8. 서로 배려해야 할 점
  const mutualCare = analyzeMutualCare(male, female);

  // 9. 관계 발전 조언
  const developmentAdvice = generateDevelopmentAdvice(male, female, categoryScores);

  // 10. 시기별 관계 전망
  const periodForecast = generatePeriodForecast(male, female, categoryScores);

  // 11. 한줄 요약
  const summary = `${gradeEmoji} ${maleElement}(${male.gender === 'male' ? '남' : '남'})와 ${femaleElement}(여)의 ${elementRelation} 관계, ${gradeLabel}입니다.`;

  // 12. 운명적 메시지
  const destinyMessage = generateDestinyMessage(totalScore, maleElement, femaleElement, elementRelation);

  return {
    totalScore,
    gradeLabel,
    gradeEmoji,
    maleElement,
    femaleElement,
    elementRelation,
    elementDescription,
    categoryScores,
    strengths,
    challenges,
    mutualCare,
    developmentAdvice,
    periodForecast,
    summary,
    destinyMessage,
  };
}
