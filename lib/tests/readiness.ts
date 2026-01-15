import { TestScore } from './scoring';

export interface ReadinessResult {
  score: number; // 0-100
  modeLabel: string;
  emoji: string;
  message: string;
  blockedReason?: string;
}

// 연애 준비 상태 계산
export function calculateReadiness(testScores: {
  [testType: number]: TestScore;
}): ReadinessResult {
  // 테스트 5 (번아웃)이 필수
  const burnoutTest = testScores[5];
  if (!burnoutTest) {
    throw new Error('Burnout test result is required');
  }

  const burnoutScore = burnoutTest.subscales.find((s) => s.subscale === 'BURN');
  if (!burnoutScore) {
    throw new Error('Burnout score not found');
  }

  // 번아웃 점수 기반 기본 점수
  let readinessScore = 100 - burnoutScore.percentile;

  // 테스트 1 (감정 타입) 반영
  const emotionTest = testScores[1];
  if (emotionTest) {
    const anx = emotionTest.subscales.find((s) => s.subscale === 'ANX');
    const avd = emotionTest.subscales.find((s) => s.subscale === 'AVD');
    const imm = emotionTest.subscales.find((s) => s.subscale === 'IMM');

    // 불안+회피 혼합형이면 감점
    if (anx && avd && anx.score >= 3.6 && avd.score >= 3.6) {
      readinessScore -= 15;
    }

    // 과몰입 경향이 강하면 감점
    if (imm && imm.score >= 4.0) {
      readinessScore -= 10;
    }
  }

  // 테스트 4 (갈등 스타일) 반영
  const conflictTest = testScores[4];
  if (conflictTest) {
    const attack = conflictTest.subscales.find((s) => s.subscale === 'ATTACK');
    const avoid = conflictTest.subscales.find((s) => s.subscale === 'AVOID');

    // 공격형 또는 회피형이 극단적이면 감점
    if (attack && attack.score >= 4.0) {
      readinessScore -= 10;
    }
    if (avoid && avoid.score >= 4.0) {
      readinessScore -= 10;
    }
  }

  // 점수 범위 조정
  readinessScore = Math.max(0, Math.min(100, readinessScore));

  // 모드 라벨 결정
  let modeLabel = '';
  let emoji = '';
  let message = '';
  let blockedReason = undefined;

  if (readinessScore >= 80) {
    modeLabel = '적극 추천';
    emoji = '🔥';
    message = '지금은 새로운 관계를 시작하기 좋은 시기예요!';
  } else if (readinessScore >= 55) {
    modeLabel = '천천히 추천';
    emoji = '🌿';
    message = '천천히, 여유있게 관계를 시작해보세요.';
  } else {
    modeLabel = '회복 권장';
    emoji = '🧘';
    message = '지금은 나를 돌보는 시간이 필요해요.';

    // 차단 이유
    const reasons: string[] = [];
    if (burnoutScore.score >= 3.6) {
      reasons.push('높은 번아웃 수준');
    }
    if (emotionTest) {
      const anx = emotionTest.subscales.find((s) => s.subscale === 'ANX');
      const avd = emotionTest.subscales.find((s) => s.subscale === 'AVD');
      if (anx && avd && anx.score >= 3.6 && avd.score >= 3.6) {
        reasons.push('불안정한 애착 패턴');
      }
    }
    if (conflictTest) {
      const attack = conflictTest.subscales.find((s) => s.subscale === 'ATTACK');
      if (attack && attack.score >= 4.0) {
        reasons.push('관계 갈등 위험도 높음');
      }
    }

    blockedReason = reasons.join(', ');
  }

  return {
    score: Math.round(readinessScore),
    modeLabel,
    emoji,
    message,
    blockedReason,
  };
}
