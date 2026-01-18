// 테스트 결과를 공유 코드로 인코딩/디코딩하는 유틸리티

interface ShareableResult {
  t: number; // testType
  p: string; // primaryLabel
  s?: string; // secondaryLabel
  c?: string; // comment (축약)
  sc?: { n: string; v: number }[]; // subscales (name, value)
}

// 결과를 공유 코드로 인코딩
export function encodeTestResult(
  testType: number,
  primaryLabel: string,
  secondaryLabel?: string,
  comment?: string,
  subscales?: { name: string; score: number; percentile: number }[]
): string {
  const data: ShareableResult = {
    t: testType,
    p: primaryLabel,
  };

  if (secondaryLabel) {
    data.s = secondaryLabel;
  }

  if (comment) {
    // 코멘트는 처음 50자만 저장
    data.c = comment.slice(0, 50);
  }

  if (subscales && subscales.length > 0) {
    data.sc = subscales.map((s) => ({
      n: s.name,
      v: s.percentile,
    }));
  }

  // JSON을 base64로 인코딩 (URL-safe)
  const json = JSON.stringify(data);
  const base64 = Buffer.from(json, 'utf-8').toString('base64url');
  return base64;
}

// 공유 코드를 결과로 디코딩
export function decodeTestResult(code: string): ShareableResult | null {
  try {
    const json = Buffer.from(code, 'base64url').toString('utf-8');
    const data = JSON.parse(json) as ShareableResult;

    // 유효성 검사
    if (typeof data.t !== 'number' || data.t < 1 || data.t > 5) {
      return null;
    }
    if (typeof data.p !== 'string' || !data.p) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

// 테스트 정보 (간략화)
export const TEST_INFO: Record<number, { title: string; emoji: string }> = {
  1: { title: '애착유형 테스트', emoji: '💕' },
  2: { title: '갈등대처 테스트', emoji: '🤝' },
  3: { title: '연애가치관 테스트', emoji: '💎' },
  4: { title: '소비습관 테스트', emoji: '💰' },
  5: { title: '번아웃 테스트', emoji: '🔋' },
};
