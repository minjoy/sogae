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
  analysis: Record<string, number>;
  landmarks?: number[][];
  imageWidth?: number;
  imageHeight?: number;
  imageData?: string | null;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
  isImageExpired: boolean;
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

// 결정적 한줄평 생성 (동일 분석 = 동일 결과)
function generateDeterministicOneLiner(
  score: number,
  categories: { r1: number; r2: number; r3: number; r4: number },
  analysis: Record<string, number>
): string {
  // 분석값들의 합을 시드로 사용
  const analysisSum = Object.values(analysis).reduce((a, b) => a + b, 0);
  const catSum = categories.r1 + categories.r2 + categories.r3 + categories.r4;
  const seed = Math.floor(score * 100 + catSum * 10 + analysisSum);

  // 최대 카테고리 결정
  const maxCat = Math.max(categories.r1, categories.r2, categories.r3, categories.r4);
  let dominantCat: 'r1' | 'r2' | 'r3' | 'r4' = 'r1';
  if (maxCat === categories.r2) dominantCat = 'r2';
  else if (maxCat === categories.r3) dominantCat = 'r3';
  else if (maxCat === categories.r4) dominantCat = 'r4';

  // 점수 구간별 + 카테고리별 한줄평 (결정적)
  const oneLiners: Record<string, Record<string, string[]>> = {
    high: { // 70점 이상
      r1: [
        "타고난 리더십, 이 얼굴이면 사장님 소리 듣습니다",
        "권력자의 상, 부하직원 100명은 기본입니다",
        "CEO 관상 발견! 명함에 '대표' 새길 준비하세요",
      ],
      r2: [
        "연애하면 상대가 헤어나올 수 없는 매력의 소유자",
        "사랑꾼 DNA 확정, 이성에게 인기 폭발합니다",
        "로맨틱한 관상, 드라마 주인공급 연애 예약",
      ],
      r3: [
        "돈이 알아서 따라오는 재물복 가득한 얼굴",
        "사업하면 대박, 투자하면 수익 보장 관상",
        "재테크 천재 기질, 부자 DNA 탑재 완료",
      ],
      r4: [
        "신뢰감 100%, 누구나 믿고 맡기는 관상",
        "책임감의 상징, 약속은 무조건 지키는 타입",
        "성실함이 얼굴에서 빛나는 진정한 믿음직이",
      ],
    },
    medium: { // 50-69점
      r1: [
        "숨겨진 카리스마, 때가 오면 빛날 리더입니다",
        "지금은 잠복기, 곧 터질 권력 운세를 가졌습니다",
        "노력하면 꼭대기에 오를 상, 멈추지 마세요",
      ],
      r2: [
        "사랑에 진심인 관상, 진정한 인연을 만납니다",
        "감정 지능 높은 상, 깊은 관계를 만드는 능력자",
        "연애 타이밍이 중요, 급하지 않게 기다리세요",
      ],
      r3: [
        "꾸준히 쌓이는 재물운, 대박보다 안정이 답",
        "사교성이 돈이 되는 관상, 인맥을 넓히세요",
        "노력형 부자 관상, 시간이 답이에요",
      ],
      r4: [
        "평균 이상의 신뢰감, 관계가 재산이 됩니다",
        "묵묵히 일하는 스타일, 결국 인정받습니다",
        "진정성이 강점, 가식 없는 매력을 가졌습니다",
      ],
    },
    low: { // 50점 미만
      r1: [
        "역경을 딛고 성공하는 드라마틱 관상입니다",
        "지금은 수련기, 강해지면 무서울 상입니다",
        "늦깎이 성공형, 포기하지 않으면 됩니다",
      ],
      r2: [
        "사랑에 신중한 관상, 한 번 선택하면 끝까지",
        "외유내강, 겉보다 속이 따뜻한 사람입니다",
        "감정 표현 연습하면 인기 폭발할 상입니다",
      ],
      r3: [
        "흙수저도 금수저로 바꾸는 근성 관상",
        "적은 것도 모으면 산, 티끌 모아 태산형",
        "기회를 잡는 눈이 있어요, 기다리세요",
      ],
      r4: [
        "진정성으로 승부하는 타입, 시간이 편입니다",
        "말보다 행동, 보여주는 게 강점입니다",
        "조용히 신뢰를 쌓는 관상, 결국 이깁니다",
      ],
    },
  };

  // 점수 구간 결정
  let tier: 'high' | 'medium' | 'low';
  if (score >= 70) tier = 'high';
  else if (score >= 50) tier = 'medium';
  else tier = 'low';

  // 결정적 인덱스 계산
  const lines = oneLiners[tier][dominantCat];
  const index = seed % lines.length;

  return lines[index];
}

// 점수에 따른 등급
function getScoreGrade(score: number): { grade: string; color: string; emoji: string } {
  if (score >= 85) return { grade: '대길', color: '#FFD700', emoji: '👑' };
  if (score >= 70) return { grade: '길', color: '#FF6B6B', emoji: '✨' };
  if (score >= 55) return { grade: '중길', color: '#4ECDC4', emoji: '💫' };
  if (score >= 40) return { grade: '소길', color: '#95E1D3', emoji: '🍀' };
  return { grade: '평', color: '#A8A8A8', emoji: '🌱' };
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

const KEY_POINTS = [33, 133, 362, 263, 159, 386, 70, 300, 107, 336, 1, 4, 5, 195, 61, 291, 0, 17, 152, 234, 454, 10];

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

  // 얼굴 랜드마크 그리기 (80% 확대, 투명 점)
  const drawFaceMesh = useCallback(() => {
    if (!canvasRef.current || !data?.imageData || !data?.landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const canvasSize = 400;
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // 얼굴 영역 계산 (랜드마크 기반)
      const landmarks = data.landmarks!;
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      landmarks.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });

      // 얼굴 크기 (픽셀)
      const faceWidth = (maxX - minX) * img.width;
      const faceHeight = (maxY - minY) * img.height;
      const faceCenterX = ((minX + maxX) / 2) * img.width;
      const faceCenterY = ((minY + maxY) / 2) * img.height;

      // 80% 채우기 위한 스케일 계산
      const targetSize = canvasSize * 0.8;
      const faceSize = Math.max(faceWidth, faceHeight);
      const scale = targetSize / faceSize;

      // 크롭 영역 계산
      const sourceSize = canvasSize / scale;
      const sx = faceCenterX - sourceSize / 2;
      const sy = faceCenterY - sourceSize / 2;

      // 배경 (검정)
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // 원형 마스크
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 10, 0, Math.PI * 2);
      ctx.clip();

      // 이미지 그리기 (80% 확대)
      ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, canvasSize, canvasSize);

      // 랜드마크 좌표 변환
      const transformPoint = (idx: number) => {
        const [lx, ly] = landmarks[idx];
        const x = (lx * img.width - sx) * scale;
        const y = (ly * img.height - sy) * scale;
        return { x, y };
      };

      // 연결선 그리기 (투명도 적용)
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;

      const drawConnections = (indices: number[]) => {
        ctx.beginPath();
        for (let i = 0; i < indices.length; i++) {
          if (indices[i] >= landmarks.length) continue;
          const point = transformPoint(indices[i]);
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      };

      Object.values(FACE_CONNECTIONS).forEach(connection => {
        drawConnections(connection);
      });

      // 주요 포인트 (50% 투명도, 얼굴 크기에 비례)
      const pointSize = Math.max(2, (faceSize / img.width) * 8);
      ctx.globalAlpha = 0.5;
      KEY_POINTS.forEach(idx => {
        if (idx >= landmarks.length) return;
        const point = transformPoint(idx);
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00ff';
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.restore();

      // 원형 테두리
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 4;
      ctx.stroke();
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
        // 얼굴 영역 계산
        const landmarks = data.landmarks;
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        landmarks.forEach(([x, y]) => {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        });

        const faceWidth = (maxX - minX) * img.width;
        const faceHeight = (maxY - minY) * img.height;
        const faceCenterX = ((minX + maxX) / 2) * img.width;
        const faceCenterY = ((minY + maxY) / 2) * img.height;

        const targetSize = faceSize * 0.8;
        const sourceFaceSize = Math.max(faceWidth, faceHeight);
        const scale = targetSize / sourceFaceSize;
        const sourceSize = faceSize / scale;

        const sx = faceCenterX - sourceSize / 2;
        const sy = faceCenterY - sourceSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(540, faceY, faceSize / 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 540 - faceSize/2, faceY - faceSize/2, faceSize, faceSize);

        // 랜드마크 그리기
        const transformPoint = (idx: number) => {
          const [lx, ly] = landmarks[idx];
          const x = (lx * img.width - sx) * scale + (540 - faceSize/2);
          const y = (ly * img.height - sy) * scale + (faceY - faceSize/2);
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
