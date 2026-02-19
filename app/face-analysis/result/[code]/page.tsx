'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import KakaoAd from '@/components/KakaoAd';


// 분석 결과로부터 조언/주의사항/궁합 생성 (얼굴 특징 기반)
function generateDetailedAdvice(
  score: number,
  categories: { r1: number; r2: number; r3: number; r4: number },
  analysis: Record<string, unknown>
): {
  strengths: string[];
  cautions: string[];
  compatible: string[];
  incompatible: string[];
} {
  const getLabel = (key: string): string => {
    const val = analysis[key];
    if (typeof val === 'object' && val !== null && 'label' in val) {
      return (val as { label: string }).label;
    }
    return '';
  };

  const strengths: string[] = [];
  const cautions: string[] = [];
  const compatible: string[] = [];
  const incompatible: string[] = [];

  // 눈꼬리 분석
  const eyeLabel = getLabel('eyeAngle');
  if (eyeLabel.includes('올라감')) {
    strengths.push('강한 의지력과 리더십을 가진 눈매예요');
    cautions.push('눈꼬리가 올라간 사람끼리는 충돌이 있을 수 있어요');
    compatible.push('눈꼬리가 내려간 부드러운 눈매의 사람');
    incompatible.push('눈꼬리가 많이 올라간 날카로운 눈매의 사람');
  } else if (eyeLabel.includes('내려감')) {
    strengths.push('부드럽고 친근한 인상의 눈매예요');
    cautions.push('눈꼬리가 처진 사람끼리는 결단력이 부족할 수 있어요');
    compatible.push('눈꼬리가 올라간 카리스마 있는 눈매의 사람');
    incompatible.push('눈꼬리가 많이 처진 우울해 보이는 눈매의 사람');
  } else {
    strengths.push('균형 잡힌 눈매로 누구와도 잘 어울려요');
    compatible.push('어떤 눈매를 가진 사람과도 잘 맞아요');
  }

  // 눈 크기 분석
  const eyeSizeLabel = getLabel('eyeSize');
  if (eyeSizeLabel.includes('큰')) {
    strengths.push('큰 눈으로 감정 표현이 풍부하고 매력적이에요');
    compatible.push('작고 날카로운 눈을 가진 이성적인 사람');
  } else if (eyeSizeLabel.includes('작')) {
    strengths.push('작은 눈으로 신중하고 집중력이 높아요');
    compatible.push('크고 둥근 눈을 가진 감성적인 사람');
  }

  // 눈두덩이 분석
  const eyebrowLabel = getLabel('eyebrowDistance');
  if (eyebrowLabel.includes('넓')) {
    strengths.push('넓은 눈두덩이로 복이 많은 상이에요');
    compatible.push('마찬가지로 눈두덩이가 넓은 복 많은 사람');
    cautions.push('눈두덩이가 좁은 사람과는 운의 흐름이 다를 수 있어요');
  } else if (eyebrowLabel.includes('좁')) {
    cautions.push('좁은 눈두덩이는 스트레스에 취약하니 관리가 필요해요');
    compatible.push('눈두덩이가 넓어 여유로운 인상의 사람');
    incompatible.push('마찬가지로 눈두덩이가 좁은 예민한 사람');
  }

  // 코 분석
  const noseLabel = getLabel('noseLength');
  if (noseLabel.includes('긴')) {
    strengths.push('긴 코는 자존심과 성취욕이 높은 상이에요');
    compatible.push('코가 작고 오똑한 겸손한 인상의 사람');
    incompatible.push('코가 길고 높은 자존심 강한 사람');
  } else if (noseLabel.includes('짧')) {
    strengths.push('짧은 코는 사교성이 좋고 친근한 인상이에요');
    compatible.push('코가 길고 오뚝한 리더십 있는 사람');
  } else {
    strengths.push('이상적인 코 길이로 균형 잡힌 인상이에요');
  }

  // 입 분석
  const mouthLabel = getLabel('mouthWidth');
  if (mouthLabel.includes('큰')) {
    strengths.push('큰 입은 표현력과 설득력이 뛰어난 상이에요');
    compatible.push('입이 작고 신중한 인상의 경청형 사람');
    incompatible.push('입이 큰 사람끼리는 말싸움이 잦을 수 있어요');
  } else if (mouthLabel.includes('작')) {
    strengths.push('작은 입은 신중하고 깊이 있는 인상이에요');
    compatible.push('입이 크고 표현력 좋은 활발한 사람');
    cautions.push('입이 작은 사람끼리는 소통이 부족할 수 있어요');
  }

  // 턱 분석
  const jawLabel = getLabel('jawWidth');
  if (jawLabel.includes('튼튼')) {
    strengths.push('튼튼한 턱은 끈기와 추진력이 강한 상이에요');
    compatible.push('턱이 갸름하고 섬세한 인상의 사람');
    incompatible.push('하관이 튼튼한 사람끼리는 고집 싸움이 있을 수 있어요');
  } else if (jawLabel.includes('좁') || jawLabel.includes('갸름')) {
    strengths.push('갸름한 턱은 섬세하고 예민한 감각의 상이에요');
    compatible.push('턱이 튼튼하고 듬직한 인상의 사람');
    cautions.push('턱이 좁은 사람끼리는 체력적으로 지칠 수 있어요');
  } else {
    strengths.push('균형 잡힌 턱선으로 안정적인 인상이에요');
  }

  // 인중 분석
  const philtrumLabel = getLabel('philtrumLength');
  if (philtrumLabel.includes('긴')) {
    strengths.push('긴 인중은 장수와 자녀복이 있는 상이에요');
    compatible.push('인중이 짧고 활기찬 인상의 사람');
  } else if (philtrumLabel.includes('짧')) {
    strengths.push('짧은 인중은 활기차고 젊어 보이는 인상이에요');
    compatible.push('인중이 길고 침착한 인상의 사람');
  }

  // 전체적인 얼굴 균형 기반
  if (score >= 80) {
    strengths.push('전체적으로 균형 잡힌 황금비율의 얼굴이에요');
    compatible.push('마찬가지로 균형 잡힌 얼굴의 사람과 좋은 궁합');
  } else if (score >= 60) {
    strengths.push('매력적인 특징이 있는 개성 있는 얼굴이에요');
  }

  // 기본값 추가
  if (strengths.length === 0) {
    strengths.push('자신만의 독특한 얼굴 매력을 가지고 있어요');
  }
  if (cautions.length === 0) {
    cautions.push('표정 관리로 더 좋은 인상을 만들 수 있어요');
  }
  if (compatible.length === 0) {
    compatible.push('자신과 상반된 얼굴 특징을 가진 사람');
  }
  if (incompatible.length === 0) {
    incompatible.push('너무 비슷한 얼굴 특징을 가진 사람과는 주의');
  }

  return { strengths, cautions, compatible, incompatible };
}

interface FaceAnalysisData {
  shareCode: string;
  score: number;
  gender: string;
  categories: {
    r1: number;
    r2: number;
    r3: number;
    r4: number;
  };
  analysis: Record<string, unknown>;
  landmarks?: number[][];
  imageWidth?: number;
  imageHeight?: number;
  imageData?: string | null;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
  isImageExpired: boolean;
  // 디버그 정보
  debug?: {
    noseWidth: number;
    noseLengthRatio: number;
    philtrumRatio: number;
    mouthRatio: number;
    jawRatio: number;
    eyebrowRatio: number;
    eyeAngleDegrees: number;
    facescore: number;
  };
}

// 카테고리 정보 (run.py, draw.py 기반)
const CATEGORY_INFO = {
  r1: {
    name: '권력/운명',
    icon: '👑',
    color: '#FFD700',
    description: '리더십과 사회적 지위, 운명의 흐름'
  },
  r2: {
    name: '정신/사랑',
    icon: '💕',
    color: '#FF69B4',
    description: '감정, 연애운, 정신적 성숙도'
  },
  r3: {
    name: '일/재물',
    icon: '💰',
    color: '#4ECDC4',
    description: '직업운, 재물운, 사교성'
  },
  r4: {
    name: '성실/책임',
    icon: '🤝',
    color: '#9B59B6',
    description: '신뢰도, 책임감, 성실성'
  },
};

// 결정적 한줄평 생성 (동일 분석 = 동일 결과) - draw.py text1 스타일
function generateDeterministicOneLiner(
  score: number,
  categories: { r1: number; r2: number; r3: number; r4: number },
  analysis: Record<string, unknown>
): string {
  // 분석값에서 label 추출
  const getLabel = (key: string): string => {
    const val = analysis[key];
    if (typeof val === 'object' && val !== null && 'label' in val) {
      return (val as { label: string }).label;
    }
    return '';
  };

  // 돋보이는 특징 찾기 (draw.py text1 스타일 - 얼굴 부위 강조)
  const features: string[] = [];

  // 눈꼬리 (가장 눈에 띄는 특징)
  const eyeLabel = getLabel('eyeAngle');
  if (eyeLabel.includes('많이 올라감')) {
    features.push("눈의 기상이 하늘을 찌르는");
  } else if (eyeLabel.includes('올라감')) {
    features.push("날카로운 눈매의");
  } else if (eyeLabel.includes('일자')) {
    features.push("의지가 담긴 눈빛의");
  } else if (eyeLabel.includes('내려감')) {
    features.push("부드러운 눈매의");
  }

  // 눈썹-눈 거리
  const eyebrowLabel = getLabel('eyebrowDistance');
  if (eyebrowLabel.includes('매우 넓음')) {
    features.push("재물이 넘치는 눈두덩이");
  } else if (eyebrowLabel.includes('넓은 편')) {
    features.push("복 많은 눈두덩이");
  }

  // 코
  const noseLabel = getLabel('noseLength');
  if (noseLabel.includes('긴')) {
    features.push("여럿 애간장 녹이는 코");
  } else if (noseLabel.includes('이상적')) {
    features.push("황금비율 코");
  }

  // 입
  const mouthLabel = getLabel('mouthWidth');
  if (mouthLabel.includes('매우 큰')) {
    features.push("모두를 현혹시키는 입");
  } else if (mouthLabel.includes('큰')) {
    features.push("복 부르는 입");
  } else if (mouthLabel.includes('이상적')) {
    features.push("예쁜 입매");
  }

  // 인중
  const philtrumLabel = getLabel('philtrumLength');
  if (philtrumLabel.includes('매우 긴') || philtrumLabel.includes('긴 편')) {
    features.push("강이 흐르는 인중");
  } else if (philtrumLabel.includes('이상적')) {
    features.push("반듯한 인중");
  }

  // 하관
  const jawLabel = getLabel('jawWidth');
  if (jawLabel.includes('매우 튼튼')) {
    features.push("최고의 복덩이 하관");
  } else if (jawLabel.includes('튼튼')) {
    features.push("든든한 하관");
  } else if (jawLabel.includes('이상적')) {
    features.push("균형 잡힌 하관");
  }

  // 가장 돋보이는 2개 특징 선택
  const mainFeature = features.length > 0 ? features[0] : "매력적인 얼굴";
  const subFeature = features.length > 1 ? features[1] : "";

  // 특징 조합 한줄평
  if (subFeature) {
    return `${mainFeature}, ${subFeature}의 소유자`;
  }
  return `${mainFeature}의 소유자`;
}

// 점수에 따른 등급 색상 (얼굴력 : n점 형식으로 표시)
function getScoreGrade(score: number): { color: string; bgGradient: string; cssGradient: string; tier: string } {
  if (score >= 85) return {
    color: '#FFD700',
    bgGradient: 'from-amber-900 via-yellow-800 to-amber-900',
    cssGradient: 'linear-gradient(135deg, #78350f 0%, #854d0e 50%, #78350f 100%)',
    tier: 'legendary'
  };
  if (score >= 70) return {
    color: '#FF6B6B',
    bgGradient: 'from-rose-900 via-pink-800 to-rose-900',
    cssGradient: 'linear-gradient(135deg, #881337 0%, #9d174d 50%, #881337 100%)',
    tier: 'epic'
  };
  if (score >= 55) return {
    color: '#4ECDC4',
    bgGradient: 'from-teal-900 via-cyan-800 to-teal-900',
    cssGradient: 'linear-gradient(135deg, #134e4a 0%, #155e75 50%, #134e4a 100%)',
    tier: 'rare'
  };
  if (score >= 40) return {
    color: '#95E1D3',
    bgGradient: 'from-emerald-900 via-green-800 to-emerald-900',
    cssGradient: 'linear-gradient(135deg, #064e3b 0%, #166534 50%, #064e3b 100%)',
    tier: 'uncommon'
  };
  return {
    color: '#A8A8A8',
    bgGradient: 'from-gray-800 via-slate-700 to-gray-800',
    cssGradient: 'linear-gradient(135deg, #1f2937 0%, #334155 50%, #1f2937 100%)',
    tier: 'common'
  };
}

// 누적 저장용 타입
interface SavedFaceData {
  id: string;
  savedAt: string;
  memo: string;
  debug: Record<string, number | undefined>;
  labels: Record<string, string>;
}

// 디버그 패널 컴포넌트
function DebugPanel({ analysis, memo, setMemo, shareCode }: {
  analysis: Record<string, unknown>;
  memo: string;
  setMemo: (v: string) => void;
  shareCode: string;
}) {
  const [savedCount, setSavedCount] = useState(0);
  const [showSavedList, setShowSavedList] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 저장된 개수 로드
  useEffect(() => {
    const saved = localStorage.getItem('faceAnalysisList');
    if (saved) {
      const list = JSON.parse(saved) as SavedFaceData[];
      setSavedCount(list.length);
    }
  }, []);

  // 현재 분석 저장
  const saveToList = () => {
    const saved = localStorage.getItem('faceAnalysisList');
    const list: SavedFaceData[] = saved ? JSON.parse(saved) : [];

    // 이미 저장된 경우 업데이트
    const existingIndex = list.findIndex(item => item.id === shareCode);

    const debug = analysis?.debug as Record<string, number | undefined>;
    const labels: Record<string, string> = {};

    // 각 분석 항목의 label 추출
    ['eyeAngle', 'eyebrowDistance', 'noseLength', 'philtrumLength', 'mouthWidth', 'jawWidth', 'eyeSize'].forEach(key => {
      const val = analysis[key];
      if (typeof val === 'object' && val !== null && 'label' in val) {
        labels[key] = (val as { label: string }).label;
      }
    });

    const newItem: SavedFaceData = {
      id: shareCode,
      savedAt: new Date().toISOString(),
      memo: memo,
      debug: debug || {},
      labels: labels,
    };

    if (existingIndex >= 0) {
      list[existingIndex] = newItem;
    } else {
      list.push(newItem);
    }

    localStorage.setItem('faceAnalysisList', JSON.stringify(list));
    setSavedCount(list.length);
    alert(`저장 완료! (총 ${list.length}개)`);
  };

  // 전체 복사
  const copyAll = () => {
    const saved = localStorage.getItem('faceAnalysisList');
    if (!saved) {
      alert('저장된 데이터가 없습니다.');
      return;
    }
    navigator.clipboard.writeText(saved);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 전체 삭제
  const clearAll = () => {
    if (confirm('모든 저장된 데이터를 삭제하시겠습니까?')) {
      localStorage.removeItem('faceAnalysisList');
      setSavedCount(0);
    }
  };

  const debug = analysis?.debug as {
    noseWidth?: number;
    noseLengthRatio?: number;
    philtrumRatio?: number;
    mouthRatio?: number;
    jawRatio?: number;
    eyebrowRatio?: number;
    eyeAngleDegrees?: number;
    facescore?: number;
    faceWidth?: number;
    jawWidth?: number;
    foreheadHeight?: number;
    noseTipToBottom?: number;
    noseBottomToLip?: number;
    noseTipRatio?: number;
    eyebrowLength?: number;
    eyebrowAngle?: number;
    eyeWidth?: number;
    eyeHeight?: number;
    mouthWidth?: number;
    mouthHeight?: number;
    eyebrowGap?: number;        // 눈썹 사이 거리
    leftEyeWidth?: number;      // 왼쪽 눈 너비
    leftEyeHeight?: number;     // 왼쪽 눈 높이
    rightEyeWidth?: number;     // 오른쪽 눈 너비
    rightEyeHeight?: number;    // 오른쪽 눈 높이
    upperLipHeight?: number;    // 윗입술 두께
    lowerLipHeight?: number;    // 아랫입술 두께
    lipRatio?: number;          // 입술 비율 (윗/아랫)
    leftJawAngle?: number;      // 왼쪽 턱각 각도
    rightJawAngle?: number;     // 오른쪽 턱각 각도
    avgJawAngle?: number;       // 평균 턱각 각도
    lowerJawLengthLeft?: number;   // 왼쪽 하관 길이
    lowerJawLengthRight?: number;  // 오른쪽 하관 길이
    lowerJawLengthAvg?: number;    // 평균 하관 길이
    jawContourAngleLeft?: number;  // 왼쪽 윤곽 2/3 각도
    jawContourAngleRight?: number; // 오른쪽 윤곽 2/3 각도
    jawContourAngleAvg?: number;   // 평균 윤곽 각도
  } | undefined;

  if (!debug) return null;

  return (
    <div className="bg-red-500/10 backdrop-blur rounded-2xl p-4 mb-4 border border-red-500/30">
      <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2">
        <span>🔧</span> 디버그 정보 (개발용)
      </h3>

      {/* 메모 입력창 - 자동 높이 조절 */}
      <div className="mb-3">
        <textarea
          value={memo}
          onChange={(e) => {
            setMemo(e.target.value);
            // 자동 높이 조절
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          placeholder="특징 메모 입력 (캡쳐용, 줄바꿈 가능)"
          rows={1}
          className="w-full px-3 py-2 bg-black/50 border border-red-500/30 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-400 resize-none overflow-hidden"
          style={{ minHeight: '40px' }}
        />
      </div>

      {/* 비율 정보 - 3열 그리드 */}
      <div className="grid grid-cols-3 gap-1.5 text-xs font-mono mb-3">
        {/* 코 관련 */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">코너비</div>
          <div className="text-white font-bold">{debug.noseWidth?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">코길이비</div>
          <div className="text-yellow-400 font-bold">{debug.noseLengthRatio?.toFixed(2)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">들창코비</div>
          <div className="text-orange-400 font-bold">{debug.noseTipRatio?.toFixed(2)}</div>
        </div>

        {/* 인중/입 */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">인중비</div>
          <div className="text-yellow-400 font-bold">{debug.philtrumRatio?.toFixed(2)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">입너비비</div>
          <div className="text-yellow-400 font-bold">{debug.mouthRatio?.toFixed(2)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">입높이</div>
          <div className="text-white font-bold">{debug.mouthHeight?.toFixed(1)}</div>
        </div>

        {/* 턱/얼굴 */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">턱비</div>
          <div className="text-yellow-400 font-bold">{debug.jawRatio?.toFixed(2)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">턱너비</div>
          <div className="text-white font-bold">{debug.jawWidth?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">얼굴너비</div>
          <div className="text-white font-bold">{debug.faceWidth?.toFixed(1)}</div>
        </div>

        {/* 눈 */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">왼눈너비</div>
          <div className="text-white font-bold">{debug.leftEyeWidth?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">왼눈높이</div>
          <div className="text-white font-bold">{debug.leftEyeHeight?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">우눈너비</div>
          <div className="text-white font-bold">{debug.rightEyeWidth?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">우눈높이</div>
          <div className="text-white font-bold">{debug.rightEyeHeight?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">눈각도</div>
          <div className="text-cyan-400 font-bold">{debug.eyeAngleDegrees?.toFixed(1)}°</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">눈썹-눈비</div>
          <div className="text-yellow-400 font-bold">{debug.eyebrowRatio?.toFixed(2)}</div>
        </div>

        {/* 눈썹 */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">눈썹사이</div>
          <div className="text-pink-400 font-bold">{debug.eyebrowGap?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">눈썹길이</div>
          <div className="text-white font-bold">{debug.eyebrowLength?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">눈썹각도</div>
          <div className="text-cyan-400 font-bold">{debug.eyebrowAngle?.toFixed(1)}°</div>
        </div>

        {/* 입술 */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">윗입술</div>
          <div className="text-white font-bold">{debug.upperLipHeight?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">아랫입술</div>
          <div className="text-white font-bold">{debug.lowerLipHeight?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">입술비율</div>
          <div className="text-orange-400 font-bold">{debug.lipRatio?.toFixed(2)}</div>
        </div>

        {/* 하관 길이 */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">좌하관길이</div>
          <div className="text-white font-bold">{debug.lowerJawLengthLeft?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">우하관길이</div>
          <div className="text-white font-bold">{debug.lowerJawLengthRight?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">평균하관</div>
          <div className="text-white font-bold">{debug.lowerJawLengthAvg?.toFixed(1)}</div>
        </div>

        {/* 턱각 (볼→턱각→턱끝) */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">왼턱각</div>
          <div className="text-yellow-400 font-bold">{debug.leftJawAngle?.toFixed(1)}°</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">우턱각</div>
          <div className="text-yellow-400 font-bold">{debug.rightJawAngle?.toFixed(1)}°</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">평균턱각</div>
          <div className="text-orange-400 font-bold">{debug.avgJawAngle?.toFixed(1)}°</div>
        </div>

        {/* 윤곽 2/3 각도 (실제 턱각 - 작을수록 각진턱) */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">좌2/3각</div>
          <div className="text-pink-400 font-bold">{debug.jawContourAngleLeft?.toFixed(1)}°</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">우2/3각</div>
          <div className="text-pink-400 font-bold">{debug.jawContourAngleRight?.toFixed(1)}°</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">평균2/3각</div>
          <div className="text-red-400 font-bold">{debug.jawContourAngleAvg?.toFixed(1)}°</div>
        </div>

        {/* 기타 */}
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">코끝~코밑</div>
          <div className="text-white font-bold">{debug.noseTipToBottom?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">이마높이</div>
          <div className="text-white font-bold">{debug.foreheadHeight?.toFixed(1)}</div>
        </div>
        <div className="bg-black/30 p-1.5 rounded">
          <div className="text-gray-500 text-[10px]">facescore</div>
          <div className="text-green-400 font-bold">{debug.facescore}</div>
        </div>
      </div>

      {/* 임계값 참고 */}
      <div className="text-[10px] text-gray-500 space-y-0.5 mb-3">
        <p>코길이: &gt;1.55(긴) | 인중: &gt;0.7(긴) | 입너비: &gt;1.75(큼)</p>
        <p>들창코비: 값이 클수록 들창코 (코끝~코밑 / 코밑~윗입술)</p>
      </div>

      {/* 누적 저장 버튼들 */}
      <div className="border-t border-red-500/30 pt-3 mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-red-400 text-sm font-medium">📦 누적 저장 ({savedCount}개)</span>
          <button
            onClick={() => setShowSavedList(!showSavedList)}
            className="text-xs text-gray-400 hover:text-white"
          >
            {showSavedList ? '닫기' : '목록 보기'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={saveToList}
            className="py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30"
          >
            ➕ 저장
          </button>
          <button
            onClick={copyAll}
            className="py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30"
          >
            {copySuccess ? '✅ 복사됨!' : '📋 전체복사'}
          </button>
          <button
            onClick={clearAll}
            className="py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30"
          >
            🗑️ 초기화
          </button>
        </div>

        {/* 저장된 목록 표시 */}
        {showSavedList && savedCount > 0 && (
          <div className="mt-3 max-h-40 overflow-y-auto">
            {(() => {
              const saved = localStorage.getItem('faceAnalysisList');
              if (!saved) return null;
              const list = JSON.parse(saved) as SavedFaceData[];
              return list.map((item, i) => (
                <div key={item.id} className="bg-black/30 rounded p-2 mb-1 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>#{i + 1} {item.id.slice(0, 8)}</span>
                    <span>{new Date(item.savedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {item.memo && <div className="text-yellow-400 mt-1">{item.memo}</div>}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// MediaPipe 랜드마크 연결선 정의
const FACE_CONNECTIONS = {
  // 상단 윤곽 (이마~관자놀이)
  upperSilhouette: [10, 338, 297, 332, 284, 251, 389, 356, 454],
  upperSilhouetteLeft: [234, 127, 162, 21, 54, 103, 67, 109, 10],
  // 턱각 강조 윤곽선 (직선으로 연결하여 각진 턱 표현)
  jawLine: [234, 172, 152, 397, 454],
  // 실제 턱 외곽선 (MediaPipe 표준 face oval 기반)
  // 왼쪽 관자놀이(234)에서 턱끝(152)까지
  jawContourLeft: [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152],
  // 턱끝(152)에서 오른쪽 관자놀이(454)까지
  jawContourRight: [152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454],
  // 하관 내측 윤곽 (부드러운 턱용)
  lowerJawInner: [172, 150, 149, 152, 148, 176, 397],
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362],
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  nose: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2],
  lipsOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61],
};

// 기존 주요 포인트 (참조용, 실제 그리기에서는 DEBUG_POINTS 사용)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const KEY_POINTS = [33, 133, 362, 263, 159, 386, 70, 300, 107, 336, 1, 4, 5, 195, 61, 291, 0, 17, 152, 234, 454, 10];

// 디버그용 추가 포인트 (코끝, 콧볼, 입, 턱 등)
const DEBUG_POINTS = {
  nose: {
    tip: 1,           // 코끝
    bridge: 6,        // 코 브릿지 (미간)
    bottomCenter: 2,  // 코밑 중앙
    leftAlaOuter: 129,  // 왼쪽 콧볼 바깥 (원본)
    rightAlaOuter: 358, // 오른쪽 콧볼 바깥 (원본)
    leftAla: 48,      // 왼쪽 콧볼 (보정 - 안쪽)
    rightAla: 278,    // 오른쪽 콧볼 (보정 - 안쪽)
  },
  eyes: {
    leftCenter: 468,  // 왼쪽 눈 중심 (iris)
    rightCenter: 473, // 오른쪽 눈 중심 (iris)
    leftOuter: 33,    // 왼쪽 눈 외곽
    leftInner: 133,   // 왼쪽 눈 안쪽
    rightOuter: 263,  // 오른쪽 눈 외곽
    rightInner: 362,  // 오른쪽 눈 안쪽
    leftTop: 159,     // 왼쪽 눈 위
    leftBottom: 145,  // 왼쪽 눈 아래
    rightTop: 386,    // 오른쪽 눈 위
    rightBottom: 374, // 오른쪽 눈 아래
  },
  mouth: {
    left: 61,         // 입 왼쪽
    right: 291,       // 입 오른쪽
    top: 0,           // 윗입술 중앙 (바깥)
    bottom: 17,       // 아랫입술 중앙 (바깥)
    center: 13,       // 입 중앙 (윗입술 안쪽)
    innerLower: 14,   // 아랫입술 안쪽
  },
  jaw: {
    chin: 152,        // 턱끝 (gnathion)
    leftAngle: 172,   // 왼쪽 턱각 (jaw angle) - 실제 하관
    rightAngle: 397,  // 오른쪽 턱각 (jaw angle) - 실제 하관
    leftTemple: 234,  // 왼쪽 관자놀이 (temple)
    rightTemple: 454, // 오른쪽 관자놀이 (temple)
  },
  eyebrow: {
    leftOuter: 70,    // 왼쪽 눈썹 외곽
    leftInner: 107,   // 왼쪽 눈썹 안쪽
    rightOuter: 300,  // 오른쪽 눈썹 외곽
    rightInner: 336,  // 오른쪽 눈썹 안쪽
  },
  forehead: {
    hairlineCenter: 10,   // 헤어라인 중앙
    hairlineLeft: 109,    // 왼쪽 헤어라인
    hairlineRight: 338,   // 오른쪽 헤어라인
    center: 151,          // 이마 중앙
  },
  cheek: {
    leftCenter: 117,      // 왼쪽 볼 중앙
    rightCenter: 346,     // 오른쪽 볼 중앙
  },
  // 얼굴 윤곽선 주요 포인트 (위에서 아래로)
  contour: {
    // 왼쪽 윤곽
    left1: 127,   // 왼쪽 이마
    left2: 162,   // 왼쪽 관자놀이 위
    left3: 21,    // 왼쪽 눈 옆
    left4: 54,    // 왼쪽 광대
    left5: 103,   // 왼쪽 볼
    left6: 67,    // 왼쪽 턱선
    left7: 58,    // 왼쪽 턱각 근처
    // 오른쪽 윤곽
    right1: 356,  // 오른쪽 이마
    right2: 389,  // 오른쪽 관자놀이 위
    right3: 251,  // 오른쪽 눈 옆
    right4: 284,  // 오른쪽 광대
    right5: 332,  // 오른쪽 볼
    right6: 297,  // 오른쪽 턱선
    right7: 288,  // 오른쪽 턱각 근처
  },
};

// 레이더 차트 컴포넌트
function RadarChart({ categories }: { categories: { r1: number; r2: number; r3: number; r4: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 300;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 100;

    canvas.width = size;
    canvas.height = size;

    // 배경 초기화
    ctx.clearRect(0, 0, size, size);

    // 4개 축 (정사각형 레이더)
    const axes = [
      { angle: -Math.PI / 2, label: CATEGORY_INFO.r1.name, value: categories.r1, color: CATEGORY_INFO.r1.color },
      { angle: 0, label: CATEGORY_INFO.r2.name, value: categories.r2, color: CATEGORY_INFO.r2.color },
      { angle: Math.PI / 2, label: CATEGORY_INFO.r3.name, value: categories.r3, color: CATEGORY_INFO.r3.color },
      { angle: Math.PI, label: CATEGORY_INFO.r4.name, value: categories.r4, color: CATEGORY_INFO.r4.color },
    ];

    // 배경 그리드 (5단계)
    for (let i = 1; i <= 5; i++) {
      const r = (radius * i) / 5;
      ctx.beginPath();
      axes.forEach((axis, idx) => {
        const x = centerX + Math.cos(axis.angle) * r;
        const y = centerY + Math.sin(axis.angle) * r;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + i * 0.02})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 축선
    axes.forEach(axis => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(axis.angle) * radius, centerY + Math.sin(axis.angle) * radius);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 데이터 다각형
    ctx.beginPath();
    axes.forEach((axis, idx) => {
      const r = (radius * axis.value) / 100;
      const x = centerX + Math.cos(axis.angle) * r;
      const y = centerY + Math.sin(axis.angle) * r;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // 그라데이션 채우기
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 107, 107, 0.8)');
    gradient.addColorStop(1, 'rgba(78, 205, 196, 0.3)');
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 꼭지점 점
    axes.forEach(axis => {
      const r = (radius * axis.value) / 100;
      const x = centerX + Math.cos(axis.angle) * r;
      const y = centerY + Math.sin(axis.angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = axis.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 라벨
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';

    axes.forEach(axis => {
      const labelR = radius + 30;
      const x = centerX + Math.cos(axis.angle) * labelR;
      const y = centerY + Math.sin(axis.angle) * labelR;
      ctx.fillText(axis.label, x, y + 4);
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(`${axis.value}점`, x, y + 18);
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#fff';
    });

  }, [categories]);

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto"
      style={{ width: '250px', height: '250px' }}
    />
  );
}

export default function FaceAnalysisResultPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);

  // 디버그 모드는 URL 파라미터로만 활성화 (?debug=true)
  const isDebugMode = searchParams.get('debug') === 'true';

  const [data, setData] = useState<FaceAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oneLiner, setOneLiner] = useState<string>('');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [memo, setMemo] = useState('');
  const [showRevealAnimation, setShowRevealAnimation] = useState(false);
  const [revealStep, setRevealStep] = useState(0);
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/face/result/${resolvedParams.code}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || '결과를 찾을 수 없습니다.');
          return;
        }

        setData(json.data);

        // 결정적 한줄평 생성
        const liner = generateDeterministicOneLiner(
          json.data.score,
          json.data.categories,
          json.data.analysis
        );
        setOneLiner(liner);

        // 점수 공개 애니메이션 시작
        setShowRevealAnimation(true);
        setRevealStep(0);

        // 단계별 애니메이션
        setTimeout(() => setRevealStep(1), 300); // 얼굴 표시
        setTimeout(() => setRevealStep(2), 1000); // 점수 표시
        setTimeout(() => setRevealStep(3), 3000); // 완료 (3초)
        setTimeout(() => setShowRevealAnimation(false), 3500); // 애니메이션 종료

      } catch (err) {
        console.error('Fetch error:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.code]);

  // 얼굴 랜드마크 그리기 (이미지가 이미 크롭됨, 랜드마크도 변환됨)
  const drawFaceMesh = useCallback(() => {
    if (!canvasRef.current || !data?.imageData || !data?.landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    const tryLoad = (useCors: boolean) => {
      if (useCors) img.crossOrigin = 'anonymous';
      else img.removeAttribute('crossOrigin');
      img.onload = () => {
        const canvasSize = 500; // 크기 증가
        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const landmarks = data.landmarks!;

        // 배경 (검정)
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

      // 이미지 그리기 (원형 마스크 없이)
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvasSize, canvasSize);

      // 랜드마크 좌표 변환 (0-1 정규화 좌표를 캔버스 좌표로)
      const transformPoint = (idx: number) => {
        if (idx >= landmarks.length) return null;
        const [lx, ly] = landmarks[idx];
        return { x: lx * canvasSize, y: ly * canvasSize };
      };

      // 연결선 그리기
      const drawConnections = (indices: number[], color: string = 'rgba(0, 255, 255, 0.6)', lineWidth: number = 1.5) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let i = 0; i < indices.length; i++) {
          if (indices[i] >= landmarks.length) continue;
          const point = transformPoint(indices[i]);
          if (!point) continue;
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      };

      // === 세련된 얼굴 분석 시각화 ===
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { jawLine, jawContourLeft, jawContourRight, lowerJawInner, upperSilhouette, upperSilhouetteLeft, leftEye, rightEye, leftEyebrow, rightEyebrow, nose, lipsOuter } = FACE_CONNECTIONS;

      // 점 그리기 함수 (투명한 점들로 윤곽 표현)
      const drawDots = (indices: number[], color: string, size: number = 2, alpha: number = 0.5) => {
        ctx.globalAlpha = alpha;
        indices.forEach(idx => {
          if (idx >= landmarks.length) return;
          const point = transformPoint(idx);
          if (!point) return;
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      };

      // 눈, 눈썹, 코, 입 - 투명한 점으로 표현 (눈/입은 점 절반으로 줄임)
      const leftEyeReduced = leftEye.filter((_, i) => i % 2 === 0);
      const rightEyeReduced = rightEye.filter((_, i) => i % 2 === 0);
      const lipsReduced = lipsOuter.filter((_, i) => i % 2 === 0);

      drawDots(leftEyeReduced, 'rgba(150, 220, 255, 1)', 2, 0.7);
      drawDots(rightEyeReduced, 'rgba(150, 220, 255, 1)', 2, 0.7);
      drawDots(leftEyebrow, 'rgba(180, 200, 255, 1)', 2, 0.65);
      drawDots(rightEyebrow, 'rgba(180, 200, 255, 1)', 2, 0.65);
      drawDots(nose, 'rgba(255, 200, 180, 1)', 2, 0.7);
      drawDots(lipsReduced, 'rgba(255, 180, 200, 1)', 2, 0.7);

      // 상단 윤곽선 (이마~관자놀이) - 은은한 점
      drawDots(upperSilhouette, 'rgba(180, 220, 255, 1)', 1.8, 0.55);
      drawDots(upperSilhouetteLeft, 'rgba(180, 220, 255, 1)', 1.8, 0.55);

      // 턱 윤곽선 - 하나로 연결 (jawContourLeft + jawContourRight를 연속으로)
      const fullJawContour = [...jawContourLeft, ...jawContourRight.slice(1)]; // 152 중복 제거
      ctx.shadowColor = 'rgba(255, 200, 100, 0.6)';
      ctx.shadowBlur = 10;
      drawConnections(fullJawContour, 'rgba(255, 215, 130, 0.85)', 2.5);
      ctx.shadowBlur = 0;

      // 주요 포인트 그리기 함수 (라벨 없이 깔끔하게)
      const drawKeyPoint = (idx: number, color: string, size: number = 4, glowColor?: string) => {
        const point = transformPoint(idx);
        if (!point) return;

        // 글로우 효과
        if (glowColor) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 12;
        }

        // 외곽 링
        ctx.beginPath();
        ctx.arc(point.x, point.y, size + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 내부 점
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.shadowBlur = 0;
      };

      // 핵심 분석 포인트만 표시 (눈동자 제외)
      // 눈꼬리/눈머리 (사파이어)
      drawKeyPoint(DEBUG_POINTS.eyes.leftOuter, 'rgba(100, 180, 255, 0.85)', 3.5);
      drawKeyPoint(DEBUG_POINTS.eyes.leftInner, 'rgba(100, 180, 255, 0.85)', 3.5);
      drawKeyPoint(DEBUG_POINTS.eyes.rightOuter, 'rgba(100, 180, 255, 0.85)', 3.5);
      drawKeyPoint(DEBUG_POINTS.eyes.rightInner, 'rgba(100, 180, 255, 0.85)', 3.5);

      // 코 (로즈골드)
      drawKeyPoint(DEBUG_POINTS.nose.tip, 'rgba(255, 180, 150, 0.9)', 4.5, 'rgba(255, 180, 150, 0.5)');
      drawKeyPoint(DEBUG_POINTS.nose.bridge, 'rgba(255, 200, 180, 0.8)', 3.5);

      // 입 (소프트 핑크)
      drawKeyPoint(DEBUG_POINTS.mouth.left, 'rgba(255, 150, 180, 0.85)', 4);
      drawKeyPoint(DEBUG_POINTS.mouth.right, 'rgba(255, 150, 180, 0.85)', 4);
      drawKeyPoint(DEBUG_POINTS.mouth.top, 'rgba(255, 170, 190, 0.8)', 3);

      // 턱 라인 (골드)
      drawKeyPoint(DEBUG_POINTS.jaw.chin, 'rgba(255, 220, 100, 0.9)', 5, 'rgba(255, 220, 100, 0.5)');
      drawKeyPoint(DEBUG_POINTS.jaw.leftAngle, 'rgba(255, 200, 80, 0.85)', 4);
      drawKeyPoint(DEBUG_POINTS.jaw.rightAngle, 'rgba(255, 200, 80, 0.85)', 4);

      // 눈썹 (라벤더)
      drawKeyPoint(DEBUG_POINTS.eyebrow.leftOuter, 'rgba(180, 150, 255, 0.8)', 3);
      drawKeyPoint(DEBUG_POINTS.eyebrow.rightOuter, 'rgba(180, 150, 255, 0.8)', 3);

      // 미세한 윤곽 포인트 (은은하게)
      ctx.globalAlpha = 0.4;
      Object.values(DEBUG_POINTS.contour).forEach(idx => {
        const point = transformPoint(idx);
        if (!point) return;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 220, 255, 0.7)';
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
      img.onerror = () => {
        // CORS 실패 시 crossOrigin 없이 재시도
        if (useCors) tryLoad(false);
      };
      img.src = data.imageData!;
    };
    tryLoad(true);
  }, [data]);

  useEffect(() => {
    // 애니메이션이 끝난 후 캔버스가 마운트되면 다시 그리기
    if (!showRevealAnimation && data?.imageData && data?.landmarks) {
      drawFaceMesh();
    }
  }, [data, drawFaceMesh, showRevealAnimation]);

  // 공유 카드 생성
  const generateShareCard = useCallback(async () => {
    if (!shareCanvasRef.current || !data) return;

    setIsGeneratingCard(true);

    try {
    const canvas = shareCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setIsGeneratingCard(false); return; }

    canvas.width = 1080;
    canvas.height = 1350; // 세로 확장

    const { color: tierColor, tier } = getScoreGrade(data.score);

    // 티어별 프리미엄 배경 디자인
    const getTierBackground = () => {
      switch (tier) {
        case 'legendary':
          return { primary: '#2d1810', secondary: '#4a2c17', accent: '#FFD700', glow: 'rgba(255, 215, 0, 0.3)' };
        case 'epic':
          return { primary: '#2a1525', secondary: '#4a1f3d', accent: '#FF6B6B', glow: 'rgba(255, 107, 107, 0.3)' };
        case 'rare':
          return { primary: '#0a2025', secondary: '#153540', accent: '#4ECDC4', glow: 'rgba(78, 205, 196, 0.3)' };
        case 'uncommon':
          return { primary: '#0a2515', secondary: '#154028', accent: '#95E1D3', glow: 'rgba(149, 225, 211, 0.3)' };
        default:
          return { primary: '#1a1a2e', secondary: '#2d2d44', accent: '#A8A8A8', glow: 'rgba(168, 168, 168, 0.2)' };
      }
    };

    const tierBg = getTierBackground();

    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 0, 1350);
    gradient.addColorStop(0, tierBg.primary);
    gradient.addColorStop(0.5, tierBg.secondary);
    gradient.addColorStop(1, tierBg.primary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // 장식 원형 글로우 (티어 색상)
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(100, 100, 300, 0, Math.PI * 2);
    ctx.fillStyle = tierBg.accent;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(980, 1250, 350, 0, Math.PI * 2);
    ctx.fillStyle = tierBg.accent;
    ctx.fill();
    ctx.globalAlpha = 1;

    // 상단 장식 라인
    ctx.strokeStyle = tierBg.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(200, 60);
    ctx.lineTo(880, 60);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 상단: 로고/타이틀
    ctx.fillStyle = tierBg.accent;
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('경험 기반 관상 분석', 540, 110);

    // 하단 장식 라인
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(200, 140);
    ctx.lineTo(880, 140);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 얼굴 이미지 (1.2배 추가 확대)
    const faceY = 480;
    const faceSize = 624; // 520 * 1.2

    if (data.imageData && data.landmarks) {
      // 이미지 로드 (같은 origin 프록시 API를 통해 CORS 우회)
      const loadImg = async (): Promise<HTMLImageElement> => {
        // CDN URL인 경우 프록시 API를 통해 같은 origin에서 로드
        const imgSrc = data.imageData!.startsWith('http')
          ? `/api/face/image-proxy?code=${resolvedParams.code}`
          : data.imageData!;

        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('이미지 로드 실패'));
          img.src = imgSrc;
        });
      };
      const img = await loadImg();

      if (img.complete && img.naturalWidth > 0) {
        const landmarks = data.landmarks;

        ctx.save();
        ctx.beginPath();
        ctx.arc(540, faceY, faceSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // 이미 크롭된 이미지를 그대로 표시
        ctx.drawImage(img, 0, 0, img.width, img.height, 540 - faceSize/2, faceY - faceSize/2, faceSize, faceSize);

        // 랜드마크 좌표 변환 (0-1 정규화 좌표를 공유카드 좌표로)
        const transformPoint = (idx: number) => {
          const [lx, ly] = landmarks[idx];
          const x = lx * faceSize + (540 - faceSize/2);
          const y = ly * faceSize + (faceY - faceSize/2);
          return { x, y };
        };

        // 세련된 윤곽선 (티어 색상 적용)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { jawLine, jawContourLeft, jawContourRight, leftEye, rightEye, leftEyebrow, rightEyebrow, nose: noseConn, lipsOuter, upperSilhouette, upperSilhouetteLeft, lowerJawInner } = FACE_CONNECTIONS;

        // 점 그리기 함수 (메인과 동일 스타일)
        const drawCardDots = (indices: number[], color: string, size: number = 2, alpha: number = 0.7) => {
          ctx.globalAlpha = alpha;
          indices.forEach(idx => {
            if (idx >= landmarks.length) return;
            const point = transformPoint(idx);
            ctx.beginPath();
            ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          });
          ctx.globalAlpha = 1;
        };

        // 눈, 눈썹, 코, 입 - 점으로 표현 (절반만)
        const leftEyeReduced = leftEye.filter((_: number, i: number) => i % 2 === 0);
        const rightEyeReduced = rightEye.filter((_: number, i: number) => i % 2 === 0);
        const lipsReduced = lipsOuter.filter((_: number, i: number) => i % 2 === 0);

        drawCardDots(leftEyeReduced, `${tierBg.accent}`, 2.5, 0.7);
        drawCardDots(rightEyeReduced, `${tierBg.accent}`, 2.5, 0.7);
        drawCardDots(leftEyebrow, `${tierBg.accent}`, 2.5, 0.65);
        drawCardDots(rightEyebrow, `${tierBg.accent}`, 2.5, 0.65);
        drawCardDots(noseConn, `${tierBg.accent}`, 2.5, 0.7);
        drawCardDots(lipsReduced, `${tierBg.accent}`, 2.5, 0.7);

        // 턱 윤곽선 - 하나로 연결 (메인과 동일)
        const fullJawContour = [...jawContourLeft, ...jawContourRight.slice(1)];
        ctx.shadowColor = tierBg.glow;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = `${tierBg.accent}cc`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        fullJawContour.forEach((idx, i) => {
          if (idx >= landmarks.length) return;
          const point = transformPoint(idx);
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 핵심 포인트 (눈꼬리, 코, 입, 턱)
        const drawCardKeyPoint = (idx: number, size: number = 4) => {
          if (idx >= landmarks.length) return;
          const point = transformPoint(idx);
          ctx.beginPath();
          ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
          ctx.fillStyle = tierBg.accent;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        };

        drawCardKeyPoint(DEBUG_POINTS.eyes.leftOuter, 4);
        drawCardKeyPoint(DEBUG_POINTS.eyes.rightOuter, 4);
        drawCardKeyPoint(DEBUG_POINTS.nose.tip, 5);
        drawCardKeyPoint(DEBUG_POINTS.jaw.chin, 5);
        drawCardKeyPoint(DEBUG_POINTS.mouth.left, 4);
        drawCardKeyPoint(DEBUG_POINTS.mouth.right, 4);

        ctx.restore();
      }
    } else {
      // 기본 이미지 (만료된 경우)
      ctx.beginPath();
      ctx.arc(540, faceY, faceSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = `${tierBg.accent}66`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.font = '120px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = `${tierBg.accent}66`;
      ctx.fillText('👤', 540, faceY + 40);
    }

    // 원형 테두리 (티어 색상 글로우)
    ctx.shadowColor = tierBg.glow;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(540, faceY, faceSize / 2 + 4, 0, Math.PI * 2);
    ctx.strokeStyle = tierBg.accent;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 외곽 장식 링
    ctx.beginPath();
    ctx.arc(540, faceY, faceSize / 2 + 15, 0, Math.PI * 2);
    ctx.strokeStyle = `${tierBg.accent}44`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 점수 영역
    const scoreY = faceY + faceSize/2 + 80;

    // 얼굴력 텍스트
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('얼굴력', 540, scoreY);

    // 큰 점수 + 점 + 티어를 한 줄로
    const tierLabels: { [key: string]: string } = {
      'legendary': '✨ LEGENDARY',
      'epic': '🔥 EPIC',
      'rare': '💎 RARE',
      'uncommon': '🌿 UNCOMMON',
      'common': '⚪ COMMON'
    };
    const scoreText = data.score.toString();
    ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, sans-serif';
    const scoreWidth = ctx.measureText(scoreText).width;
    ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif';
    const jeomWidth = ctx.measureText('점').width;
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    const tierText = tierLabels[tier] || '';
    const tierWidth = ctx.measureText(tierText).width;
    const totalWidth = scoreWidth + 8 + jeomWidth + 20 + tierWidth;
    const startX = 540 - totalWidth / 2;

    // 점수
    ctx.shadowColor = tierBg.glow;
    ctx.shadowBlur = 15;
    ctx.fillStyle = tierColor;
    ctx.textAlign = 'left';
    ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(scoreText, startX, scoreY + 110);
    ctx.shadowBlur = 0;

    // 점
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('점', startX + scoreWidth + 8, scoreY + 110);

    // 티어 배지
    ctx.fillStyle = tierColor;
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(tierText, startX + scoreWidth + 8 + jeomWidth + 20, scoreY + 110);
    ctx.textAlign = 'center';

    // 구분선
    ctx.strokeStyle = `${tierBg.accent}66`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(250, scoreY + 140);
    ctx.lineTo(830, scoreY + 140);
    ctx.stroke();

    // 한줄평 (더 큰 폰트)
    ctx.fillStyle = '#ffffff';
    ctx.font = '42px -apple-system, BlinkMacSystemFont, sans-serif';

    const maxWidth = 900;
    const lineHeight = 55;
    const words = oneLiner.split(' ');
    let line = '';
    const lines: string[] = [];

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        lines.push(line.trim());
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    const startY = scoreY + 195;
    lines.forEach((l, i) => {
      ctx.fillText(l, 540, startY + i * lineHeight);
    });

    // 황금궁합
    const goldenMatch = (data.analysis as Record<string, unknown>)?.goldenMatch as string | undefined;
    if (goldenMatch) {
      const goldenY = startY + lines.length * lineHeight + 30;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('💛 황금궁합', 540, goldenY);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '34px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(goldenMatch, 540, goldenY + 48);
    }

    // 하단 장식
    ctx.strokeStyle = tierBg.accent;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(300, 1280);
    ctx.lineTo(780, 1280);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 워터마크
    ctx.fillStyle = tierBg.accent;
    ctx.globalAlpha = 0.7;
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('mytype.co.kr', 540, 1320);
    ctx.globalAlpha = 1;

    const dataUrl = canvas.toDataURL('image/png');
    setShareCardUrl(dataUrl);
    setIsGeneratingCard(false);

    // 5초 후 카드 표시 (광고 노출 시간 확보)
    setTimeout(() => {
      setCardReady(true);
    }, 5000);
    } catch (err) {
      console.error('공유 카드 생성 실패:', err);
      setIsGeneratingCard(false);
    }
  }, [data, oneLiner, resolvedParams.code]);

  // 카드 다운로드 (모바일: Web Share API만, PC: 파일 다운로드)
  const downloadCard = async () => {
    if (!shareCardUrl) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      try {
        const response = await fetch(shareCardUrl);
        const blob = await response.blob();
        const file = new File([blob], `관상분석_${data?.score}점.png`, { type: 'image/png' });
        await navigator.share({ files: [file] });
      } catch {
        // 사용자가 취소한 경우 무시
      }
      return;
    }

    const link = document.createElement('a');
    link.download = `관상분석_${data?.score}점.png`;
    link.href = shareCardUrl;
    link.click();
  };

  // 카드 공유
  const shareCard = async () => {
    if (!shareCardUrl) return;

    try {
      const response = await fetch(shareCardUrl);
      const blob = await response.blob();
      const file = new File([blob], '관상분석.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: '관상 분석 결과',
          text: oneLiner,
          files: [file],
        });
      } else {
        downloadCard();
      }
    } catch (err) {
      console.error('Share failed:', err);
      downloadCard();
    }
  };

  // URL 복사
  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 만료일까지 남은 시간
  const getExpiryText = () => {
    if (!data?.expiresAt) return '';
    const expires = new Date(data.expiresAt);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();

    if (diff <= 0) return '이미지가 만료되었습니다';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `이미지 ${days}일 ${hours}시간 후 만료`;
    return `이미지 ${hours}시간 후 만료`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-pulse">🔮</div>
          <p className="text-lg">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-lg mb-6">{error || '결과를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/face-analysis')}
            className="px-6 py-3 bg-white/20 rounded-full hover:bg-white/30 transition-all"
          >
            새로 분석하기
          </button>
        </div>
      </div>
    );
  }

  const scoreGrade = getScoreGrade(data.score);

  // 점수 공개 애니메이션 (높은 점수일수록 화려함)
  if (showRevealAnimation && revealStep < 3) {
    const isHighScore = data.score >= 80;

    // 점수별 파티클 설정
    const getParticleConfig = (score: number) => {
      if (score >= 85) return { count: 50, sizes: [3, 4, 5, 6], glowIntensity: 1, hasSparkle: true, hasPulse: true };
      if (score >= 70) return { count: 35, sizes: [2, 3, 4, 5], glowIntensity: 0.8, hasSparkle: true, hasPulse: false };
      if (score >= 55) return { count: 25, sizes: [2, 3, 4], glowIntensity: 0.6, hasSparkle: false, hasPulse: false };
      if (score >= 40) return { count: 18, sizes: [2, 3], glowIntensity: 0.4, hasSparkle: false, hasPulse: false };
      return { count: 12, sizes: [2], glowIntensity: 0.2, hasSparkle: false, hasPulse: false };
    };

    const particleConfig = getParticleConfig(data.score);
    const particleColors = data.score >= 85
      ? ['#FFD700', '#FFF8DC', '#FFEC8B', '#FFE4B5', '#FFFFFF']
      : data.score >= 70
        ? ['#FF6B6B', '#FF8E8E', '#FFB6C1', '#FF69B4', '#FFD700']
        : data.score >= 55
          ? ['#4ECDC4', '#7FDBDA', '#A8E6CF', '#88D8B0', '#B8E0D2']
          : data.score >= 40
            ? ['#95E1D3', '#A8E6CF', '#B8E0D2', '#C8F7C5']
            : ['#A8A8A8', '#C0C0C0', '#D3D3D3', '#E8E8E8'];

    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden min-h-screen"
        style={{
          background: scoreGrade.cssGradient,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* 배경 파티클 - 모든 점수대에서 표시, 점수별로 화려함 차등 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(particleConfig.count)].map((_, i) => {
            const particleSize = particleConfig.sizes[i % particleConfig.sizes.length];
            return (
              <div
                key={i}
                className={`absolute rounded-full ${particleConfig.hasPulse ? 'animate-particle-pulse' : 'animate-float'}`}
                style={{
                  width: `${particleSize * 2}px`,
                  height: `${particleSize * 2}px`,
                  backgroundColor: particleColors[i % particleColors.length],
                  left: `${(i * 17 + 5) % 100}%`,
                  top: `${(i * 23 + 10) % 100}%`,
                  animationDelay: `${(i * 0.15) % 3}s`,
                  animationDuration: `${2.5 + (i % 3)}s`,
                  boxShadow: `0 0 ${6 * particleConfig.glowIntensity}px ${particleColors[i % particleColors.length]}, 0 0 ${12 * particleConfig.glowIntensity}px ${particleColors[i % particleColors.length]}50`,
                  opacity: 0.7 + (particleConfig.glowIntensity * 0.3),
                }}
              />
            );
          })}

          {/* 반짝이는 별 효과 (70점 이상) */}
          {particleConfig.hasSparkle && [...Array(data.score >= 85 ? 15 : 8)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute animate-sparkle"
              style={{
                left: `${(i * 31 + 8) % 100}%`,
                top: `${(i * 29 + 5) % 100}%`,
                animationDelay: `${(i * 0.3) % 2}s`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={data.score >= 85 ? '#FFD700' : '#FF69B4'}>
                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
              </svg>
            </div>
          ))}

          {/* 빛줄기 효과 (85점 이상) */}
          {data.score >= 85 && (
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={`ray-${i}`}
                  className="absolute animate-ray"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: '2px',
                    height: '150%',
                    background: `linear-gradient(to bottom, transparent, ${scoreGrade.color}40, transparent)`,
                    transform: `rotate(${i * 60}deg) translateX(-50%)`,
                    transformOrigin: 'top center',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 중앙 내용 */}
        <div className="relative text-center px-8">
          {/* 글로우 배경 */}
          <div
            className={`absolute inset-0 rounded-full blur-3xl transition-all duration-1000 ${
              revealStep >= 1 ? 'opacity-30 scale-100' : 'opacity-0 scale-50'
            }`}
            style={{ backgroundColor: scoreGrade.color }}
          />

          {/* 얼굴 이미지 (단계 1) */}
          {revealStep >= 1 && data.imageData && (
            <div className={`relative mb-8 transition-all duration-700 ${revealStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
              <div
                className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 shadow-2xl"
                style={{ borderColor: scoreGrade.color, boxShadow: `0 0 40px ${scoreGrade.color}50` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.imageData} alt="분석된 얼굴" className="w-full h-full object-cover" />
              </div>

              {/* 스캔 라인 효과 */}
              {revealStep < 2 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full border-2 border-white/30 animate-ping" />
                </div>
              )}
            </div>
          )}

          {/* 점수 표시 (단계 2) */}
          {revealStep >= 2 && (
            <div className={`transition-all duration-500 ${revealStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
              <p className="text-white/70 text-lg mb-2">당신의 얼굴력은</p>
              <div className="relative">
                <span
                  className={`text-8xl font-black animate-countUp ${isHighScore ? 'animate-pulse' : ''}`}
                  style={{
                    color: scoreGrade.color,
                    textShadow: isHighScore ? `0 0 30px ${scoreGrade.color}, 0 0 60px ${scoreGrade.color}` : `0 0 20px ${scoreGrade.color}50`
                  }}
                >
                  {data.score}
                </span>
                <span className="text-white/70 text-2xl ml-2">점</span>

                {/* 높은 점수 특수 효과 */}
                {isHighScore && (
                  <>
                    <div className="absolute -top-4 -right-4 text-4xl animate-bounce">✨</div>
                    <div className="absolute -bottom-2 -left-4 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🌟</div>
                  </>
                )}
              </div>

              {/* 티어 배지 */}
              <div className="mt-4">
                <span
                  className="inline-block px-6 py-2 rounded-full text-lg font-bold animate-fadeIn"
                  style={{
                    backgroundColor: `${scoreGrade.color}30`,
                    color: scoreGrade.color,
                    border: `2px solid ${scoreGrade.color}`
                  }}
                >
                  {data.score >= 85 ? '✨ LEGENDARY' :
                    data.score >= 70 ? '🔥 EPIC' :
                      data.score >= 55 ? '💎 RARE' :
                        data.score >= 40 ? '🌿 UNCOMMON' : '⚪ COMMON'}
                </span>
              </div>

              {/* 로딩 표시 */}
              <p className="text-white/50 text-sm mt-6 animate-pulse">
                상세 결과 불러오는 중...
              </p>
            </div>
          )}
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.6; }
            25% { transform: translateY(-15px) rotate(90deg) scale(1.1); opacity: 0.9; }
            50% { transform: translateY(-25px) rotate(180deg) scale(1.2); opacity: 1; }
            75% { transform: translateY(-10px) rotate(270deg) scale(1.05); opacity: 0.8; }
          }
          @keyframes particlePulse {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; box-shadow: 0 0 10px currentColor; }
            25% { transform: translateY(-20px) scale(1.3); opacity: 1; box-shadow: 0 0 25px currentColor; }
            50% { transform: translateY(-30px) scale(1.5); opacity: 0.9; box-shadow: 0 0 35px currentColor; }
            75% { transform: translateY(-15px) scale(1.2); opacity: 1; box-shadow: 0 0 20px currentColor; }
          }
          @keyframes sparkle {
            0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
            25% { transform: scale(1.2) rotate(90deg); opacity: 1; }
            50% { transform: scale(0.8) rotate(180deg); opacity: 0.8; }
            75% { transform: scale(1) rotate(270deg); opacity: 1; }
          }
          @keyframes ray {
            0%, 100% { opacity: 0.1; transform: rotate(var(--rotation)) scaleY(0.8); }
            50% { opacity: 0.4; transform: rotate(var(--rotation)) scaleY(1.2); }
          }
          @keyframes countUp {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-particle-pulse {
            animation: particlePulse 2.5s ease-in-out infinite;
          }
          .animate-sparkle {
            animation: sparkle 2s ease-in-out infinite;
          }
          .animate-ray {
            animation: ray 3s ease-in-out infinite;
          }
          .animate-countUp {
            animation: countUp 0.8s ease-out forwards;
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-lg">

        {/* 얼굴 + 랜드마크 시각화 */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
          <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-4 border border-white/10">
            {data.imageData && data.landmarks ? (
              <canvas
                ref={canvasRef}
                className="w-full aspect-square rounded-2xl"
                style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }}
              />
            ) : (
              <div className="w-full aspect-square rounded-2xl bg-white/5 flex flex-col items-center justify-center">
                <div className="text-8xl mb-4 opacity-30">👤</div>
                <p className="text-white/50 text-sm">이미지가 만료되었습니다</p>
              </div>
            )}

          </div>

          {/* 얼굴력 점수 - 캔버스 아래로 이동 */}
          <div className="text-center mt-4 relative">
            <div
              className="inline-flex items-center gap-2 backdrop-blur px-5 py-3 rounded-full border cursor-pointer hover:scale-105 transition-transform"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderColor: scoreGrade.color,
                boxShadow: `0 0 20px ${scoreGrade.color}40`
              }}
              onClick={() => setShowScoreTooltip(!showScoreTooltip)}
            >
              <span className="text-white/70 text-lg">얼굴력</span>
              <span className="text-2xl font-black" style={{ color: scoreGrade.color }}>{data.score}</span>
              <span className="text-white/70 text-lg">점</span>
              <span className="text-white/50 text-sm ml-1">ⓘ</span>
            </div>

            {/* 얼굴력 설명 툴팁 */}
            {showScoreTooltip && (
              <div
                className="absolute left-1/2 -translate-x-1/2 mt-3 w-80 bg-slate-800/95 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-2xl z-50 animate-fadeInTooltip"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800/95 border-l border-t border-white/20 rotate-45"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-bold text-lg flex items-center gap-2">
                      <span style={{ color: scoreGrade.color }}>✦</span> 얼굴력이란?
                    </h4>
                    <button
                      onClick={() => setShowScoreTooltip(false)}
                      className="text-white/50 hover:text-white/80 text-xl leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed mb-3">
                    얼굴력은 <strong>관상학적 특징</strong>을 종합 분석하여 산출한 점수입니다.
                    얼굴의 비율, 이목구비 균형, 관상적 특성을 AI가 분석합니다.
                  </p>
                  <div className="bg-white/5 rounded-xl p-3 mb-3">
                    <p className="text-white/60 text-xs mb-2">평가 항목</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <span className="text-cyan-400">•</span> 삼정(상/중/하) 비율
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80">
                        <span className="text-pink-400">•</span> 눈/코/입 균형
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80">
                        <span className="text-yellow-400">•</span> 황금비율 근접도
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80">
                        <span className="text-purple-400">•</span> 관상적 특성
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="px-2 py-1 rounded-full bg-gray-600/50 text-gray-300">~39 COMMON</span>
                    <span className="px-2 py-1 rounded-full bg-emerald-900/50 text-emerald-300">40~54 UNCOMMON</span>
                    <span className="px-2 py-1 rounded-full bg-teal-900/50 text-teal-300">55~69 RARE</span>
                    <span className="px-2 py-1 rounded-full bg-rose-900/50 text-rose-300">70~84 EPIC</span>
                    <span className="px-2 py-1 rounded-full bg-amber-900/50 text-amber-300">85~ LEGENDARY</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 만료 안내 */}
          {!data.isImageExpired && data.imageData && (
            <div className="text-center mt-2">
              <span className="text-white/40 text-xs">{getExpiryText()}</span>
            </div>
          )}
        </div>

        {/* 디버그 정보 섹션 - 관리자 전용 (?debug=true) */}
        {isDebugMode && (
          <DebugPanel analysis={data.analysis} memo={memo} setMemo={setMemo} shareCode={data.shareCode} />
        )}

        {/* 한줄평 카드 */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
          <span className="text-pink-400 text-sm font-medium">✨ 관상 한줄평</span>
          <p className="text-white text-xl font-bold leading-relaxed mt-2">
            {oneLiner}
          </p>
        </div>

        {/* 레이더 차트 (육각형 대신 사각형 - 4개 카테고리) */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span>📊</span> 카테고리별 분석
          </h3>

          <RadarChart categories={data.categories} />

          {/* 카테고리 상세 */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <div
                key={key}
                className="bg-white/5 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{info.icon}</span>
                  <span className="text-white text-sm font-medium">{info.name}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: info.color }}>
                  {data.categories[key as keyof typeof data.categories]}점
                </div>
                <div className="text-white/50 text-xs mt-1">{info.description}</div>
              </div>
            ))}
          </div>
        </div>


        {/* 조언 및 궁합 정보 */}
        {(() => {
          const advice = generateDetailedAdvice(data.score, data.categories, data.analysis);
          return (
            <div className={`rounded-2xl overflow-hidden mb-6 ${
              expandedItem === 'advice'
                ? 'bg-white/5 backdrop-blur border border-white/10'
                : 'bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-purple-500/20 border border-amber-400/30 shadow-lg shadow-amber-500/10'
            }`}>
              <button
                onClick={() => setExpandedItem(expandedItem === 'advice' ? null : 'advice')}
                className="w-full px-6 py-4 flex items-center justify-between text-white"
              >
                <span className="font-bold flex items-center gap-2">
                  <span>💡</span> 조언 및 인간관계 궁합
                </span>
                <span className="flex items-center gap-2">
                  {expandedItem !== 'advice' && (
                    <span className="text-xs text-amber-300/90 font-normal animate-pulse">열어보세요</span>
                  )}
                  <span className={`transform transition-transform ${expandedItem === 'advice' ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </span>
              </button>

              {expandedItem === 'advice' && (
                <div className="px-6 pb-6 space-y-4">
                  {/* 장점 */}
                  <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                    <div className="text-green-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <span>✨</span> 당신의 강점
                    </div>
                    <ul className="space-y-2">
                      {advice.strengths.map((item, i) => (
                        <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                          <span className="text-green-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 주의사항 */}
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                    <div className="text-amber-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <span>⚠️</span> 이것만 주의하세요
                    </div>
                    <ul className="space-y-2">
                      {advice.cautions.map((item, i) => (
                        <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 잘 맞는 사람 */}
                  <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-500/20">
                    <div className="text-pink-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <span>💕</span> 잘 맞는 사람
                    </div>
                    <ul className="space-y-2">
                      {advice.compatible.map((item, i) => (
                        <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                          <span className="text-pink-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 조심해야 할 사람 */}
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                    <div className="text-red-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <span>🚫</span> 조심해야 할 관계
                    </div>
                    <ul className="space-y-2">
                      {advice.incompatible.map((item, i) => (
                        <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 상세 분석 (접을 수 있음) */}
        <div className={`rounded-2xl overflow-hidden mb-6 ${
          expandedItem === 'detail'
            ? 'bg-white/5 backdrop-blur border border-white/10'
            : 'bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10'
        }`}>
          <button
            onClick={() => setExpandedItem(expandedItem === 'detail' ? null : 'detail')}
            className="w-full px-6 py-4 flex items-center justify-between text-white"
          >
            <span className="font-bold flex items-center gap-2">
              <span>🔍</span> 상세 분석 보기
            </span>
            <span className="flex items-center gap-2">
              {expandedItem !== 'detail' && (
                <span className="text-xs text-cyan-300/90 font-normal animate-pulse">열어보세요</span>
              )}
              <span className={`transform transition-transform ${expandedItem === 'detail' ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </span>
          </button>

          {expandedItem === 'detail' && (
            <div className="px-6 pb-6 space-y-3">
              <div className="space-y-3">
                {Object.entries(data.analysis)
                  .filter(([key]) => key !== 'goldenMatch')
                  .map(([key, value]) => {
                  const analysisValue = value as { label?: string; description?: string } | number;
                  const isObject = typeof analysisValue === 'object' && analysisValue !== null;

                  return (
                    <div key={key} className="bg-white/5 rounded-xl p-4">
                      <div className="text-white/70 text-sm mb-1">
                        {key === 'eyeAngle' && '👁️ 눈꼬리 각도'}
                        {key === 'eyebrowDistance' && '🎯 눈-눈썹 거리'}
                        {key === 'noseLength' && '👃 코 길이'}
                        {key === 'philtrumLength' && '💋 인중 길이'}
                        {key === 'mouthWidth' && '😊 입 너비'}
                        {key === 'jawWidth' && '🏛️ 하관(턱)'}
                        {key === 'eyeSize' && '✨ 눈 크기'}
                      </div>
                      {isObject ? (
                        <>
                          <div className="text-white font-medium mb-2">{analysisValue.label}</div>
                          <div className="text-white/60 text-sm">{analysisValue.description}</div>
                        </>
                      ) : (
                        <div className="text-white font-medium">
                          {typeof analysisValue === 'number' ? analysisValue.toFixed(1) : String(analysisValue)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 황금궁합 */}
              {Boolean((data.analysis as Record<string, unknown>)?.goldenMatch) && (
                <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20">
                  <div className="text-yellow-400 text-sm font-medium mb-2 flex items-center gap-2">
                    <span>💛</span> 황금궁합
                  </div>
                  <div className="text-white font-medium">
                    {String((data.analysis as Record<string, unknown>).goldenMatch)}
                  </div>
                </div>
              )}

              {/* 나이대별 특이사항 (백세류년도 기반) */}
              {(() => {
                const overallReading = (data.analysis as Record<string, unknown>)?.overallReading as { ageFortuneDetails?: Array<{ ageRange: string; label: string; fortune: 'great' | 'good' | 'normal' | 'caution'; description: string; relatedFeature: string }> } | undefined;
                const details = overallReading?.ageFortuneDetails;
                if (!details || details.length === 0) return null;
                return (
                  <div className="bg-gradient-to-b from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20">
                    <div className="text-indigo-300 text-sm font-medium mb-4 flex items-center gap-2">
                      <span>🔮</span> 나이대별 인생 특이사항
                    </div>
                    <div className="relative">
                      <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/40 via-green-500/40 via-yellow-500/40 via-orange-500/40 to-red-500/40" />
                      <div className="space-y-4">
                        {details.map((item, i) => {
                          const fortuneConfig = {
                            great:   { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', dot: 'bg-yellow-400', icon: '★' },
                            good:    { color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/30',  dot: 'bg-green-400',  icon: '●' },
                            normal:  { color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/30',   dot: 'bg-blue-400',   icon: '○' },
                            caution: { color: 'text-orange-400', bg: 'bg-orange-500/20',  border: 'border-orange-500/30', dot: 'bg-orange-400', icon: '△' },
                          };
                          const config = fortuneConfig[item.fortune];
                          return (
                            <div key={i} className="flex items-start gap-3 relative">
                              <div className={`w-[11px] h-[11px] rounded-full ${config.dot} mt-1.5 ring-2 ring-black/50 z-10 flex-shrink-0 ml-[17px]`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="text-white font-bold text-sm">{item.ageRange}</span>
                                  <span className={`${config.bg} ${config.color} ${config.border} border px-2 py-0.5 rounded-full text-xs font-medium`}>
                                    {config.icon} {item.label}
                                  </span>
                                  <span className="text-white/30 text-xs">{item.relatedFeature}</span>
                                </div>
                                <div className="text-white/60 text-xs leading-relaxed">{item.description}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}
        </div>

        {/* 공유 카드 생성 */}
        <div className={`rounded-2xl p-6 mb-6 ${
          shareCardUrl
            ? 'bg-white/5 backdrop-blur border border-white/10'
            : 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-400/20 shadow-md shadow-pink-500/5'
        }`}>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span>📸</span> 인스타그램 공유 카드
            {!shareCardUrl && (
              <span className="text-xs text-pink-300/80 font-normal ml-auto">카드를 만들어보세요</span>
            )}
          </h3>

          {!shareCardUrl ? (
            <button
              onClick={generateShareCard}
              disabled={isGeneratingCard}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {isGeneratingCard ? '카드 생성 중...' : '🎨 공유 카드 만들기'}
            </button>
          ) : (
            <div className="space-y-4">
              {/* 카카오 애드핏 광고 (카드 생성 후 항상 표시) */}
              <div className="rounded-xl overflow-hidden">
                <KakaoAd />
              </div>

              {!cardReady ? (
                /* 5초 대기 중: 로딩 표시 */
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/70 text-sm">공유 카드를 생성중이에요.</p>
                </div>
              ) : (
                /* 5초 후: 카드 + 버튼 표시 */
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shareCardUrl}
                    alt="공유 카드"
                    className="w-full rounded-xl border border-white/30"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={downloadCard}
                      className="py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20"
                    >
                      💾 저장하기
                    </button>
                    <button
                      onClick={shareCard}
                      className="py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium"
                    >
                      📤 공유하기
                    </button>
                  </div>
                  <p className="text-center text-white/70 text-sm">카카오톡, 인스타그램으로 내 관상 카드를 공유해보세요!</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* URL 공유 */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span>🔗</span> 결과 링크 공유
          </h3>
          <button
            onClick={copyUrl}
            className="w-full py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20"
          >
            {copied ? '✅ 복사됨!' : '📋 링크 복사하기'}
          </button>
          <p className="text-white/40 text-xs mt-2 text-center">
            이 링크를 공유하면 누구나 결과를 볼 수 있어요
          </p>
        </div>

        {/* 광고 영역 - 서비스 후원 */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur rounded-2xl p-5 mb-6 border border-amber-500/20">
          <div className="text-center mb-3">
            <p className="text-amber-300 text-sm font-medium mb-1">
              🙏 관상 복비는 광고 한 번으로 충분해요
            </p>
            <p className="text-white/50 text-xs">
              광고 클릭이 더 좋은 관상 서비스를 만드는 데 큰 힘이 됩니다
            </p>
          </div>
          <p className="text-white/30 text-[10px] mt-1 text-center">서비스 하단의 광고 클릭으로 응원해주세요</p>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => router.push('/face-analysis')}
            className="py-4 bg-white/10 text-white rounded-2xl font-medium hover:bg-white/20 transition-all"
          >
            📸 다시 분석
          </button>
          <button
            onClick={() => router.push('/')}
            className="py-4 bg-white/10 text-white rounded-2xl font-medium hover:bg-white/20 transition-all"
          >
            🏠 홈으로
          </button>
        </div>

        {/* 조회수 및 면책 조항 */}
        <div className="text-center space-y-2 mb-8">
          <p className="text-white/40 text-xs">
            👀 {data.viewCount}회 조회
          </p>
          <p className="text-white/40 text-xs">
            🔮 관상 분석은 재미로만 참고해주세요
          </p>
        </div>

        {/* 구분선 */}
        <div className="border-t border-white/10 my-6"></div>

        {/* 두 사람 궁합 분석 - 유료 기능 티저 (별도 영역) */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur rounded-2xl p-6 mb-6 border border-purple-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">👫</div>
            <div>
              <h3 className="text-white font-bold text-lg">두 사람 궁합 분석</h3>
              <p className="text-white/60 text-sm">두 얼굴을 비교해서 정확한 궁합을 알아보세요</p>
            </div>
          </div>
          <div className="bg-black/20 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-3 gap-3 items-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <p className="text-white/60 text-xs mt-2">나</p>
              </div>
              <div className="text-center text-pink-400 text-2xl">💗</div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <p className="text-white/60 text-xs mt-2">상대방</p>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm text-white/70 mb-4">
            <p className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> 관상학 기반 정밀 궁합 분석
            </p>
            <p className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> 연애/결혼/비즈니스 궁합 점수
            </p>
            <p className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> 상대와의 주의점 및 조언 제공
            </p>
          </div>
          <button
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={() => router.push('/face-analysis/compatibility')}
          >
            💕 궁합 분석하기
          </button>
        </div>

        {/* 후원 안내 */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur rounded-2xl p-5 border border-amber-500/20">
          <div className="text-center space-y-3">
            <div className="text-3xl">💝</div>
            <div>
              <p className="text-white/90 font-medium text-sm leading-relaxed">
                관상 분석이 재미있으셨나요?
              </p>
              <p className="text-white/60 text-xs mt-2 leading-relaxed">
                이 서비스는 한 사람이 정성껏 만들어<br/>
                무료로 운영하고 있습니다.<br/>
                작은 후원이 큰 힘이 됩니다 🙏
              </p>
            </div>
            <a
              href="https://litt.ly/miniface"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
            >
              <span>☕</span>
              <span>개발자에게 믹스커피 사주기</span>
            </a>
          </div>
        </div>
      </div>

      {/* 숨겨진 공유 카드 캔버스 */}
      <canvas ref={shareCanvasRef} className="hidden" />
    </div>
  );
}
