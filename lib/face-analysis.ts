// 얼굴 분석 알고리즘 - Python draw.py에서 TypeScript로 포팅
// Google Cloud Vision API의 얼굴 랜드마크 기반 관상 분석

export interface FacePoint {
  x: number;
  y: number;
  z?: number;
}

export interface FaceLandmarks {
  // 얼굴 주요 포인트 (Google Vision API 랜드마크 순서)
  leftEye: FacePoint;           // 0
  rightEye: FacePoint;          // 1
  leftEyebrowLeft: FacePoint;   // 2
  leftEyebrowRight: FacePoint;  // 3
  rightEyebrowLeft: FacePoint;  // 4
  rightEyebrowRight: FacePoint; // 5
  noseTip: FacePoint;           // 6
  upperLip: FacePoint;          // 8
  lowerLip: FacePoint;          // 9
  mouthLeft: FacePoint;         // 10
  mouthRight: FacePoint;        // 11
  mouthCenter: FacePoint;       // 12
  noseBottomRight: FacePoint;   // 13
  noseBottomLeft: FacePoint;    // 14
  noseBottomCenter: FacePoint;  // 15
  leftEyeTopBoundary: FacePoint;    // 16
  leftEyeLeftCorner: FacePoint;     // 17
  leftEyeBottomBoundary: FacePoint; // 18
  leftEyeRightCorner: FacePoint;    // 19
  rightEyeTopBoundary: FacePoint;   // 20
  rightEyeRightCorner: FacePoint;   // 21
  rightEyeBottomBoundary: FacePoint;// 22
  rightEyeLeftCorner: FacePoint;    // 23
  leftEyebrowUpperMidpoint: FacePoint; // 24
  rightEyebrowUpperMidpoint: FacePoint;// 25
  leftCheek: FacePoint;         // 26
  rightCheek: FacePoint;        // 27
  chin: FacePoint;              // 29
  jawLeft: FacePoint;           // 30
  jawRight: FacePoint;          // 31
  forehead: FacePoint;          // 32
  // raw array for compatibility
  all: FacePoint[];
}

export interface FaceAnalysisResult {
  facecode: string;
  score: number;
  panAngle: number;  // 얼굴 좌우 회전 각도
  tiltAngle: number; // 얼굴 상하 기울기 각도
  rollAngle: number; // 얼굴 회전 각도

  // 분석 결과 카테고리
  categories: {
    r1: number; // 운명/권력 점수
    r2: number; // 정신/성인/사랑 점수
    r3: number; // 일/사교/돈 점수
    r4: number; // 친절/책임/진실 점수
  };

  // 각 부위별 분석
  analysis: {
    eyeAngle: { label: string; description: string; };
    eyebrowDistance: { label: string; description: string; };
    noseLength: { label: string; description: string; };
    philtrumLength: { label: string; description: string; };
    mouthWidth: { label: string; description: string; };
    jawWidth: { label: string; description: string; };
    eyeSize: { label: string; description: string; };
  };

  // 종합 해석
  summary: string;
  recommendations: string[];

  // 성별 (분석에 사용)
  gender: 'male' | 'female';
}

// 가중치 설정 (draw.py와 동일)
const WEIGHTS = {
  r1_power: 3,
  r1_old: 5,
  r2_spirit: 5,
  r2_adult: 3,
  r2_love: 4,
  r2_jealousy: 1,
  r3_work: 4,
  r3_social: 4,
  r3_someone: 1,
  r3_money: 4,
  r4_kind: 3,
  r4_wind: 1,
  r4_responsibility: 3,
  r4_sincere: 3,
};

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function analyzeFace(
  landmarks: FaceLandmarks,
  gender: 'male' | 'female',
  panAngle: number = 0,
  tiltAngle: number = 0,
  rollAngle: number = 0
): FaceAnalysisResult {
  const fp = landmarks.all;
  let score = 0;
  let r1 = 0, r2 = 0, r3 = 0, r4 = 0;

  // draw.py와 동일한 기준 비율 계산
  // widthratio = 코 너비 (facepoint[13].x - facepoint[14].x)
  const noseWidth = Math.abs(fp[13].x - fp[14].x);
  // widthratio2 = 얼굴 너비 (facepoint[27].x - facepoint[26].x)
  const faceWidth = Math.abs(fp[27].x - fp[26].x);

  // 눈 너비 (기울기 계산용)
  const eyeFaceRatio = Math.abs(fp[17].x - fp[19].x);

  // === 1. 눈꼬리 각도 분석 (draw.py 로직과 동일) ===
  // 눈 앞쪽 기울기
  const aangle = (fp[23].y - fp[17].y) / (fp[23].x - fp[17].x);

  // b값 구하기 (직선의 y절편)
  const b1spot = fp[23].y - aangle * fp[23].x;
  const b2spot = fp[21].y - aangle * fp[21].x;

  // 코 끝 x좌표에서 두 직선의 y값 계산
  const b1_y = aangle * fp[6].x + b1spot;
  const b2_y = aangle * fp[6].x + b2spot;

  // 눈꼬리 각도 계산 (draw.py: faceangle = (b2_y-b1_y)/faceratio*100)
  const faceAngle = ((b2_y - b1_y) / eyeFaceRatio) * 100;

  let eyeAngleAnalysis: { label: string; description: string };

  // draw.py 임계값과 동일하게 적용
  if (faceAngle > -2.0) {
    eyeAngleAnalysis = {
      label: "눈꼬리 내려감",
      description: "마음이 부드러우며 타인에 대한 배려가 깊어, 주변 환경에 능동적으로 적응하는 능력이 뛰어납니다. 어린이에 대한 애정이 많고, 연애에서는 자신보다 연령이 어린 상대를 선호하는 경향이 있습니다. 그러나 내면의 스트레스가 쌓이면 예기치 않게 감정이 폭발할 위험이 있으므로 주의가 필요합니다."
    };
    score += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_adult * 1 + WEIGHTS.r4_kind * 2 + WEIGHTS.r4_wind * 1;
    r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_adult * 1;
    r4 += WEIGHTS.r4_kind * 2 + WEIGHTS.r4_wind * 1;
  } else if (faceAngle <= -2.0 && faceAngle > -4.0) {
    eyeAngleAnalysis = {
      label: "눈꼬리 일자",
      description: "내면에 강한 의지와 결단력을 지니고 있지만, 때때로 대담한 행동을 취하는 데 있어 약간의 망설임이 있습니다. 감정의 기복이 크지 않아 일관된 태도를 유지하는 데 강점을 가지고 있으나, 지나친 무덤덤함은 열정 부족으로 느껴질 수 있습니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_adult * 3 + WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 3;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_adult * 3;
    r4 += WEIGHTS.r4_kind * 5 + WEIGHTS.r4_wind * 3;
  } else if (faceAngle <= -4.0 && faceAngle > -11.0) {
    eyeAngleAnalysis = {
      label: "눈꼬리 올라감",
      description: "대담하고 용기 넘치며, 언제나 적극적이고 밝은 에너지를 발산합니다. 실패에 대한 두려움이 없어, 도전적인 상황에서도 적절하고 과감한 행동을 취하는 경향이 있습니다. 자수성가한 인물들에게서 흔히 볼 수 있는 덕목입니다."
    };
    score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_adult * 4 + WEIGHTS.r4_kind * 4 + WEIGHTS.r4_wind * 4;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 4 + WEIGHTS.r4_wind * 4;
  } else {
    eyeAngleAnalysis = {
      label: "눈꼬리 많이 올라감",
      description: "그 기상이 마치 하늘을 찌를 듯이 웅장하며, 모든 면에서 적극적이고 강인한 면모를 발휘합니다. 리더십과 독립적인 성향이 강하지만, 독불장군과 같은 고집스러움이 동반될 수 있습니다."
    };
    score += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_adult * 4 + WEIGHTS.r4_kind * 1 + WEIGHTS.r4_wind * 5;
    r2 += WEIGHTS.r2_spirit * 5 + WEIGHTS.r2_adult * 4;
    r4 += WEIGHTS.r4_kind * 1 + WEIGHTS.r4_wind * 5;
  }

  // === 2. 눈썹-눈 거리 분석 (ratio1) ===
  // draw.py: ratio1 = (facepoint[0].y - facepoint[24].y) / widthratio
  // fp[0] = LEFT_EYE (눈 중심), fp[24] = LEFT_EYEBROW_UPPER_MIDPOINT (눈썹 위쪽 중간)
  const ratio1 = (fp[0].y - fp[24].y) / noseWidth;

  let eyebrowDistanceAnalysis: { label: string; description: string };

  // draw.py 임계값: > 0.8, > 0.68, > 0.6, else
  if (ratio1 > 0.8) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 매우 넓음",
      description: "타고난 복을 지니고 있어, 부모나 조상으로부터 유산을 물려받거나 조상의 덕을 보는 일이 자주 발생합니다. 낙천적이고 개방적인 성격이지만, 재물 관련 계산이나 문서 작성 시 맺고 끊음을 확실히 해야 합니다."
    };
    score += WEIGHTS.r2_spirit * 2 + WEIGHTS.r3_money * 5;
    r2 += WEIGHTS.r2_spirit * 2;
    r3 += WEIGHTS.r3_money * 5;
  } else if (ratio1 > 0.68) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 넓은 편",
      description: "자연스럽게 복이 많은 삶을 살고 있으며, 부모님의 온전한 사랑과 지원에서 비롯된 낙천적인 성향을 가지고 있습니다. 온순하고 착한 면모로 주변 사람들에게 큰 호감을 주지만, 개인적인 경계 설정에 어려움이 있을 수 있습니다."
    };
    score += WEIGHTS.r2_spirit * 2 + WEIGHTS.r3_money * 2;
    r2 += WEIGHTS.r2_spirit * 2;
    r3 += WEIGHTS.r3_money * 2;
  } else if (ratio1 > 0.6) {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 이상적",
      description: "눈두덩이의 비율이 이상적으로 조화롭습니다. 미적인 측면에서 많은 이점을 가져다주며, 자연스럽게 사람들의 호감을 얻습니다. 인생의 굴곡이 있을 수 있으나 마음의 여유를 갖으면 순탄할 것입니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r3_money * 2;
    r2 += WEIGHTS.r2_spirit * 3;
    r3 += WEIGHTS.r3_money * 2;
  } else {
    eyebrowDistanceAnalysis = {
      label: "눈과 눈썹 사이가 좁음",
      description: "부모나 조상의 유산은 별로 없지만 자신의 능력과 노력으로 성공을 이뤄내는 자수성가의 길이 열려 있습니다. 일 처리 방식이 섬세하고 꼼꼼하며, 공과 사가 확실하지만 냉철하다는 평을 받기도 합니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r3_money * 2;
    r2 += WEIGHTS.r2_spirit * 3;
    r3 += WEIGHTS.r3_money * 2;
  }

  // === 3. 코 길이 분석 (ratio2) ===
  // draw.py: ratio2 = (facepoint[15].y - facepoint[0].y) / widthratio
  // fp[15] = NOSE_BOTTOM_CENTER, fp[0] = LEFT_EYE
  const ratio2 = (fp[15].y - fp[0].y) / noseWidth;

  let noseLengthAnalysis: { label: string; description: string };

  // draw.py 임계값: > 1.55, > 1.28, else
  if (ratio2 > 1.55) {
    noseLengthAnalysis = {
      label: "코가 긴 편",
      description: "강한 책임감과 성실함을 바탕으로 일에 임하는 타입입니다. 꼼꼼하며 자존심이 강해, 일단 결정한 바를 끝까지 밀고 나가는 완고한 면모를 가지고 있습니다. 사교성이 부족한 부분이 있어 노력으로 보완하면 좋습니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 5 + WEIGHTS.r3_social * 3 + WEIGHTS.r4_responsibility * 5 + WEIGHTS.r4_sincere * 5;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 5;
    r3 += WEIGHTS.r3_social * 3;
    r4 += WEIGHTS.r4_responsibility * 5 + WEIGHTS.r4_sincere * 5;
  } else if (ratio2 > 1.28) {
    noseLengthAnalysis = {
      label: "코 길이가 이상적",
      description: "이상적인 중년의 모습을 그대로 담고 있습니다. 삶의 격랑을 거치며 얻은 평온함이 태도와 마음가짐에 깊이 배어 있으며, 균형 잡힌 능력을 지니고 있어 다양한 사회적 상황에서 자신의 역할을 훌륭히 수행합니다."
    };
    score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 4 + WEIGHTS.r3_social * 4 + WEIGHTS.r4_responsibility * 4 + WEIGHTS.r4_sincere * 4;
    r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_love * 4;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 4 + WEIGHTS.r4_sincere * 4;
  } else {
    noseLengthAnalysis = {
      label: "코가 짧은 편",
      description: "타고난 낙관주의자로, 긍정적인 태도를 유지하는 데 뛰어난 능력을 지니고 있습니다. 상대방의 기분과 필요를 정확히 파악하는 능력이 탁월해 장사에도 잘 어울립니다. 다만 깊이 생각하는 것에 서툴 수 있습니다."
    };
    score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_love * 2 + WEIGHTS.r3_social * 4 + WEIGHTS.r4_responsibility * 2 + WEIGHTS.r4_sincere * 3;
    r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_love * 2;
    r3 += WEIGHTS.r3_social * 4;
    r4 += WEIGHTS.r4_responsibility * 2 + WEIGHTS.r4_sincere * 3;
  }

  // === 4. 인중 길이 분석 (ratio3) ===
  // draw.py: ratio3 = (facepoint[12].y - facepoint[15].y) / widthratio
  // fp[12] = MOUTH_CENTER, fp[15] = NOSE_BOTTOM_CENTER
  const ratio3 = (fp[12].y - fp[15].y) / noseWidth;

  let philtrumAnalysis: { label: string; description: string };

  // draw.py 임계값: > 0.7, > 0.65, > 0.58, > 0.5, else
  if (ratio3 > 0.7) {
    philtrumAnalysis = {
      label: "인중이 매우 긴 편",
      description: "인간성이 뛰어나고 장수하는 경향이 있습니다. 물질적인 풍요로움과는 별개로 인품 자체가 높은 평가를 받으며, 자녀운도 좋습니다. 타인과의 관계에서도 긍정적인 영향을 미치며 존중과 사랑을 받습니다."
    };
    score += WEIGHTS.r1_old * 5 + WEIGHTS.r2_love * 5 + WEIGHTS.r4_sincere * 5;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else if (ratio3 > 0.65) {
    philtrumAnalysis = {
      label: "인중이 긴 편",
      description: "종종 자신의 노력으로 설명할 수 없는 힘을 발휘하거나 예상치 못한 긍정적인 평가를 받는 경우가 많습니다. 이는 내면적 가치와 성격이 외부 세계에 긍정적인 영향을 끼치기 때문입니다."
    };
    score += WEIGHTS.r1_old * 5 + WEIGHTS.r2_love * 5 + WEIGHTS.r4_sincere * 5;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else if (ratio3 > 0.58) {
    philtrumAnalysis = {
      label: "인중이 이상적",
      description: "자녀운에 있어서도 긍정적인 영향을 끌어당기는 경향이 있어, 가정 내에서도 긍정적인 역할을 합니다. 세대를 넘어서는 긍정적인 영향력을 발휘하며 주변 사람들로부터 존중과 사랑을 받는 기반을 마련합니다."
    };
    score += WEIGHTS.r1_old * 5 + WEIGHTS.r2_love * 5 + WEIGHTS.r4_sincere * 5;
    r1 += WEIGHTS.r1_old * 5;
    r2 += WEIGHTS.r2_love * 5;
    r4 += WEIGHTS.r4_sincere * 5;
  } else if (ratio3 > 0.5) {
    philtrumAnalysis = {
      label: "인중이 짧은 편",
      description: "성격적으로 변덕이 있을 수 있고 사람들과 깊은 관계를 맺는 것을 주저할 수 있습니다. 그러나 많은 사람과 적극적으로 교류하면 도움을 받을 수 있는 인물을 만날 가능성이 높습니다."
    };
    score += WEIGHTS.r1_power * 2 + WEIGHTS.r3_social * 2 + WEIGHTS.r4_sincere * 1;
    r1 += WEIGHTS.r1_power * 2;
    r3 += WEIGHTS.r3_social * 2;
    r4 += WEIGHTS.r4_sincere * 1;
  } else {
    philtrumAnalysis = {
      label: "인중이 매우 짧은 편",
      description: "때로는 집중력을 유지하고 장기적인 목표를 달성하는 데 어려움을 초래할 수 있습니다. 그러나 많은 사람들과 적극적으로 교류하며 관계를 넓혀가면 상황을 전환시킬 수 있는 기회가 찾아옵니다."
    };
    score += WEIGHTS.r1_power * 2 + WEIGHTS.r3_social * 2 + WEIGHTS.r4_sincere * 1;
    r1 += WEIGHTS.r1_power * 2;
    r3 += WEIGHTS.r3_social * 2;
    r4 += WEIGHTS.r4_sincere * 1;
  }

  // === 5. 입 너비 분석 (ratio7) ===
  // draw.py: ratio7 = (facepoint[11].x - facepoint[10].x) / widthratio
  const mouthWidth = Math.abs(fp[11].x - fp[10].x);
  const ratio7 = mouthWidth / noseWidth;

  let mouthAnalysis: { label: string; description: string };

  // draw.py 임계값: > 1.75, > 1.65, > 1.57, > 1.45, else
  if (ratio7 > 1.75) {
    mouthAnalysis = {
      label: "입이 매우 큰 편",
      description: "타고난 리더십과 인상적인 카리스마로 모두를 이끌어가는 성격을 지니고 있으며, 사회적으로도 큰 성공을 거두는 모습을 보여줍니다. 성실하고 헌신적이며 인정이 많습니다."
    };
    score += WEIGHTS.r1_power * 5 + WEIGHTS.r3_work * 5;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else if (ratio7 > 1.65) {
    mouthAnalysis = {
      label: "입이 큰 편",
      description: "주변에 운기와 생명력이 넘치는 에너지를 발산하며, 주위 사람들로부터 깊은 존경을 받는 존재가 됩니다. 업무 환경에서 부하 직원이나 동료들 사이에서 매우 인기가 있습니다."
    };
    score += WEIGHTS.r1_power * 5 + WEIGHTS.r3_work * 5;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else if (ratio7 > 1.57) {
    mouthAnalysis = {
      label: "입 크기가 이상적",
      description: "진정성과 노력으로 어떤 분야에서든 성공의 정점을 찍을 수 있으며, 삶과 경력은 많은 이들에게 영감을 주는 사례가 될 것입니다. 리더십 아래에서는 모두가 함께 성장합니다."
    };
    score += WEIGHTS.r1_power * 5 + WEIGHTS.r3_work * 5;
    r1 += WEIGHTS.r1_power * 5;
    r3 += WEIGHTS.r3_work * 5;
  } else if (ratio7 > 1.45) {
    mouthAnalysis = {
      label: "입이 작은 편",
      description: "뛰어난 직관력과 빠른 판단력으로 성과를 창출하는 데 탁월한 능력을 지니고 있습니다. 조직의 넘버1보다 전략적인 조언자나 중요한 보조 역할을 맡는 것이 더 적합한 경우가 많습니다."
    };
    score += WEIGHTS.r1_power * 3 + WEIGHTS.r3_work * 3;
    r1 += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_work * 3;
  } else {
    mouthAnalysis = {
      label: "입이 매우 작은 편",
      description: "성격이 매우 상냥하며, 높은 직위에 있는 인물들을 보좌하고 서포트하는 데에 특별한 재능을 보입니다. 조직의 성공에 빼놓을 수 없는 중추적인 역할을 합니다."
    };
    score += WEIGHTS.r1_power * 3 + WEIGHTS.r3_work * 3;
    r1 += WEIGHTS.r1_power * 3;
    r3 += WEIGHTS.r3_work * 3;
  }

  // === 6. 하관(턱) 너비 분석 (ratio8) ===
  // draw.py: ratio8 = (facepoint[31].x - facepoint[30].x) / widthratio2
  const jawWidth = Math.abs(fp[31].x - fp[30].x);
  const ratio8 = jawWidth / faceWidth;

  let jawAnalysis: { label: string; description: string };

  // draw.py 임계값: > 0.78, > 0.77, > 0.76, > 0.75, else
  if (ratio8 > 0.78) {
    jawAnalysis = {
      label: "하관이 매우 튼튼함",
      description: "말년에 재물과 자녀의 복으로 큰 풍요를 누릴 예정입니다. 안정적인 재정 상태와 자식들의 성공으로 편안하고 충족된 삶을 즐길 수 있습니다."
    };
    score += WEIGHTS.r2_adult * 5 + WEIGHTS.r3_social * 5;
    r2 += WEIGHTS.r2_adult * 5;
    r3 += WEIGHTS.r3_social * 5;
  } else if (ratio8 > 0.77) {
    jawAnalysis = {
      label: "하관이 튼튼함",
      description: "말년에 재물과 자녀의 복으로 풍요를 누릴 예정입니다. 삶의 후반기에 안정적인 재정 상태와 자식들의 성공 덕분에 편안한 삶을 즐길 수 있게 됩니다."
    };
    score += WEIGHTS.r2_adult * 5 + WEIGHTS.r3_social * 5;
    r2 += WEIGHTS.r2_adult * 5;
    r3 += WEIGHTS.r3_social * 5;
  } else if (ratio8 > 0.76) {
    jawAnalysis = {
      label: "하관이 이상적",
      description: "말년에 재물과 자녀의 복으로 풍요를 누릴 예정입니다. 삶의 후반기가 되어서는 편안하고 충족된 삶을 즐길 수 있게 됩니다."
    };
    score += WEIGHTS.r2_adult * 5 + WEIGHTS.r3_social * 5;
    r2 += WEIGHTS.r2_adult * 5;
    r3 += WEIGHTS.r3_social * 5;
  } else if (ratio8 > 0.75) {
    jawAnalysis = {
      label: "턱이 좁은 편",
      description: "말년에 재물운과 자식의 도움이 부족해 어려움을 겪을 수 있으나, 끊임없는 노력으로 자수성가의 길을 걷게 됩니다. 꾸준한 열정과 헌신은 결국 성공을 가져올 것입니다."
    };
    score += WEIGHTS.r2_adult * 1 + WEIGHTS.r3_social * 1;
    r2 += WEIGHTS.r2_adult * 1;
    r3 += WEIGHTS.r3_social * 1;
  } else {
    jawAnalysis = {
      label: "턱이 매우 뾰족함",
      description: "말년에 어려움이 있을 수 있으나, 끊임없는 노력으로 자수성가의 길을 걷게 됩니다. 꾸준한 열정과 헌신은 결국 성공과 만족을 가져올 것입니다."
    };
    score += WEIGHTS.r2_adult * 1 + WEIGHTS.r3_social * 1;
    r2 += WEIGHTS.r2_adult * 1;
    r3 += WEIGHTS.r3_social * 1;
  }

  // === 7. 눈 크기 분석 ===
  // draw.py 로직과 동일
  const eyeSizeLeftX = Math.abs(fp[17].x - fp[19].x); // 왼쪽 눈 가로 길이
  const eyeSizeLeftY = Math.abs(fp[18].y - fp[16].y); // 왼쪽 눈 세로 길이
  const eyeRatio = eyeSizeLeftX / Math.max(eyeSizeLeftY, 1); // 눈 가로세로 비율
  const eyeFaceWidthRatio = faceWidth / eyeSizeLeftX; // 얼굴 대비 눈 비율

  let eyeSizeAnalysis: { label: string; description: string };

  // draw.py: eyefaceratio < 5.33이면 눈이 큰 편
  if (eyeFaceWidthRatio < 5.33) {
    if (eyeRatio > 3.5) {
      eyeSizeAnalysis = {
        label: "눈이 아주 작은 편",
        description: "결정을 내릴 때 신중함을 기하며, 모든 가능성을 고려한 뒤 행동으로 옮깁니다. 경계심이 강해 사람을 쉽게 신뢰하지 않으며, 결정을 내리면 그 의지는 굳건합니다."
      };
      score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_jealousy * 3 + WEIGHTS.r3_someone * 3 + WEIGHTS.r4_kind * 4;
      r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_jealousy * 3;
      r3 += WEIGHTS.r3_someone * 3;
      r4 += WEIGHTS.r4_kind * 4;
    } else if (eyeRatio > 3.2) {
      eyeSizeAnalysis = {
        label: "눈이 작은 편",
        description: "어려운 환경에서 자랐거나 젊은 시절 고난을 겪었음에도 불구하고, 끊임없는 노력으로 성공의 길을 걷는 인물입니다. 강한 질투심이 목표 달성의 원동력이 되기도 합니다."
      };
      score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_jealousy * 3 + WEIGHTS.r3_someone * 3 + WEIGHTS.r4_kind * 4;
      r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_jealousy * 3;
      r3 += WEIGHTS.r3_someone * 3;
      r4 += WEIGHTS.r4_kind * 4;
    } else if (eyeRatio > 2.5) {
      eyeSizeAnalysis = {
        label: "눈이 큰 편",
        description: "호기심이 매우 강하고 표현력이 풍부합니다. 빠른 사고와 행동력을 바탕으로 넓은 시야를 가지고 있어, 상황에 따라 대담한 조치를 취하는 능력이 뛰어납니다."
      };
      score += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_jealousy * 5 + WEIGHTS.r3_someone * 1 + WEIGHTS.r4_kind * 1;
      r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_jealousy * 5;
      r3 += WEIGHTS.r3_someone * 1;
      r4 += WEIGHTS.r4_kind * 1;
    } else {
      eyeSizeAnalysis = {
        label: "눈이 아주 큰 편",
        description: "날카로운 눈빛과 큰 눈은 자연스러운 리더십을 발휘하며, 어려움을 극복하는 강인한 정신력을 가지고 있습니다. 경영이나 정치 분야에서 뛰어난 역할을 할 수 있습니다."
      };
      score += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_jealousy * 5 + WEIGHTS.r3_someone * 1 + WEIGHTS.r4_kind * 1;
      r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_jealousy * 5;
      r3 += WEIGHTS.r3_someone * 1;
      r4 += WEIGHTS.r4_kind * 1;
    }
  } else {
    // 얼굴 대비 눈이 작은 경우 (eyeFaceWidthRatio >= 5.33)
    if (eyeRatio > 3.5) {
      eyeSizeAnalysis = {
        label: "눈이 아주 작고 긴 편",
        description: "순수한 마음의 소유자로, 사회생활을 잘하는 성격입니다. 회사 조직 방향에 꾸준한 활동을 계속하여 주위의 도움으로 성공할 수 있습니다. 의지할 사람이 나타나면 의존하는 경향이 있습니다."
      };
      score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_jealousy * 3 + WEIGHTS.r3_someone * 3 + WEIGHTS.r4_kind * 5;
      r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_jealousy * 3;
      r3 += WEIGHTS.r3_someone * 3;
      r4 += WEIGHTS.r4_kind * 5;
    } else if (eyeRatio > 3.2) {
      eyeSizeAnalysis = {
        label: "눈이 작고 긴 편",
        description: "연애에서 따뜻하고 다정한 모습을 보이며 상대방의 감수성을 잘 이해합니다. 감수성이 풍부하고 유연한 성격으로, 사람들과 원활한 관계를 유지합니다."
      };
      score += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_jealousy * 3 + WEIGHTS.r3_someone * 3 + WEIGHTS.r4_kind * 5;
      r2 += WEIGHTS.r2_spirit * 3 + WEIGHTS.r2_jealousy * 3;
      r3 += WEIGHTS.r3_someone * 3;
      r4 += WEIGHTS.r4_kind * 5;
    } else if (eyeRatio > 2.5) {
      eyeSizeAnalysis = {
        label: "눈이 보통 크기",
        description: "호기심이 왕성하고 표현력이 풍부한 성격으로, 빠른 판단력과 대담한 행동력을 가지고 있습니다. 주변을 주의 깊게 관찰하며 협조적이고 배려심 있는 성격입니다."
      };
      score += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_jealousy * 1 + WEIGHTS.r3_work * 5 + WEIGHTS.r3_someone * 1 + WEIGHTS.r4_kind * 1;
      r2 += WEIGHTS.r2_spirit * 1 + WEIGHTS.r2_jealousy * 1;
      r3 += WEIGHTS.r3_work * 5 + WEIGHTS.r3_someone * 1;
      r4 += WEIGHTS.r4_kind * 1;
    } else {
      eyeSizeAnalysis = {
        label: "눈이 작지만 둥근 편",
        description: "질투심이 있어 다른 사람들과의 관계에서 조심할 필요가 있습니다. 더욱 신중하게 판단하고 타인과의 대화에서 열린 마음을 가지면 성공과 인간관계 개선에 도움이 됩니다."
      };
      score += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_jealousy * 3 + WEIGHTS.r3_someone * 3 + WEIGHTS.r4_kind * 4;
      r2 += WEIGHTS.r2_spirit * 4 + WEIGHTS.r2_jealousy * 3;
      r3 += WEIGHTS.r3_someone * 3;
      r4 += WEIGHTS.r4_kind * 4;
    }
  }

  // === 종합 점수 정규화 (100점 만점) ===
  // draw.py의 대략적인 최대 점수를 기준으로 정규화
  const maxPossibleScore = 350; // draw.py 기준 대략적인 최대 점수
  const normalizedScore = Math.min(100, Math.round((score / maxPossibleScore) * 100));

  // === 종합 해석 생성 ===
  const summaryParts: string[] = [];

  if (r1 > 30) summaryParts.push("리더십과 권력 운이 강합니다");
  if (r2 > 60) summaryParts.push("정신적 성숙도와 사랑운이 좋습니다");
  if (r3 > 50) summaryParts.push("사회적 성공과 재물운이 있습니다");
  if (r4 > 50) summaryParts.push("성실하고 책임감 있는 성격입니다");

  const summary = summaryParts.length > 0
    ? summaryParts.join('. ') + '.'
    : '균형 잡힌 관상을 가지고 있습니다.';

  // === 추천사항 생성 ===
  const recommendations: string[] = [];

  if (eyeAngleAnalysis.label.includes('올라감')) {
    recommendations.push("감정의 기복을 조절하는 연습이 도움이 됩니다");
  }
  if (philtrumAnalysis.label.includes('짧은')) {
    recommendations.push("다양한 사람들과 교류하면 좋은 기회가 찾아옵니다");
  }
  if (jawAnalysis.label.includes('좁은') || jawAnalysis.label.includes('뾰족')) {
    recommendations.push("꾸준한 노력으로 자수성가의 길을 걸어가세요");
  }
  if (mouthAnalysis.label.includes('큰')) {
    recommendations.push("리더십을 발휘할 수 있는 기회를 찾아보세요");
  }
  if (eyebrowDistanceAnalysis.label.includes('좁음')) {
    recommendations.push("자수성가형으로 꼼꼼한 계획이 성공의 열쇠입니다");
  }

  if (recommendations.length === 0) {
    recommendations.push("현재의 좋은 관상을 유지하며 긍정적인 마음가짐을 가지세요");
  }

  return {
    facecode: generateUUID(),
    score: normalizedScore,
    panAngle,
    tiltAngle,
    rollAngle,
    categories: { r1, r2, r3, r4 },
    analysis: {
      eyeAngle: eyeAngleAnalysis,
      eyebrowDistance: eyebrowDistanceAnalysis,
      noseLength: noseLengthAnalysis,
      philtrumLength: philtrumAnalysis,
      mouthWidth: mouthAnalysis,
      jawWidth: jawAnalysis,
      eyeSize: eyeSizeAnalysis,
    },
    summary,
    recommendations,
    gender,
  };
}

// Google Vision API 응답을 FaceLandmarks로 변환
export function convertVisionLandmarks(landmarks: Array<{ type: string; position: { x: number; y: number; z?: number } }>): FaceLandmarks {
  const landmarkMap: { [key: string]: number } = {
    'LEFT_EYE': 0,
    'RIGHT_EYE': 1,
    'LEFT_OF_LEFT_EYEBROW': 2,
    'RIGHT_OF_LEFT_EYEBROW': 3,
    'LEFT_OF_RIGHT_EYEBROW': 4,
    'RIGHT_OF_RIGHT_EYEBROW': 5,
    'NOSE_TIP': 6,
    'UPPER_LIP': 8,
    'LOWER_LIP': 9,
    'MOUTH_LEFT': 10,
    'MOUTH_RIGHT': 11,
    'MOUTH_CENTER': 12,
    'NOSE_BOTTOM_RIGHT': 13,
    'NOSE_BOTTOM_LEFT': 14,
    'NOSE_BOTTOM_CENTER': 15,
    'LEFT_EYE_TOP_BOUNDARY': 16,
    'LEFT_EYE_LEFT_CORNER': 17,
    'LEFT_EYE_BOTTOM_BOUNDARY': 18,
    'LEFT_EYE_RIGHT_CORNER': 19,
    'RIGHT_EYE_TOP_BOUNDARY': 20,
    'RIGHT_EYE_RIGHT_CORNER': 21,
    'RIGHT_EYE_BOTTOM_BOUNDARY': 22,
    'RIGHT_EYE_LEFT_CORNER': 23,
    'LEFT_EYEBROW_UPPER_MIDPOINT': 24,
    'RIGHT_EYEBROW_UPPER_MIDPOINT': 25,
    'LEFT_CHEEK_CENTER': 26,
    'RIGHT_CHEEK_CENTER': 27,
    'CHIN_GNATHION': 29,
    'LEFT_EAR_TRAGION': 30,
    'RIGHT_EAR_TRAGION': 31,
    'FOREHEAD_GLABELLA': 32,
  };

  const all: FacePoint[] = new Array(33).fill({ x: 0, y: 0 });

  for (const landmark of landmarks) {
    const index = landmarkMap[landmark.type];
    if (index !== undefined) {
      all[index] = {
        x: landmark.position.x,
        y: landmark.position.y,
        z: landmark.position.z,
      };
    }
  }

  return {
    leftEye: all[0],
    rightEye: all[1],
    leftEyebrowLeft: all[2],
    leftEyebrowRight: all[3],
    rightEyebrowLeft: all[4],
    rightEyebrowRight: all[5],
    noseTip: all[6],
    upperLip: all[8],
    lowerLip: all[9],
    mouthLeft: all[10],
    mouthRight: all[11],
    mouthCenter: all[12],
    noseBottomRight: all[13],
    noseBottomLeft: all[14],
    noseBottomCenter: all[15],
    leftEyeTopBoundary: all[16],
    leftEyeLeftCorner: all[17],
    leftEyeBottomBoundary: all[18],
    leftEyeRightCorner: all[19],
    rightEyeTopBoundary: all[20],
    rightEyeRightCorner: all[21],
    rightEyeBottomBoundary: all[22],
    rightEyeLeftCorner: all[23],
    leftEyebrowUpperMidpoint: all[24],
    rightEyebrowUpperMidpoint: all[25],
    leftCheek: all[26],
    rightCheek: all[27],
    chin: all[29],
    jawLeft: all[30],
    jawRight: all[31],
    forehead: all[32],
    all,
  };
}
