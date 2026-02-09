'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// 이 페이지는 sessionStorage 기반 폴백용입니다.
// 새로운 공유 가능한 결과는 /face-analysis/result/[code]로 리다이렉트됩니다.

interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

interface FaceAnalysisResult {
  facecode: string;
  score: number;
  panAngle: number;
  tiltAngle: number;
  rollAngle: number;
  categories: {
    r1: number;
    r2: number;
    r3: number;
    r4: number;
  };
  analysis: {
    eyeAngle: { label: string; description: string };
    eyebrowDistance: { label: string; description: string };
    noseLength: { label: string; description: string };
    philtrumLength: { label: string; description: string };
    mouthWidth: { label: string; description: string };
    jawWidth: { label: string; description: string };
    eyeSize: { label: string; description: string };
  };
  summary: string;
  recommendations: string[];
  gender: 'male' | 'female';
}

// 자극적이고 유쾌한 한줄평 생성
function generateCatchyOneLiner(result: FaceAnalysisResult): string {
  const score = result.score;
  const { r1, r2, r3, r4 } = result.categories;
  const maxCat = Math.max(r1, r2, r3, r4);

  // 점수별 기본 멘트
  const scoreLines: Record<string, string[]> = {
    high: [
      "이 얼굴로 태어난 건 전생에 나라를 구했나봐요 🔥",
      "관상쟁이가 울고 갈 완벽한 얼굴이시네요 ✨",
      "조선시대였으면 왕족 상이에요 진짜로 👑",
      "이 관상으로 실패하면 그건 운이 아니라 노력 문제 💀",
      "혹시 거울 보면서 뿌듯해하시죠? 당연한 거예요 🪞",
    ],
    medium: [
      "평균 이상의 관상... 노력하면 대박 터질 상이에요 💪",
      "이 얼굴이면 인생 한 번은 크게 터져요 🎰",
      "80% 노력 + 20% 이 얼굴 = 성공 공식 완성 📈",
      "운이 없어서 안 되는 게 아니라 아직 때가 안 된 거예요 ⏰",
      "숨겨진 복이 있는 상... 언제 터질지 모르니 준비하세요 🎁",
    ],
    low: [
      "관상? 그딴 거 다 극복하는 게 진짜 인생이에요 💥",
      "노력으로 운명을 비트는 스타일이시네요 🔄",
      "이 관상에서 성공하면 드라마 주인공급 스토리 🎬",
      "흙수저에서 금수저 만드는 상... 존경합니다 🥄➡️🥇",
      "역경을 딛고 일어나는 피닉스 관상이에요 🦅",
    ],
  };

  // 카테고리별 특화 멘트
  const catLines: Record<string, string[]> = {
    r1: [ // 권력/운명
      "CEO 관상 발견! 명함에 '대표' 새길 준비하세요 💼",
      "카리스마가 얼굴에서 뿜뿜... 리더 DNA 확인 👔",
      "이 눈빛은 부하직원 100명 거느릴 상이에요 👀",
    ],
    r2: [ // 정신/사랑
      "연애 시작하면 상대가 못 빠져나가는 상이에요 💘",
      "이 관상이면 고백 성공률 87% 보장 💕",
      "사랑꾼 DNA... 솔로라면 그건 선택인 거죠? 🎯",
    ],
    r3: [ // 일/재물
      "돈이 알아서 따라오는 얼굴이네요 💰",
      "재물운 MAX... 로또보다 사업 추천드려요 📊",
      "이 관상에 가난하면 그건 버그예요 🐛💵",
    ],
    r4: [ // 성실/책임
      "믿음직한 얼굴... 사기꾼과 정반대 상이에요 🤝",
      "주변 사람들이 다 믿고 의지하는 상이네요 🏔️",
      "약속 잘 지키시죠? 얼굴에 다 써있어요 📝",
    ],
  };

  // 점수 구간 결정
  let tier: 'high' | 'medium' | 'low';
  if (score >= 70) tier = 'high';
  else if (score >= 45) tier = 'medium';
  else tier = 'low';

  // 50% 확률로 점수 기반, 50% 확률로 카테고리 기반
  const useScore = Math.random() > 0.5;

  if (useScore) {
    const lines = scoreLines[tier];
    return lines[Math.floor(Math.random() * lines.length)];
  } else {
    let catKey: 'r1' | 'r2' | 'r3' | 'r4' = 'r1';
    if (maxCat === r1) catKey = 'r1';
    else if (maxCat === r2) catKey = 'r2';
    else if (maxCat === r3) catKey = 'r3';
    else catKey = 'r4';

    const lines = catLines[catKey];
    return lines[Math.floor(Math.random() * lines.length)];
  }
}

// 점수에 따른 등급
function getScoreGrade(score: number): { grade: string; color: string; emoji: string; bgGradient: string } {
  if (score >= 85) return { grade: '대길', color: '#FFD700', emoji: '👑', bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
  if (score >= 70) return { grade: '길', color: '#FF6B6B', emoji: '✨', bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' };
  if (score >= 55) return { grade: '중길', color: '#4ECDC4', emoji: '💫', bgGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' };
  if (score >= 40) return { grade: '소길', color: '#95E1D3', emoji: '🍀', bgGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' };
  return { grade: '평', color: '#A8A8A8', emoji: '🌱', bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' };
}

// MediaPipe 랜드마크에서 주요 포인트 연결선 정의
const FACE_CONNECTIONS = {
  // 얼굴 윤곽
  silhouette: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10],
  // 왼쪽 눈
  leftEye: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33],
  // 오른쪽 눈
  rightEye: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362],
  // 왼쪽 눈썹
  leftEyebrow: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  // 오른쪽 눈썹
  rightEyebrow: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  // 코
  nose: [168, 6, 197, 195, 5, 4, 1, 19, 94, 2],
  // 입술 외곽
  lipsOuter: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61],
  // 입술 내곽
  lipsInner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78],
};

// 주요 분석 포인트 (점 표시용)
const KEY_POINTS = [
  // 눈
  33, 133, 362, 263,  // 눈 꼬리
  159, 386,  // 눈 중앙
  // 눈썹
  70, 300, 107, 336,
  // 코
  1, 4, 5, 195,
  // 입
  61, 291, 0, 17,
  // 턱
  152, 234, 454,
  // 이마
  10,
];

export default function FaceAnalysisResultPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);

  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<FaceLandmark[] | null>(null);
  const [oneLiner, setOneLiner] = useState<string>('');
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [shareCardUrl, setShareCardUrl] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    const savedData = sessionStorage.getItem('faceAnalysisResult');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setResult(parsed.result);
      setImage(parsed.image);
      setLandmarks(parsed.landmarks);

      // 한줄평 생성
      if (parsed.result) {
        setOneLiner(generateCatchyOneLiner(parsed.result));
      }
    }
  }, []);

  // 얼굴 랜드마크 그리기
  const drawFaceMesh = useCallback(() => {
    if (!canvasRef.current || !image || !landmarks) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // 캔버스 크기를 정사각형으로 (인스타그램 스타일)
      const size = Math.min(img.width, img.height);
      const scale = 400 / size; // 표시용 크기
      canvas.width = 400;
      canvas.height = 400;

      // 이미지 중앙 크롭
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;

      ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);

      // 랜드마크 좌표 변환
      const transformPoint = (idx: number) => {
        const lm = landmarks[idx];
        const x = (lm.x * img.width - sx) * scale;
        const y = (lm.y * img.height - sy) * scale;
        return { x, y };
      };

      // 연결선 그리기 (네온 효과)
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'cyan';
      ctx.shadowBlur = 10;

      const drawConnections = (indices: number[]) => {
        ctx.beginPath();
        for (let i = 0; i < indices.length; i++) {
          const point = transformPoint(indices[i]);
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        }
        ctx.stroke();
      };

      // 주요 연결선만 그리기
      Object.values(FACE_CONNECTIONS).forEach(connection => {
        drawConnections(connection);
      });

      // 주요 포인트 그리기
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ff00ff';
      KEY_POINTS.forEach(idx => {
        const point = transformPoint(idx);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00ff';
        ctx.fill();
      });

      ctx.shadowBlur = 0;
    };
    img.src = image;
  }, [image, landmarks]);

  useEffect(() => {
    drawFaceMesh();
  }, [drawFaceMesh]);

  // 인스타그램 공유 카드 생성 (1080x1080)
  const generateShareCard = useCallback(async () => {
    if (!shareCanvasRef.current || !image || !landmarks || !result) return;

    setIsGeneratingCard(true);

    const canvas = shareCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    const { emoji, grade } = getScoreGrade(result.score);

    // 배경 그라데이션
    const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
    if (result.score >= 70) {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(0.5, '#16213e');
      gradient.addColorStop(1, '#0f3460');
    } else {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
    }
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

    // 얼굴 이미지 + 랜드마크 (원형 마스크)
    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.src = image;
    });

    const faceSize = 380;
    const faceX = 540;
    const faceY = 320;

    // 원형 클리핑
    ctx.save();
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // 이미지 그리기 (중앙 크롭)
    const imgSize = Math.min(img.width, img.height);
    const sx = (img.width - imgSize) / 2;
    const sy = (img.height - imgSize) / 2;
    ctx.drawImage(img, sx, sy, imgSize, imgSize, faceX - faceSize/2, faceY - faceSize/2, faceSize, faceSize);

    // 랜드마크 그리기
    const transformPoint = (idx: number) => {
      const lm = landmarks[idx];
      const scale = faceSize / imgSize;
      const x = (lm.x * img.width - sx) * scale + (faceX - faceSize/2);
      const y = (lm.y * img.height - sy) * scale + (faceY - faceSize/2);
      return { x, y };
    };

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 15;

    const drawConnections = (indices: number[]) => {
      ctx.beginPath();
      for (let i = 0; i < indices.length; i++) {
        const point = transformPoint(indices[i]);
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
      ctx.stroke();
    };

    Object.values(FACE_CONNECTIONS).forEach(connection => {
      drawConnections(connection);
    });

    ctx.shadowColor = '#ff00ff';
    KEY_POINTS.forEach(idx => {
      const point = transformPoint(idx);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff00ff';
      ctx.fill();
    });

    ctx.restore();

    // 원형 테두리
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(faceX, faceY, faceSize / 2 + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 상단: 로고/타이틀
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔮 AI 관상 분석', 540, 60);

    // 점수 배지
    const badgeY = faceY + faceSize/2 + 50;

    // 점수 원
    const scoreGradient = ctx.createRadialGradient(540, badgeY + 40, 0, 540, badgeY + 40, 80);
    scoreGradient.addColorStop(0, result.score >= 70 ? '#ff6b6b' : result.score >= 50 ? '#4ecdc4' : '#95a5a6');
    scoreGradient.addColorStop(1, result.score >= 70 ? '#ee5a24' : result.score >= 50 ? '#1abc9c' : '#7f8c8d');

    ctx.beginPath();
    ctx.arc(540, badgeY + 40, 60, 0, Math.PI * 2);
    ctx.fillStyle = scoreGradient;
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(result.score.toString(), 540, badgeY + 55);
    ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('점', 540, badgeY + 80);

    // 등급
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(`${emoji} ${grade}`, 540, badgeY + 130);

    // 한줄평 (핵심!)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif';

    // 텍스트 줄바꿈 처리
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

    // 하단: 워터마크
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('unyeoni.com', 540, 1040);

    // 카드 URL 생성
    const dataUrl = canvas.toDataURL('image/png');
    setShareCardUrl(dataUrl);
    setIsGeneratingCard(false);
  }, [image, landmarks, result, oneLiner]);

  // 카드 다운로드
  const downloadCard = () => {
    if (!shareCardUrl) return;
    const link = document.createElement('a');
    link.download = `관상분석_${result?.score}점.png`;
    link.href = shareCardUrl;
    link.click();
  };

  // 카드 공유 (Web Share API)
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
        // 폴백: 다운로드
        downloadCard();
      }
    } catch (err) {
      console.error('Share failed:', err);
      downloadCard();
    }
  };

  // 한줄평 새로고침
  const refreshOneLiner = () => {
    if (result) {
      setOneLiner(generateCatchyOneLiner(result));
      setShareCardUrl(null); // 카드 재생성 필요
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-purple-900">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-pulse">🔮</div>
          <p className="text-lg mb-6">결과를 불러오는 중...</p>
          <button
            onClick={() => router.push('/face-analysis')}
            className="px-6 py-3 bg-white/20 rounded-full hover:bg-white/30 transition-all"
          >
            다시 분석하기
          </button>
        </div>
      </div>
    );
  }

  const { grade, emoji } = getScoreGrade(result.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-lg">

        {/* 얼굴 + 랜드마크 시각화 */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-purple-500/20 rounded-3xl blur-xl"></div>
          <div className="relative bg-black/40 backdrop-blur-xl rounded-3xl p-4 border border-white/10">
            <canvas
              ref={canvasRef}
              className="w-full aspect-square rounded-2xl"
              style={{ maxWidth: '400px', margin: '0 auto', display: 'block' }}
            />

            {/* 오버레이 정보 */}
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur px-4 py-2 rounded-full">
                <span className="text-2xl">{emoji}</span>
                <span className="text-white font-bold text-xl">{result.score}점</span>
                <span className="text-white/70">|</span>
                <span className="text-white font-medium">{grade}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 한줄평 카드 */}
        <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur rounded-2xl p-6 mb-6 border border-white/10">
          <div className="flex justify-between items-start mb-3">
            <span className="text-pink-400 text-sm font-medium">✨ 오늘의 관상 한줄평</span>
            <button
              onClick={refreshOneLiner}
              className="text-white/50 hover:text-white/80 text-sm"
            >
              🔄 다른 멘트
            </button>
          </div>
          <p className="text-white text-xl font-bold leading-relaxed">
            {oneLiner}
          </p>
        </div>

        {/* 공유 카드 생성/다운로드 */}
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
            <div className="px-6 pb-6 space-y-4">
              {Object.entries(result.analysis).map(([key, value]) => (
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
                  <div className="text-white font-medium mb-2">{value.label}</div>
                  <div className="text-white/60 text-sm">{value.description}</div>
                </div>
              ))}
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

        {/* 면책 조항 */}
        <div className="text-center text-white/40 text-xs">
          🔮 AI 관상 분석은 재미로만 참고해주세요
        </div>
      </div>

      {/* 숨겨진 공유 카드 캔버스 */}
      <canvas ref={shareCanvasRef} className="hidden" />
    </div>
  );
}
