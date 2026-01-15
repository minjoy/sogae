// 테스트 질문 데이터

export interface Question {
  id: number;
  text: string;
  reverse?: boolean; // 역채점 여부
  subscale: string; // 하위 척도
}

export interface TestDefinition {
  id: number;
  title: string;
  emoji: string;
  description: string;
  duration: string;
  questions: Question[];
  subscales: {
    [key: string]: {
      name: string;
      description: string;
    };
  };
}

// 테스트 1: 감정·애착 반응 타입
export const test1EmotionType: TestDefinition = {
  id: 1,
  title: "감정 타입 테스트",
  emoji: "💭",
  description: "불안/회피/몰입/완벽주의 패턴 파악",
  duration: "2분",
  subscales: {
    ANX: { name: "불안형", description: "관계의 안전을 자주 확인하고 싶어하는 경향" },
    AVD: { name: "회피형", description: "감정을 혼자 정리하는 편이 편한 경향" },
    IMM: { name: "과몰입형", description: "관계에 생각이 많이 쏠리는 경향" },
    PERF: { name: "완벽형", description: "관계에서 명확한 기준을 원하는 경향" },
  },
  questions: [
    { id: 1, text: "상대의 답이 늦으면, '내가 싫어진 걸까' 같은 생각이 자주 든다.", subscale: "ANX" },
    { id: 2, text: "관계가 흔들릴까 봐, 상대의 마음을 자주 확인하고 싶다.", subscale: "ANX" },
    { id: 3, text: "사소한 말/표정 변화에도 관계의 안전을 크게 걱정한다.", subscale: "ANX" },
    { id: 4, text: "갈등이 생기면 대화를 미루거나 혼자 시간을 벌고 싶다.", subscale: "AVD" },
    { id: 5, text: "너무 가까워지면 부담스럽고, 마음을 숨기고 싶어진다.", subscale: "AVD" },
    { id: 6, text: "힘든 감정은 상대에게 말하기보다 혼자 처리하는 편이 낫다.", subscale: "AVD" },
    { id: 7, text: "연애를 시작하면, 일/생활보다 관계가 우선이 되는 편이다.", subscale: "IMM" },
    { id: 8, text: "상대의 기분이 내 하루의 컨디션을 크게 좌우한다.", subscale: "IMM" },
    { id: 9, text: "'우리 관계'에 생각이 많이 쏠려 다른 일 집중이 어려울 때가 있다.", subscale: "IMM" },
    { id: 10, text: "관계에서 실수하면 오래 곱씹고 '망했다'고 느낀다.", subscale: "PERF" },
    { id: 11, text: "애매한 상태를 못 견뎌서, 결론을 빨리 내고 싶어진다.", subscale: "PERF" },
    { id: 12, text: "\"이 관계는 이렇게 가야 해\" 같은 기준이 머릿속에 강하게 있다.", subscale: "PERF" },
  ],
};

// 테스트 2: 소비 성향 심리
export const test2SpendingPsychology: TestDefinition = {
  id: 2,
  title: "소비 성향 심리",
  emoji: "💰",
  description: "위로/인정/통제/충동 소비 이해",
  duration: "2분",
  subscales: {
    COMF: { name: "위로형", description: "감정 조절을 위한 소비 경향" },
    APPR: { name: "인정형", description: "타인의 평가를 의식한 소비 경향" },
    CTRL: { name: "통제형", description: "계획적이고 관리된 소비 선호" },
    IMPL: { name: "충동형", description: "순간적 결정에 의한 소비 경향" },
  },
  questions: [
    { id: 1, text: "기분이 가라앉을 때, 뭔가 사면 마음이 빨리 나아진다.", subscale: "COMF" },
    { id: 2, text: "스트레스 받은 날엔 '이 정도는 괜찮아' 하며 지출이 느슨해진다.", subscale: "COMF" },
    { id: 3, text: "구매가 '나를 달래는 행동'처럼 느껴질 때가 있다.", subscale: "COMF" },
    { id: 4, text: "남에게 어떻게 보일지가 구매 결정에 꽤 영향을 준다.", subscale: "APPR" },
    { id: 5, text: "\"이걸 갖고 있으면 나도 괜찮은 사람\" 같은 느낌을 받을 때가 있다.", subscale: "APPR" },
    { id: 6, text: "관계/모임/소개팅을 앞두면 소비가 늘어나는 편이다.", subscale: "APPR" },
    { id: 7, text: "내 소비는 계획대로 관리되고 있다는 느낌이 중요하다.", subscale: "CTRL" },
    { id: 8, text: "지출이 예측 불가해지면 불안하고 바로 정리하고 싶다.", subscale: "CTRL" },
    { id: 9, text: "충동구매를 해도 후회가 거의 없다.", subscale: "CTRL", reverse: true },
    { id: 10, text: "장바구니에 담았다가도 순간 결제로 넘어갈 때가 있다.", subscale: "IMPL" },
    { id: 11, text: "할인/한정/마감 문구에 마음이 급해진다.", subscale: "IMPL" },
    { id: 12, text: "큰 지출 전에는 항상 하루 이상 시간을 두는 편이다.", subscale: "IMPL", reverse: true },
  ],
};

// 테스트 3: 일(업무) 처리 성향
export const test3WorkMode: TestDefinition = {
  id: 3,
  title: "일 처리 방식",
  emoji: "⚡",
  description: "계획/탐색/즉흥/마감 성향 분석",
  duration: "2분",
  subscales: {
    PLAN: { name: "계획형", description: "미리 계획을 세우고 체크리스트 관리 선호" },
    EXPL: { name: "탐색형", description: "방향과 구조를 먼저 잡는 것을 중요하게 생각" },
    IMPR: { name: "즉흥형", description: "그날의 흐름과 기회에 따라 유연하게 대응" },
    DEAD: { name: "마감형", description: "데드라인이 가까워져야 집중력 상승" },
  },
  questions: [
    { id: 1, text: "일정은 가능한 한 미리 잡아두는 편이 편하다.", subscale: "PLAN" },
    { id: 2, text: "목표를 쪼개서 체크리스트로 관리하면 마음이 안정된다.", subscale: "PLAN" },
    { id: 3, text: "계획 없이 시작해도 결과는 잘 나온다고 느낀다.", subscale: "PLAN", reverse: true },
    { id: 4, text: "시작 전 자료/사례를 많이 찾고 구조를 잡는 편이다.", subscale: "EXPL" },
    { id: 5, text: "'왜 하는지/어떤 방식이 좋은지' 방향 정리가 중요하다.", subscale: "EXPL" },
    { id: 6, text: "오래 고민하기보다 빨리 실행하는 편이다.", subscale: "EXPL", reverse: true },
    { id: 7, text: "갑자기 생긴 기회/아이디어에 바로 움직이는 편이다.", subscale: "IMPR" },
    { id: 8, text: "루틴보다 그날 컨디션과 흐름이 성과에 영향을 준다.", subscale: "IMPR" },
    { id: 9, text: "갑작스런 변경이 생기면 스트레스가 크다.", subscale: "IMPR", reverse: true },
    { id: 10, text: "데드라인이 가까워져야 집중력이 올라온다.", subscale: "DEAD" },
    { id: 11, text: "초반에는 느슨하지만 막판에 몰아쳐서 끝내는 편이다.", subscale: "DEAD" },
    { id: 12, text: "나는 항상 여유 있게 끝내는 편이다.", subscale: "DEAD", reverse: true },
  ],
};

// 테스트 4: 갈등·대화 스타일
export const test4ConflictStyle: TestDefinition = {
  id: 4,
  title: "갈등 대화 스타일",
  emoji: "💬",
  description: "회피/공격/설득/수용 대화법 확인",
  duration: "2분",
  subscales: {
    AVOID: { name: "회피형", description: "갈등 상황을 피하거나 미루는 경향" },
    ATTACK: { name: "공격형", description: "자신의 주장을 강하게 관철하려는 경향" },
    PERSUADE: { name: "설득형", description: "논리와 근거로 상대를 이해시키려는 경향" },
    ACCOM: { name: "수용형", description: "관계를 위해 자신의 욕구를 낮추는 경향" },
  },
  questions: [
    { id: 1, text: "싸움이 날 것 같으면 대화를 끊고 싶어진다.", subscale: "AVOID" },
    { id: 2, text: "문제를 꺼내면 더 커질까 봐 그냥 넘긴 적이 많다.", subscale: "AVOID" },
    { id: 3, text: "감정이 올라오면 \"나중에\"로 미루는 편이다.", subscale: "AVOID" },
    { id: 4, text: "내 주장을 관철하려고 말이 강해지는 편이다.", subscale: "ATTACK" },
    { id: 5, text: "상대가 틀렸다고 느끼면 바로 지적하고 싶다.", subscale: "ATTACK" },
    { id: 6, text: "이길 때까지 밀어붙인 적이 있다.", subscale: "ATTACK" },
    { id: 7, text: "논리/근거를 정리해서 상대를 이해시키려 한다.", subscale: "PERSUADE" },
    { id: 8, text: "합리적으로 풀면 상대도 납득할 거라 믿는 편이다.", subscale: "PERSUADE" },
    { id: 9, text: "감정 표현보다 '해결책'에 집중한다.", subscale: "PERSUADE" },
    { id: 10, text: "관계가 깨질까 봐 내 욕구를 낮추는 편이다.", subscale: "ACCOM" },
    { id: 11, text: "웬만하면 상대에 맞추고 상황을 정리한다.", subscale: "ACCOM" },
    { id: 12, text: "내 감정/욕구를 분명히 말하는 편이다.", subscale: "ACCOM", reverse: true },
  ],
};

// 테스트 5: 번아웃/에너지 잔량
export const test5BurnoutRisk: TestDefinition = {
  id: 5,
  title: "번아웃 위험도",
  emoji: "🔋",
  description: "현재 에너지 상태 측정",
  duration: "1분",
  subscales: {
    BURN: { name: "번아웃", description: "신체적, 정서적 소진 상태" },
  },
  questions: [
    { id: 1, text: "아침에 일어나도 피로가 남아 있다.", subscale: "BURN" },
    { id: 2, text: "해야 할 일 생각만 해도 몸이 무거워진다.", subscale: "BURN" },
    { id: 3, text: "집중이 예전보다 쉽게 흐트러진다.", subscale: "BURN" },
    { id: 4, text: "쉬어도 회복이 잘 안 된다고 느낀다.", subscale: "BURN" },
    { id: 5, text: "감정 기복이 커졌거나 예민해졌다.", subscale: "BURN" },
    { id: 6, text: "작은 일에도 짜증/무기력이 올라온다.", subscale: "BURN" },
    { id: 7, text: "사람을 만나는 게 부담스럽다.", subscale: "BURN" },
    { id: 8, text: "일/관계를 유지하는 데 에너지가 과하게 든다.", subscale: "BURN" },
    { id: 9, text: "요즘 나는 내 삶을 '잘 운영하고 있다'는 느낌이 든다.", subscale: "BURN", reverse: true },
    { id: 10, text: "최근 2주, 충분히 쉰 날이 꽤 있었다.", subscale: "BURN", reverse: true },
  ],
};

// 모든 테스트 맵
export const ALL_TESTS: { [key: number]: TestDefinition } = {
  1: test1EmotionType,
  2: test2SpendingPsychology,
  3: test3WorkMode,
  4: test4ConflictStyle,
  5: test5BurnoutRisk,
};
