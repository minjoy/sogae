'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FaceAnalysisToggle from '@/components/FaceAnalysisToggle';

// MediaPipe 타입 선언
declare global {
  interface Window {
    FaceMesh: new (config: { locateFile: (file: string) => string }) => MediaPipeFaceMesh;
  }
}

interface MediaPipeFaceMesh {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  initialize: () => Promise<void>;
  send: (input: { image: HTMLVideoElement | HTMLImageElement }) => Promise<void>;
}

interface MediaPipeResults {
  multiFaceLandmarks?: FaceLandmark[][];
}

interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

interface PersonData {
  image: string | null;
  landmarks: FaceLandmark[] | null;
  imageWidth: number;
  imageHeight: number;
}

export default function CompatibilityPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'intro' | 'male' | 'female' | 'analyzing'>('intro');
  const [maleData, setMaleData] = useState<PersonData>({ image: null, landmarks: null, imageWidth: 0, imageHeight: 0 });
  const [femaleData, setFemaleData] = useState<PersonData>({ image: null, landmarks: null, imageWidth: 0, imageHeight: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceMeshLoaded, setFaceMeshLoaded] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [showDonationPopup, setShowDonationPopup] = useState(false);

  const faceMeshRef = useRef<MediaPipeFaceMesh | null>(null);

  // MediaPipe 스크립트 로드
  useEffect(() => {
    const loadScripts = async () => {
      if (typeof window !== 'undefined' && !window.FaceMesh) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      if (window.FaceMesh && !faceMeshRef.current) {
        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        await faceMesh.initialize();
        faceMeshRef.current = faceMesh;
        setFaceMeshLoaded(true);
      }
    };
    loadScripts();
  }, []);

  // 이미지 처리 함수
  const processImage = useCallback(async (
    file: File,
    onSuccess: (data: PersonData) => void
  ) => {
    if (!faceMeshRef.current) {
      setError('얼굴 인식 시스템을 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        // 얼굴 인식
        let detectedLandmarks: FaceLandmark[] | null = null;

        faceMeshRef.current!.onResults((results: MediaPipeResults) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            detectedLandmarks = results.multiFaceLandmarks[0];
          }
        });

        await faceMeshRef.current!.send({ image: img });

        // 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 300));

        if (!detectedLandmarks) {
          setError('얼굴을 인식하지 못했습니다. 얼굴이 잘 보이는 정면 사진을 사용해주세요.');
          setIsLoading(false);
          return;
        }

        // 이미지 리사이즈 (600x600)
        const canvas = document.createElement('canvas');
        const targetSize = 600;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d')!;

        const scale = Math.min(targetSize / img.width, targetSize / img.height);
        const x = (targetSize - img.width * scale) / 2;
        const y = (targetSize - img.height * scale) / 2;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        const resizedImage = canvas.toDataURL('image/jpeg', 0.8);

        onSuccess({
          image: resizedImage,
          landmarks: detectedLandmarks,
          imageWidth: img.width,
          imageHeight: img.height,
        });
        setIsLoading(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentStep = step;
    processImage(file, (data) => {
      if (currentStep === 'male') {
        setMaleData(data);
        setStep('female');
      } else if (currentStep === 'female') {
        setFemaleData(data);
        handleAnalyze(maleData, data);
      }
    });

    // input 초기화 (같은 파일 재선택 가능하게)
    e.target.value = '';
  }, [step, maleData, processImage]);

  // 분석 실행
  const handleAnalyze = async (male: PersonData, female: PersonData) => {
    setStep('analyzing');
    setAnalysisProgress(0);

    // 분석 진행 애니메이션
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      const response = await fetch('/api/face/compatibility/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          male: {
            landmarks: male.landmarks,
            imageWidth: male.imageWidth,
            imageHeight: male.imageHeight,
            imageData: male.image,
          },
          female: {
            landmarks: female.landmarks,
            imageWidth: female.imageWidth,
            imageHeight: female.imageHeight,
            imageData: female.image,
          },
        }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        throw new Error('분석에 실패했습니다.');
      }

      const result = await response.json();

      // 결과 페이지로 이동
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push(`/face-analysis/compatibility/result/${result.shareCode}`);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
      setStep('intro');
    }
  };

  // 처음으로 돌아가기
  const handleReset = () => {
    setStep('intro');
    setMaleData({ image: null, landmarks: null, imageWidth: 0, imageHeight: 0 });
    setFemaleData({ image: null, landmarks: null, imageWidth: 0, imageHeight: 0 });
    setError(null);
  };

  // 분석 단계별 텍스트
  const analysisSteps = [
    '두 분의 관상을 분석하고 있습니다...',
    '오행의 기운을 파악하고 있습니다...',
    '감정적 궁합을 계산하고 있습니다...',
    '가치관 조화도를 분석하고 있습니다...',
    '서로의 강점을 찾고 있습니다...',
    '배려 포인트를 정리하고 있습니다...',
    '운명적 메시지를 작성하고 있습니다...',
  ];

  const currentAnalysisStep = Math.min(
    Math.floor(analysisProgress / 15),
    analysisSteps.length - 1
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* 후원 팝업 */}
      {showDonationPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDonationPopup(false)}
          />
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 max-w-sm w-full border border-white/10 shadow-2xl">
            <button
              onClick={() => setShowDonationPopup(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
            <div className="text-center space-y-4">
              <div className="text-4xl">☕️</div>
              <div>
                <p className="text-white/90 font-medium text-sm leading-relaxed">
                  이 서비스는 무료로 운영되고 있어요
                </p>
                <p className="text-white/60 text-xs mt-2 leading-relaxed">
                  혼자서 밤늦게까지 만든 작은 서비스입니다.<br/>
                  재미있게 즐기셨다면, 개발자에게<br/>
                  따뜻한 커피 한 잔을 선물해주세요 🙏
                </p>
              </div>
              <a
                href="https://litt.ly/miniface"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
              >
                <span>☕️</span>
                <span>커피 한 잔 후원하기</span>
              </a>
              <p className="text-white/40 text-xs">
                작은 응원이 큰 힘이 됩니다
              </p>
              <button
                onClick={() => setShowDonationPopup(false)}
                className="w-full py-3 bg-white/10 text-white/70 rounded-xl hover:bg-white/20 transition-colors text-sm"
              >
                다음에 할게요
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 헤더 */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-white/60 hover:text-white transition-colors"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg font-bold text-white">두 사람 궁합 분석</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* 페이지 전환 토글 */}
        {step === 'intro' && <FaceAnalysisToggle variant="dark" />}

        {/* 소개 화면 */}
        {step === 'intro' && (
          <div className="space-y-6">
            {/* 타이틀 카드 */}
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur rounded-3xl p-6 border border-pink-500/30 text-center">
              <div className="text-5xl mb-4">💕</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                관상으로 보는 두 사람의 인연
              </h2>
              <p className="text-white/70 text-sm leading-relaxed">
                전통 관상학과 오행 이론을 바탕으로<br/>
                두 분의 깊은 인연을 분석해드립니다
              </p>
            </div>

            {/* 분석 내용 안내 */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">분석 내용</h3>
              <div className="space-y-3">
                {[
                  { emoji: '☯️', title: '오행 궁합', desc: '목·화·토·금·수 상생상극 분석' },
                  { emoji: '💝', title: '감정 교감도', desc: '소통, 공감, 이해 능력 분석' },
                  { emoji: '🎯', title: '가치관 조화', desc: '인생관, 삶의 우선순위 비교' },
                  { emoji: '⚠️', title: '주의할 점', desc: '갈등 포인트 및 해결 방법' },
                  { emoji: '💌', title: '배려 포인트', desc: '서로에게 필요한 배려 안내' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <p className="text-white font-medium text-sm">{item.title}</p>
                      <p className="text-white/50 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 개인정보 동의 */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-white/30 bg-white/10 text-pink-500 focus:ring-pink-500"
                />
                <div className="text-sm">
                  <p className="text-white/90">개인정보 수집 및 이용에 동의합니다</p>
                  <p className="text-white/50 text-xs mt-1">
                    수집항목: 얼굴 이미지, 분석 결과<br/>
                    보유기간: 7일 후 자동 삭제<br/>
                    이미지는 외부로 전송되지 않습니다
                  </p>
                </div>
              </label>
            </div>

            {/* 시작 버튼 */}
            <button
              onClick={() => {
                if (privacyConsent) {
                  setError(null);
                  setStep('male');
                  setShowDonationPopup(true);
                } else {
                  setError('개인정보 수집에 동의해주세요.');
                }
              }}
              disabled={!faceMeshLoaded}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                faceMeshLoaded && privacyConsent
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 shadow-lg shadow-pink-500/25'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              {faceMeshLoaded ? '💕 궁합 분석 시작하기' : '로딩 중...'}
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>
        )}

        {/* 남자 사진 업로드 */}
        {step === 'male' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm mb-4">
                <span>1/2</span>
                <span>남자분 사진</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                👨 남자분 사진을 올려주세요
              </h2>
              <p className="text-white/60 text-sm">
                정면이 잘 보이는 사진이 좋아요
              </p>
            </div>

            {/* 사진 업로드 영역 */}
            <div
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center ${
                isLoading
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-white/30 hover:border-blue-400 hover:bg-blue-500/10'
              }`}
            >
              {isLoading ? (
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/70 text-sm">얼굴 인식 중...</p>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-white font-medium text-sm mb-1">사진 선택하기</p>
                  <p className="text-white/50 text-xs">탭하여 갤러리에서 선택</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 text-xs mt-2 underline"
                >
                  다시 시도
                </button>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3 bg-white/10 text-white/70 rounded-xl hover:bg-white/20 transition-colors"
            >
              처음으로
            </button>
          </div>
        )}

        {/* 여자 사진 업로드 */}
        {step === 'female' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-pink-500/20 text-pink-300 px-4 py-2 rounded-full text-sm mb-4">
                <span>2/2</span>
                <span>여자분 사진</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                👩 여자분 사진을 올려주세요
              </h2>
              <p className="text-white/60 text-sm">
                정면이 잘 보이는 사진이 좋아요
              </p>
            </div>

            {/* 남자 사진 미리보기 */}
            {maleData.image && (
              <div className="flex items-center gap-4 bg-white/5 rounded-xl p-3">
                <img
                  src={maleData.image}
                  alt="남자"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
                />
                <div>
                  <p className="text-white text-sm font-medium">남자분 사진 등록 완료</p>
                  <p className="text-white/50 text-xs">얼굴 인식 성공</p>
                </div>
                <span className="ml-auto text-green-400">✓</span>
              </div>
            )}

            {/* 사진 업로드 영역 */}
            <div
              onClick={() => !isLoading && fileInputRef.current?.click()}
              className={`h-40 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center ${
                isLoading
                  ? 'border-pink-500/50 bg-pink-500/10'
                  : 'border-white/30 hover:border-pink-400 hover:bg-pink-500/10'
              }`}
            >
              {isLoading ? (
                <div className="text-center">
                  <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white/70 text-sm">얼굴 인식 중...</p>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-2">📸</div>
                  <p className="text-white font-medium text-sm mb-1">사진 선택하기</p>
                  <p className="text-white/50 text-xs">탭하여 갤러리에서 선택</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-300 text-sm">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 text-xs mt-2 underline"
                >
                  다시 시도
                </button>
              </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-3 bg-white/10 text-white/70 rounded-xl hover:bg-white/20 transition-colors"
            >
              처음으로
            </button>
          </div>
        )}

        {/* 분석 중 */}
        {step === 'analyzing' && (
          <div className="space-y-8 py-12">
            <div className="text-center">
              <div className="text-6xl mb-6 animate-pulse">💕</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                궁합을 분석하고 있어요
              </h2>
              <p className="text-white/60 text-sm">
                두 분의 인연을 꼼꼼히 살펴보는 중...
              </p>
            </div>

            {/* 두 사람 사진 */}
            <div className="flex items-center justify-center gap-4">
              {maleData.image && (
                <img
                  src={maleData.image}
                  alt="남자"
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-400 shadow-lg shadow-blue-500/25"
                />
              )}
              <div className="text-3xl animate-pulse">💕</div>
              {femaleData.image && (
                <img
                  src={femaleData.image}
                  alt="여자"
                  className="w-24 h-24 rounded-full object-cover border-4 border-pink-400 shadow-lg shadow-pink-500/25"
                />
              )}
            </div>

            {/* 진행률 */}
            <div className="space-y-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <p className="text-white/70 text-sm text-center animate-pulse">
                {analysisSteps[currentAnalysisStep]}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
