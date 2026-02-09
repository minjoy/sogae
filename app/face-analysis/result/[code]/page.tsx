'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';


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

// 결정적 한줄평 생성 (동일 분석 = 동일 결과) - draw.py 스타일
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

  // 돋보이는 특징 찾기 (draw.py 스타일)
  let featureText = "";

  // 눈썹-눈 거리
  const eyebrowLabel = getLabel('eyebrowDistance');
  if (eyebrowLabel.includes('매우 넓음')) {
    featureText = "재물이 넘치는 눈두덩이, ";
  } else if (eyebrowLabel.includes('넓은 편')) {
    featureText = "돈을 부르는 눈두덩이, ";
  }

  // 눈꼬리
  const eyeLabel = getLabel('eyeAngle');
  if (eyeLabel.includes('많이 올라감')) {
    featureText = "눈의 기상이 하늘을 찌르는, ";
  } else if (eyeLabel.includes('올라감')) {
    featureText = "날카로운 눈매가 인상적인, ";
  }

  // 코 길이
  const noseLabel = getLabel('noseLength');
  if (noseLabel.includes('긴')) {
    featureText = "여럿 애간장 녹이는 매력 코, ";
  } else if (noseLabel.includes('이상적')) {
    featureText = "완벽한 비율의 코, ";
  }

  // 입 너비
  const mouthLabel = getLabel('mouthWidth');
  if (mouthLabel.includes('매우 큰')) {
    featureText = "모두를 현혹시키는 매력 입술, ";
  } else if (mouthLabel.includes('큰')) {
    featureText = "에너지 넘치는 입매, ";
  } else if (mouthLabel.includes('이상적')) {
    featureText = "이상적인 입매, ";
  }

  // 인중
  const philtrumLabel = getLabel('philtrumLength');
  if (philtrumLabel.includes('매우 긴')) {
    featureText = "강이 흐를법한 매력 인중, ";
  } else if (philtrumLabel.includes('긴 편')) {
    featureText = "인중이 참 예쁜, ";
  }

  // 하관
  const jawLabel = getLabel('jawWidth');
  if (jawLabel.includes('매우 튼튼')) {
    featureText = "최고의 복덩이 하관, ";
  } else if (jawLabel.includes('튼튼')) {
    featureText = "하관 최고인, ";
  }

  // 점수 구간별 운세 풀이
  const fortunes: Record<string, string[]> = {
    high: [
      "연애운과 재물운 모두 대박 예정!",
      "하는 일마다 대성공 예약!",
      "사람을 끌어당기는 타고난 복상!",
      "부자가 될 운명을 타고났어요!",
    ],
    medium: [
      "꾸준히 노력하면 큰 성공이 기다려요!",
      "좋은 인연이 곧 찾아올 거예요!",
      "때를 기다리면 빛나는 순간이 와요!",
      "숨겨진 재능이 곧 발휘될 거예요!",
    ],
    low: [
      "역경을 딛고 성공하는 드라마틱한 인생!",
      "늦깎이 성공형, 포기하지 마세요!",
      "노력이 빛나는 자수성가형!",
      "시간이 편, 결국 인정받아요!",
    ],
  };

  // 점수 구간 결정
  let tier: 'high' | 'medium' | 'low';
  if (score >= 70) tier = 'high';
  else if (score >= 50) tier = 'medium';
  else tier = 'low';

  // 시드 기반 결정적 선택
  const seed = score * 7 + categories.r1 + categories.r2 * 2 + categories.r3 * 3 + categories.r4 * 4;
  const fortuneIndex = Math.floor(seed) % fortunes[tier].length;

  return featureText + fortunes[tier][fortuneIndex];
}

// 점수에 따른 등급
function getScoreGrade(score: number): { grade: string; color: string; emoji: string } {
  if (score >= 85) return { grade: '대길', color: '#FFD700', emoji: '👑' };
  if (score >= 70) return { grade: '길', color: '#FF6B6B', emoji: '✨' };
  if (score >= 55) return { grade: '중길', color: '#4ECDC4', emoji: '💫' };
  if (score >= 40) return { grade: '소길', color: '#95E1D3', emoji: '🍀' };
  return { grade: '평', color: '#A8A8A8', emoji: '🌱' };
}

// 디버그 패널 컴포넌트
function DebugPanel({ analysis }: { analysis: Record<string, unknown> }) {
  const debug = analysis?.debug as {
    noseWidth?: number;
    noseLengthRatio?: number;
    philtrumRatio?: number;
    mouthRatio?: number;
    jawRatio?: number;
    eyebrowRatio?: number;
    eyeAngleDegrees?: number;
    facescore?: number;
  } | undefined;

  if (!debug) return null;

  return (
    <div className="bg-red-500/10 backdrop-blur rounded-2xl p-4 mb-6 border border-red-500/30">
      <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2">
        <span>🔧</span> 디버그 정보 (개발용)
      </h3>
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="bg-black/30 p-2 rounded">
          <span className="text-gray-400">코너비 (noseWidth):</span>
          <span className="text-white ml-2">{debug.noseWidth?.toFixed(2)}</span>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <span className="text-gray-400">코길이비 (ratio2):</span>
          <span className="text-yellow-400 ml-2 font-bold">{debug.noseLengthRatio?.toFixed(3)}</span>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <span className="text-gray-400">인중비 (ratio3):</span>
          <span className="text-yellow-400 ml-2 font-bold">{debug.philtrumRatio?.toFixed(3)}</span>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <span className="text-gray-400">입너비비 (ratio7):</span>
          <span className="text-yellow-400 ml-2 font-bold">{debug.mouthRatio?.toFixed(3)}</span>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <span className="text-gray-400">턱비 (ratio8):</span>
          <span className="text-yellow-400 ml-2 font-bold">{debug.jawRatio?.toFixed(3)}</span>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <span className="text-gray-400">눈썹비:</span>
          <span className="text-yellow-400 ml-2 font-bold">{debug.eyebrowRatio?.toFixed(3)}</span>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <span className="text-gray-400">눈각도 (°):</span>
          <span className="text-cyan-400 ml-2 font-bold">{debug.eyeAngleDegrees?.toFixed(2)}°</span>
        </div>
        <div className="bg-black/30 p-2 rounded">
          <span className="text-gray-400">facescore:</span>
          <span className="text-green-400 ml-2 font-bold">{debug.facescore}</span>
        </div>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        <p>• draw.py 임계값: 코길이 &gt;1.55(긴), 1.28~1.55(이상적), &lt;1.28(짧음)</p>
        <p>• draw.py 임계값: 인중 &gt;0.7(매우긴), 0.65~0.7(긴), 0.58~0.65(이상적)</p>
        <p>• draw.py 임계값: 입너비 &gt;1.75(매우큼), 1.65~1.75(큼), 1.57~1.65(이상적)</p>
      </div>
    </div>
  );
}

// MediaPipe 랜드마크 연결선 정의
const FACE_CONNECTIONS = {
  silhouette: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362],
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  nose: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2],
  lipsOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61],
};

// 기존 주요 포인트
const KEY_POINTS = [33, 133, 362, 263, 159, 386, 70, 300, 107, 336, 1, 4, 5, 195, 61, 291, 0, 17, 152, 234, 454, 10];

// 디버그용 추가 포인트 (코끝, 콧볼, 입, 턱 등)
const DEBUG_POINTS = {
  nose: {
    tip: 1,           // 코끝
    bridge: 6,        // 코 브릿지 (미간)
    bottomCenter: 2,  // 코밑 중앙
    leftAla: 129,     // 왼쪽 콧볼
    rightAla: 358,    // 오른쪽 콧볼
  },
  eyes: {
    leftCenter: 468,  // 왼쪽 눈 중심 (iris)
    rightCenter: 473, // 오른쪽 눈 중심 (iris)
    leftOuter: 33,    // 왼쪽 눈 외곽
    leftInner: 133,   // 왼쪽 눈 안쪽
    rightOuter: 263,  // 오른쪽 눈 외곽
    rightInner: 362,  // 오른쪽 눈 안쪽
  },
  mouth: {
    left: 61,         // 입 왼쪽
    right: 291,       // 입 오른쪽
    top: 0,           // 윗입술 중앙
    bottom: 17,       // 아랫입술 중앙
    center: 13,       // 입 중앙
  },
  jaw: {
    chin: 152,        // 턱 끝
    leftJaw: 234,     // 왼쪽 턱
    rightJaw: 454,    // 오른쪽 턱
  },
  eyebrow: {
    leftOuter: 70,    // 왼쪽 눈썹 외곽
    leftInner: 107,   // 왼쪽 눈썹 안쪽
    rightOuter: 300,  // 오른쪽 눈썹 외곽
    rightInner: 336,  // 오른쪽 눈썹 안쪽
  },
  cheek: {
    left: 234,        // 왼쪽 볼
    right: 454,       // 오른쪽 볼
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);

  const [data, setData] = useState<FaceAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oneLiner, setOneLiner] = useState<string>('');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;

      const drawConnections = (indices: number[]) => {
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

      Object.values(FACE_CONNECTIONS).forEach(connection => {
        drawConnections(connection);
      });

      // 라벨이 있는 점 그리기 함수
      const drawLabeledPoint = (idx: number, color: string, label: string) => {
        const point = transformPoint(idx);
        if (!point) return;

        // 점 그리기
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 라벨 그리기
        ctx.font = 'bold 10px Arial';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(label, point.x + 7, point.y + 3);
        ctx.fillText(label, point.x + 7, point.y + 3);
      };

      // 코 관련 점 (빨강)
      drawLabeledPoint(DEBUG_POINTS.nose.tip, '#ff0000', '코끝');
      drawLabeledPoint(DEBUG_POINTS.nose.bridge, '#ff0000', '미간');
      drawLabeledPoint(DEBUG_POINTS.nose.bottomCenter, '#ff0000', '코밑');
      drawLabeledPoint(DEBUG_POINTS.nose.leftAla, '#ff6600', '왼콧볼');
      drawLabeledPoint(DEBUG_POINTS.nose.rightAla, '#ff6600', '우콧볼');

      // 눈 관련 점 (파랑)
      drawLabeledPoint(DEBUG_POINTS.eyes.leftCenter, '#00ff00', '왼눈');
      drawLabeledPoint(DEBUG_POINTS.eyes.rightCenter, '#00ff00', '우눈');
      drawLabeledPoint(DEBUG_POINTS.eyes.leftOuter, '#0088ff', '');
      drawLabeledPoint(DEBUG_POINTS.eyes.leftInner, '#0088ff', '');
      drawLabeledPoint(DEBUG_POINTS.eyes.rightOuter, '#0088ff', '');
      drawLabeledPoint(DEBUG_POINTS.eyes.rightInner, '#0088ff', '');

      // 입 관련 점 (분홍)
      drawLabeledPoint(DEBUG_POINTS.mouth.left, '#ff00ff', '입좌');
      drawLabeledPoint(DEBUG_POINTS.mouth.right, '#ff00ff', '입우');
      drawLabeledPoint(DEBUG_POINTS.mouth.top, '#ff00ff', '윗입');
      drawLabeledPoint(DEBUG_POINTS.mouth.bottom, '#ff00ff', '아랫입');
      drawLabeledPoint(DEBUG_POINTS.mouth.center, '#ff00ff', '입중앙');

      // 턱 관련 점 (노랑)
      drawLabeledPoint(DEBUG_POINTS.jaw.chin, '#ffff00', '턱끝');
      drawLabeledPoint(DEBUG_POINTS.jaw.leftJaw, '#ffff00', '왼턱');
      drawLabeledPoint(DEBUG_POINTS.jaw.rightJaw, '#ffff00', '우턱');

      // 눈썹 관련 점 (청록)
      drawLabeledPoint(DEBUG_POINTS.eyebrow.leftOuter, '#00ffff', '');
      drawLabeledPoint(DEBUG_POINTS.eyebrow.leftInner, '#00ffff', '');
      drawLabeledPoint(DEBUG_POINTS.eyebrow.rightOuter, '#00ffff', '');
      drawLabeledPoint(DEBUG_POINTS.eyebrow.rightInner, '#00ffff', '');

      // 기존 KEY_POINTS 표시 (작은 점)
      ctx.globalAlpha = 0.4;
      KEY_POINTS.forEach(idx => {
        const point = transformPoint(idx);
        if (!point) return;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00ff';
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    img.src = data.imageData;
  }, [data]);

  useEffect(() => {
    if (data?.imageData && data?.landmarks) {
      drawFaceMesh();
    }
  }, [data, drawFaceMesh]);

  // 공유 카드 생성
  const generateShareCard = useCallback(async () => {
    if (!shareCanvasRef.current || !data) return;

    setIsGeneratingCard(true);

    const canvas = shareCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    const { emoji, grade } = getScoreGrade(data.score);

    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // 장식 원들
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(100, 100, 200, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b6b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(980, 980, 250, 0, Math.PI * 2);
    ctx.fillStyle = '#4ecdc4';
    ctx.fill();
    ctx.globalAlpha = 1;

    // 상단: 로고/타이틀
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AI 관상 분석', 540, 60);

    // 얼굴 이미지 (있는 경우)
    const faceY = 320;
    const faceSize = 380;

    if (data.imageData && data.landmarks) {
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = data.imageData!;
      });

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

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
        ctx.lineWidth = 2;

        Object.values(FACE_CONNECTIONS).forEach(connection => {
          ctx.beginPath();
          connection.forEach((idx, i) => {
            if (idx >= landmarks.length) return;
            const point = transformPoint(idx);
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        });

        ctx.globalAlpha = 0.5;
        KEY_POINTS.forEach(idx => {
          if (idx >= landmarks.length) return;
          const point = transformPoint(idx);
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ff00ff';
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        ctx.restore();
      }
    } else {
      // 기본 이미지 (만료된 경우)
      ctx.beginPath();
      ctx.arc(540, faceY, faceSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
      ctx.font = '80px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText('👤', 540, faceY + 25);
    }

    // 원형 테두리
    ctx.beginPath();
    ctx.arc(540, faceY, faceSize / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 점수 배지
    const badgeY = faceY + faceSize/2 + 50;

    const scoreGradient = ctx.createRadialGradient(540, badgeY + 40, 0, 540, badgeY + 40, 80);
    scoreGradient.addColorStop(0, data.score >= 70 ? '#ff6b6b' : data.score >= 50 ? '#4ecdc4' : '#95a5a6');
    scoreGradient.addColorStop(1, data.score >= 70 ? '#ee5a24' : data.score >= 50 ? '#1abc9c' : '#7f8c8d');

    ctx.beginPath();
    ctx.arc(540, badgeY + 40, 60, 0, Math.PI * 2);
    ctx.fillStyle = scoreGradient;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(data.score.toString(), 540, badgeY + 55);
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('점', 540, badgeY + 80);

    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${emoji} ${grade}`, 540, badgeY + 130);

    // 한줄평
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif';

    const maxWidth = 900;
    const lineHeight = 45;
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

    const startY = badgeY + 200;
    lines.forEach((l, i) => {
      ctx.fillText(l, 540, startY + i * lineHeight);
    });

    // 워터마크
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('unyeoni.com', 540, 1040);

    const dataUrl = canvas.toDataURL('image/png');
    setShareCardUrl(dataUrl);
    setIsGeneratingCard(false);
  }, [data, oneLiner]);

  // 카드 다운로드
  const downloadCard = () => {
    if (!shareCardUrl) return;
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
          title: 'AI 관상 분석 결과',
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

  const { grade, emoji } = getScoreGrade(data.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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

            {/* 오버레이 정보 */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur px-4 py-2 rounded-full">
                <span className="text-2xl">{emoji}</span>
                <span className="text-white font-bold text-xl">{data.score}점</span>
                <span className="text-white/70">|</span>
                <span className="text-white font-medium">{grade}</span>
              </div>
            </div>
          </div>

          {/* 만료 안내 */}
          {!data.isImageExpired && data.imageData && (
            <div className="text-center mt-2">
              <span className="text-white/40 text-xs">{getExpiryText()}</span>
            </div>
          )}
        </div>

        {/* 한줄평 카드 */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
          <span className="text-pink-400 text-sm font-medium">✨ 관상 한줄평</span>
          <p className="text-white text-xl font-bold leading-relaxed mt-2">
            {oneLiner}
          </p>
        </div>

        {/* 디버그 정보 섹션 */}
        <DebugPanel analysis={data.analysis} />

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

        {/* 공유 카드 생성 */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span>📸</span> 인스타그램 공유 카드
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shareCardUrl}
                alt="공유 카드"
                className="w-full rounded-xl"
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

        {/* 상세 분석 (접을 수 있음) */}
        <div className="bg-white/5 backdrop-blur rounded-2xl overflow-hidden mb-6 border border-white/10">
          <button
            onClick={() => setExpandedItem(expandedItem === 'detail' ? null : 'detail')}
            className="w-full px-6 py-4 flex items-center justify-between text-white"
          >
            <span className="font-bold flex items-center gap-2">
              <span>🔍</span> 상세 분석 보기
            </span>
            <span className={`transform transition-transform ${expandedItem === 'detail' ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedItem === 'detail' && (
            <div className="px-6 pb-6 space-y-3">
              <div className="space-y-3">
                {Object.entries(data.analysis).map(([key, value]) => {
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
            </div>
          )}
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
        <div className="text-center space-y-2">
          <p className="text-white/40 text-xs">
            👀 {data.viewCount}회 조회
          </p>
          <p className="text-white/40 text-xs">
            🔮 AI 관상 분석은 재미로만 참고해주세요
          </p>
        </div>
      </div>

      {/* 숨겨진 공유 카드 캔버스 */}
      <canvas ref={shareCanvasRef} className="hidden" />
    </div>
  );
}
