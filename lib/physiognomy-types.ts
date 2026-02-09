/**
 * 관상 해석 시스템 - Excel "관상 해석.xlsx" 데이터 기반
 * 과학적 비율 계산과 전통 관상 해석을 통합
 */

// === 특성(Trait) 정의 ===
// Excel "안좋은 궁합" 시트에서 추출한 점수 카테고리
export interface PhysiognomyTraits {
  // 정신/성격 관련
  정신력: number;     // 5점 만점 (의지력, 결단력)
  착함: number;       // 3점 만점 (배려심, 친절함)
  외도: number;       // 1점 만점 (충동성, 바람기)
  질투심: number;     // 2점 만점 (경쟁심, 시기)
  호기심: number;     // 2점 만점 (탐구심, 새로운 것에 대한 관심)
  남의시선: number;   // 2점 만점 (자의식, 타인 평가 의식)
  긍정: number;       // 4점 만점 (낙관성, 밝은 성격)

  // 운세/복 관련
  중년운: number;     // 4점 만점 (40-60대 운세)
  장수: number;       // 5점 만점 (건강, 수명)
  재물: number;       // 4점 만점 (돈복, 재정운)
  연애운: number;     // 3점 만점 (이성운, 결혼운)

  // 직업/사회 관련
  업무: number;       // 4점 만점 (직장운, 일 능력)
  책임감: number;     // 4점 만점 (성실함, 신뢰도)
  성실함: number;     // 3점 만점 (꾸준함, 노력)
  사교력: number;     // 3점 만점 (대인관계, 친화력)
  체력: number;       // 3점 만점 (기력, 활력)
}

// 특성별 최대 점수
export const TRAIT_MAX_SCORES: PhysiognomyTraits = {
  정신력: 5,
  착함: 3,
  외도: 1,
  질투심: 2,
  호기심: 2,
  남의시선: 2,
  긍정: 4,
  중년운: 4,
  장수: 5,
  재물: 4,
  연애운: 3,
  업무: 4,
  책임감: 4,
  성실함: 3,
  사교력: 3,
  체력: 3,
};

// 초기 특성 점수 (기본값)
export function createEmptyTraits(): PhysiognomyTraits {
  return {
    정신력: 0,
    착함: 0,
    외도: 0,
    질투심: 0,
    호기심: 0,
    남의시선: 0,
    긍정: 0,
    중년운: 0,
    장수: 0,
    재물: 0,
    연애운: 0,
    업무: 0,
    책임감: 0,
    성실함: 0,
    사교력: 0,
    체력: 0,
  };
}

// === 비율 기준값 정의 ===
// draw.py에서 추출한 기준 비율값
export interface RatioThresholds {
  name: string;
  description: string;
  thresholds: number[];  // 각 레벨 경계값 [매우높음, 높음, 보통, 낮음]
  labels: string[];      // 각 레벨 라벨
}

export const RATIO_THRESHOLDS: Record<string, RatioThresholds> = {
  // ratio1: 눈두덩이 (눈~눈썹 거리 / 코너비)
  eyebrowDistance: {
    name: '눈두덩이',
    description: '눈과 눈썹 사이 거리',
    thresholds: [0.8, 0.68, 0.6, 0.5],
    labels: ['매우 넓음', '넓은 편', '이상적', '좁은 편', '매우 좁음'],
  },

  // ratio2: 코길이 (코끝~눈 / 코너비)
  noseLength: {
    name: '코길이',
    description: '코의 세로 길이',
    thresholds: [1.55, 1.40, 1.28, 1.15],
    labels: ['매우 긴', '긴 편', '이상적', '짧은 편', '매우 짧은'],
  },

  // ratio3: 인중 (입술~코끝 / 코너비)
  philtrumLength: {
    name: '인중',
    description: '코밑에서 윗입술까지 거리',
    thresholds: [0.70, 0.65, 0.58, 0.50],
    labels: ['매우 긴', '긴 편', '이상적', '짧은 편', '매우 짧은'],
  },

  // ratio4: 턱길이 (턱~입술 / 코너비)
  chinLength: {
    name: '턱길이',
    description: '아랫입술에서 턱끝까지 거리',
    thresholds: [1.50, 1.20, 0.80, 0.60],
    labels: ['매우 긴', '긴 편', '이상적', '짧은 편', '매우 짧은'],
  },

  // ratio7: 입크기 (입 가로 / 코너비)
  mouthWidth: {
    name: '입크기',
    description: '입의 가로 너비',
    thresholds: [1.75, 1.65, 1.57, 1.45],
    labels: ['매우 큰', '큰 편', '이상적', '작은 편', '매우 작은'],
  },

  // ratio8: 하관 (입 가로 / 볼너비)
  jawWidth: {
    name: '하관',
    description: '턱의 너비 (하관)',
    thresholds: [0.78, 0.77, 0.76, 0.75],
    labels: ['매우 튼튼한', '튼튼한', '이상적', '얇은 편', '뾰족한'],
  },

  // 눈크기 (눈가로/눈세로 비율)
  eyeShape: {
    name: '눈모양',
    description: '눈의 가로세로 비율',
    thresholds: [3.5, 3.2, 2.8, 2.5],
    labels: ['매우 긴', '긴 편', '보통', '둥근 편', '매우 둥근'],
  },

  // 눈꼬리 각도
  eyeAngle: {
    name: '눈꼬리',
    description: '눈꼬리의 기울기',
    thresholds: [5, 2, -2, -5],
    labels: ['많이 올라감', '올라감', '일자', '내려감', '많이 내려감'],
  },
};

// === 특성 점수 변화 규칙 (Excel 기반) ===
export interface TraitModifier {
  feature: string;       // 특징 이름
  condition: string;     // 조건 (high, low, medium)
  changes: Partial<PhysiognomyTraits>;  // 점수 변화
}

export const TRAIT_MODIFIERS: TraitModifier[] = [
  // 1. 눈꼬리 (eye_updown)
  { feature: '눈꼬리', condition: 'high',   changes: { 정신력: 1, 중년운: 1, 착함: 0, 외도: 0 } },
  { feature: '눈꼬리', condition: 'medium', changes: { 정신력: 0, 중년운: 0, 착함: 0, 외도: 0 } },
  { feature: '눈꼬리', condition: 'low',    changes: { 정신력: -1, 중년운: 0, 착함: 1, 외도: 0 } },
  { feature: '눈꼬리', condition: 'verylow', changes: { 정신력: 0, 중년운: 0, 착함: 0, 외도: 1 } },

  // 2. 눈두덩이 (ratio1a)
  { feature: '눈두덩이', condition: 'high', changes: { 재물: 1, 정신력: -1 } },
  { feature: '눈두덩이', condition: 'low',  changes: { 재물: -1, 정신력: 1 } },

  // 3. 코길이 (ratio2a)
  { feature: '코길이', condition: 'high', changes: { 연애운: 1, 책임감: 1, 성실함: 1, 사교력: -1 } },
  { feature: '코길이', condition: 'low',  changes: { 정신력: -1, 연애운: 0, 성실함: 0, 사교력: 1, 긍정: 1 } },

  // 4. 인중길이 (ratio3a)
  { feature: '인중', condition: 'high', changes: { 장수: 1, 성실함: -1, 연애운: 1 } },
  { feature: '인중', condition: 'low',  changes: { 장수: 0, 사교력: -1, 긍정: -1, 체력: -1 } },

  // 5. 입크기 (ratio7a)
  { feature: '입크기', condition: 'high', changes: { 체력: 1, 업무: 1 } },
  { feature: '입크기', condition: 'low',  changes: { 체력: -1, 업무: -1 } },

  // 6. 하관 (ratio8a)
  { feature: '하관', condition: 'high', changes: { 중년운: 1, 사교력: 1 } },
  { feature: '하관', condition: 'low',  changes: { 중년운: -1, 사교력: 0 } },

  // 7. 눈크기 (youreye)
  { feature: '눈크기', condition: 'big',   changes: { 호기심: 1, 질투심: 0, 남의시선: 1 } },
  { feature: '눈크기', condition: 'small', changes: { 호기심: 0, 질투심: 1, 정신력: 1 } },
];

// === 관상 해석 텍스트 (Excel 기반) ===
export interface PhysiognomyInterpretation {
  feature: string;
  condition: string;
  shortLabel: string;
  description: string;
  advice?: string;
}

export const INTERPRETATIONS: PhysiognomyInterpretation[] = [
  // 눈두덩이
  {
    feature: '눈두덩이',
    condition: 'veryHigh',
    shortLabel: '눈두덩이가 매우 넓음',
    description: '타고난 복을 지니고 있어, 부모나 조상으로부터 유산을 물려받거나 조상의 덕을 봅니다. 낙천적이고 개방적인 성격입니다.',
    advice: '재물과 관련된 문서 작성에서는 맺고 끊음을 확실히 하세요.',
  },
  {
    feature: '눈두덩이',
    condition: 'high',
    shortLabel: '눈두덩이가 넓은 편',
    description: '자연스럽게 복이 많은 삶을 살며, 낙천적인 성향을 가지고 있습니다. 온순하고 착한 면모로 주변에 호감을 줍니다.',
    advice: '개인적인 경계를 설정하는 연습이 필요합니다.',
  },
  {
    feature: '눈두덩이',
    condition: 'medium',
    shortLabel: '눈두덩이가 이상적',
    description: '눈두덩이의 비율이 이상적으로 조화롭습니다. 미적인 측면에서 이점을 가져다주며, 자연스럽게 호감을 얻습니다.',
    advice: '마음의 여유를 유지하면 인생이 순탄합니다.',
  },
  {
    feature: '눈두덩이',
    condition: 'low',
    shortLabel: '눈두덩이가 좁은 편',
    description: '자신의 능력과 노력으로 성공을 이루는 자수성가형입니다. 일 처리가 섬세하고 꼼꼼합니다.',
    advice: '지나친 완벽주의는 조절이 필요합니다.',
  },

  // 코 관련
  {
    feature: '코',
    condition: 'long',
    shortLabel: '코가 긴 편',
    description: '책임감이 강하고 성실합니다. 자존심이 강해 결정한 바를 끝까지 밀고 나가는 완고함이 있습니다.',
    advice: '유연성을 가지면 대인관계가 더 좋아집니다.',
  },
  {
    feature: '코',
    condition: 'short',
    shortLabel: '코가 짧은 편',
    description: '낙관적이고 긍정적인 성격입니다. 상대의 기분을 잘 파악하며 장사에 소질이 있습니다.',
    advice: '깊이 생각하고 신중하게 결정하는 연습이 필요합니다.',
  },
  {
    feature: '코',
    condition: 'upturned',
    shortLabel: '들창코 (콧구멍이 보임)',
    description: '개방적이며 낙관적이고 시원시원한 성품입니다. 일의 결과에 성급할 수 있습니다.',
    advice: '장기적 계획을 세우고 금전관리에 신경쓰세요.',
  },
  {
    feature: '코',
    condition: 'hidden',
    shortLabel: '콧구멍 안보이는 코',
    description: '재물이 들어오면 잘 나가지 않는 자물통형입니다. 이성적 판단을 잘하고 금전관리에 능합니다.',
  },

  // 인중
  {
    feature: '인중',
    condition: 'long',
    shortLabel: '인중이 긴 편',
    description: '인간성이 뛰어나고 장수하는 경향이 있습니다. 인품 자체가 높은 평가를 받습니다.',
  },
  {
    feature: '인중',
    condition: 'short',
    shortLabel: '인중이 짧은 편',
    description: '성격적으로 다양한 관심사를 가지고 있습니다. 많은 사람과 교류하면 좋은 기회가 찾아옵니다.',
    advice: '장기적인 목표에 집중하는 연습이 도움됩니다.',
  },

  // 입
  {
    feature: '입',
    condition: 'large',
    shortLabel: '입이 큰 편',
    description: '리더십과 카리스마로 모두를 이끌어가는 성격입니다. 사회적으로 성공을 거둡니다.',
  },
  {
    feature: '입',
    condition: 'small',
    shortLabel: '입이 작은 편',
    description: '뛰어난 직관력과 빠른 판단력을 가지고 있습니다. 조언자나 보조 역할에 적합합니다.',
  },
  {
    feature: '입',
    condition: 'upturned',
    shortLabel: '입꼬리가 올라감',
    description: '긍정적 사고방식을 갖고 있습니다. 일처리를 야무지게 하고 살림을 잘합니다.',
  },
  {
    feature: '입',
    condition: 'downturned',
    shortLabel: '입꼬리가 처짐',
    description: '부정적인 생각이 강할 수 있습니다.',
    advice: '긍정적인 마음가짐을 유지하세요.',
  },

  // 턱/하관
  {
    feature: '하관',
    condition: 'strong',
    shortLabel: '하관이 튼튼함',
    description: '말년에 재물과 자녀의 복으로 풍요를 누립니다. 안정적인 재정 상태를 유지합니다.',
  },
  {
    feature: '하관',
    condition: 'pointed',
    shortLabel: '턱이 뾰족함',
    description: '말년에 재복과 자식 덕이 적을 수 있지만, 끊임없는 노력으로 자수성가합니다.',
    advice: '꾸준한 노력과 저축이 중요합니다.',
  },

  // 미간
  {
    feature: '미간',
    condition: 'wide',
    shortLabel: '미간이 넓음',
    description: '사고방식이 열려있고 이해력이 뛰어납니다. 지능이 좋고 시야가 넓습니다.',
  },
  {
    feature: '미간',
    condition: 'narrow',
    shortLabel: '미간이 좁음',
    description: '세상 보는 시야가 좁을 수 있습니다. 안전 지향형으로 약속을 잘 지킵니다.',
    advice: '융통성과 응용력을 기르세요.',
  },

  // 눈
  {
    feature: '눈',
    condition: 'long',
    shortLabel: '눈이 긴 편',
    description: '좋은 직업에 종사할 가능성이 높습니다.',
  },
  {
    feature: '눈',
    condition: 'big',
    shortLabel: '눈이 큰 편',
    description: '호기심이 왕성하고 표현력이 풍부합니다. 리더십이 뛰어납니다.',
    advice: '타인의 평가에 대한 불안을 관리하세요.',
  },
  {
    feature: '눈',
    condition: 'small',
    shortLabel: '눈이 작은 편',
    description: '신중하게 결정을 내립니다. 꾸준히 노력하여 성공하는 타입입니다.',
  },

  // 눈꼬리
  {
    feature: '눈꼬리',
    condition: 'upturned',
    shortLabel: '눈꼬리가 올라감',
    description: '대담하고 용기가 있으며 적극적이고 밝습니다. 자수성가하는 사람에게 많습니다.',
    advice: '감정의 기복을 조절하세요.',
  },
  {
    feature: '눈꼬리',
    condition: 'downturned',
    shortLabel: '눈꼬리가 내려감',
    description: '성품이 부드럽고 타인 배려를 잘합니다. 아이들을 좋아하며 연하를 선호하는 경향이 있습니다.',
    advice: '스트레스 관리가 중요합니다.',
  },

  // 눈썹
  {
    feature: '눈썹',
    condition: 'close',
    shortLabel: '눈과 눈썹이 붙음',
    description: '고독하고 배려심이 없을 수 있습니다.',
    advice: '타인에 대한 배려를 의식적으로 연습하세요.',
  },
  {
    feature: '눈썹',
    condition: 'drooping',
    shortLabel: '눈썹이 처짐',
    description: '낙천적인 성격으로 사교성이 좋습니다.',
    advice: '맺고 끊음을 확실히 하세요.',
  },

  // 입술
  {
    feature: '입술',
    condition: 'thin',
    shortLabel: '입술이 얇음',
    description: '책임감이 있고 담백합니다. 냉철하고 자기주관이 뚜렷합니다.',
    advice: '타인의 비밀을 말할 때 조심하세요.',
  },
];

// === 결과 문구 생성 ===
export interface ResultPhrase {
  minScore: number;
  trait: keyof PhysiognomyTraits;
  phrase: string;
}

export const RESULT_PHRASES: ResultPhrase[] = [
  // 높은 점수 (80+)
  { minScore: 80, trait: '연애운', phrase: '연애 걱정 없는 연애운 최고의 상입니다.' },
  { minScore: 80, trait: '정신력', phrase: '정신력은 따라올 자가 없는 상입니다.' },
  { minScore: 80, trait: '장수', phrase: '정말로 장수할 상입니다.' },
  { minScore: 80, trait: '재물', phrase: '돈이 따라오는 상입니다.' },
  { minScore: 80, trait: '업무', phrase: '일 하나는 똑부러지게 잘하는 상입니다.' },
  { minScore: 80, trait: '착함', phrase: '누가봐도 착한 얼굴을 가지고 있습니다.' },
  { minScore: 80, trait: '사교력', phrase: '사회성이 만랩인 상입니다.' },
  { minScore: 80, trait: '책임감', phrase: '책임감이 넘쳐 흐르는 상입니다.' },
  { minScore: 80, trait: '성실함', phrase: '성실함이 최고의 장점인 상입니다.' },

  // 중간 높음 (70+)
  { minScore: 70, trait: '중년운', phrase: '중년에 팔자가 피는 값비싼 상입니다.' },
  { minScore: 70, trait: '체력', phrase: '체력이 장군감인 상입니다.' },
  { minScore: 70, trait: '호기심', phrase: '호기심이 왕성해 보이는군요.' },

  // 특수 (부정적 특성이 높을 때)
  { minScore: 60, trait: '질투심', phrase: '질투심이 있는 상입니다.' },
  { minScore: 60, trait: '남의시선', phrase: '남의 시선을 다소 신경 쓰는 상입니다.' },
];

// === 특성 점수를 퍼센트로 변환 ===
export function traitToPercent(trait: keyof PhysiognomyTraits, value: number): number {
  const max = TRAIT_MAX_SCORES[trait];
  // 기본값 50%에서 시작하여 점수에 따라 조정
  const basePercent = 50;
  const adjustment = (value / max) * 30;  // 최대 ±30%
  return Math.max(20, Math.min(80, basePercent + adjustment));
}

// === 가장 높은 특성 찾기 ===
export function getTopTraits(traits: PhysiognomyTraits, count: number = 3): Array<{trait: string; value: number}> {
  const entries = Object.entries(traits) as Array<[keyof PhysiognomyTraits, number]>;

  // 부정적 특성 제외
  const positiveTraits = entries.filter(([key]) =>
    !['외도', '질투심', '남의시선'].includes(key)
  );

  return positiveTraits
    .sort((a, b) => {
      // 최대값 대비 비율로 정렬
      const ratioA = a[1] / TRAIT_MAX_SCORES[a[0]];
      const ratioB = b[1] / TRAIT_MAX_SCORES[b[0]];
      return ratioB - ratioA;
    })
    .slice(0, count)
    .map(([trait, value]) => ({ trait, value }));
}

// === 결과 문구 생성 ===
export function generateResultPhrase(traits: PhysiognomyTraits, totalScore: number): string {
  const topTraits = getTopTraits(traits, 1);

  if (topTraits.length === 0) {
    return `${totalScore}점 + 균형 잡힌 관상을 가지고 있습니다.`;
  }

  const topTrait = topTraits[0].trait as keyof PhysiognomyTraits;
  const traitPercent = traitToPercent(topTrait, traits[topTrait]);

  // 해당 특성에 맞는 문구 찾기
  const phrase = RESULT_PHRASES.find(p =>
    p.trait === topTrait && traitPercent >= p.minScore
  );

  if (phrase) {
    return `${totalScore}점 + ${phrase.phrase}`;
  }

  // 기본 문구
  return `${totalScore}점 + 좋은 관상을 가지고 있습니다.`;
}

// === 비율 레벨 계산 ===
export function getRatioLevel(ratioName: string, value: number): { level: number; label: string } {
  const thresholds = RATIO_THRESHOLDS[ratioName];
  if (!thresholds) {
    return { level: 3, label: '보통' };
  }

  for (let i = 0; i < thresholds.thresholds.length; i++) {
    if (value > thresholds.thresholds[i]) {
      return { level: 5 - i, label: thresholds.labels[i] };
    }
  }

  return { level: 1, label: thresholds.labels[thresholds.labels.length - 1] };
}

// === 해석 찾기 ===
export function findInterpretation(feature: string, condition: string): PhysiognomyInterpretation | undefined {
  return INTERPRETATIONS.find(i => i.feature === feature && i.condition === condition);
}

// === 특성 변화 적용 ===
export function applyTraitModifiers(
  traits: PhysiognomyTraits,
  feature: string,
  condition: string
): PhysiognomyTraits {
  const modifier = TRAIT_MODIFIERS.find(m => m.feature === feature && m.condition === condition);

  if (!modifier) return traits;

  const newTraits = { ...traits };

  for (const [key, change] of Object.entries(modifier.changes)) {
    const traitKey = key as keyof PhysiognomyTraits;
    newTraits[traitKey] = Math.max(0, Math.min(
      TRAIT_MAX_SCORES[traitKey],
      newTraits[traitKey] + (change as number)
    ));
  }

  return newTraits;
}
