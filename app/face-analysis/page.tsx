'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// MediaPipe 타입 선언
declare global {
  interface Window {
    FaceMesh: new (config: { locateFile: (file: string) => string }) => MediaPipeFaceMesh;
    Camera: new (video: HTMLVideoElement, config: { onFrame: () => Promise<void>; width: number; height: number }) => MediaPipeCamera;
  }
}

interface MediaPipeFaceMesh {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  initialize: () => Promise<void>;
  send: (input: { image: HTMLVideoElement | HTMLImageElement }) => Promise<void>;
}

interface MediaPipeCamera {
  start: () => void;
  stop: () => void;
}

interface MediaPipeResults {
  multiFaceLandmarks?: FaceLandmark[][];
}

interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export default function FaceAnalysisPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceMeshLoaded, setFaceMeshLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<FaceLandmark[] | null>(null);

  const faceMeshRef = useRef<MediaPipeFaceMesh | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);

  // MediaPipe 스크립트 로드
  useEffect(() => {
    const loadScripts = async () => {
      // @mediapipe/face_mesh CDN
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
      ];

      for (const src of scripts) {
        await new Promise<void>((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.crossOrigin = 'anonymous';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load ${src}`));
          document.head.appendChild(script);
        });
      }

      setFaceMeshLoaded(true);
    };

    loadScripts().catch(err => {
      console.error('Failed to load MediaPipe:', err);
      setError('얼굴 인식 라이브러리 로드에 실패했습니다.');
    });
  }, []);

  // FaceMesh 초기화
  const initFaceMesh = useCallback(async () => {
    if (!window.FaceMesh || faceMeshRef.current) return;

    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults((results: MediaPipeResults) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
        setLandmarks(results.multiFaceLandmarks[0]);
      }
    });

    await faceMesh.initialize();
    faceMeshRef.current = faceMesh;
  }, []);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    if (!videoRef.current || !faceMeshLoaded) return;

    try {
      await initFaceMesh();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (window.Camera && faceMeshRef.current) {
        cameraRef.current = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        cameraRef.current.start();
      }

    } catch (err) {
      console.error('Camera error:', err);
      setError('카메라 접근 권한이 필요합니다.');
    }
  }, [faceMeshLoaded, initFaceMesh]);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setLandmarks(null);
  }, []);

  // 모드 변경
  useEffect(() => {
    if (mode === 'camera' && faceMeshLoaded) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [mode, faceMeshLoaded, startCamera, stopCamera]);

  // 랜드마크로 분석
  const analyzeWithLandmarks = useCallback(async (
    faceLandmarks: FaceLandmark[],
    imageWidth: number,
    imageHeight: number,
    imageData?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/face/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarks: faceLandmarks,
          imageWidth,
          imageHeight,
          gender,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 결과를 sessionStorage에 저장 (랜드마크 포함)
        sessionStorage.setItem('faceAnalysisResult', JSON.stringify({
          result: data.result,
          image: imageData || capturedImage,
          landmarks: faceLandmarks,
          imageWidth,
          imageHeight,
          gender,
        }));
        router.push('/face-analysis/result');
      } else {
        setError(data.error || '분석에 실패했습니다.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('서버 연결에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [gender, capturedImage, router]);

  // 사진 촬영
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !landmarks) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
    setMode('select');

    // 분석 실행 (이미지 데이터 직접 전달)
    await analyzeWithLandmarks(landmarks, video.videoWidth, video.videoHeight, imageData);
  }, [landmarks, stopCamera, analyzeWithLandmarks]);

  // 파일 업로드 처리
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      await initFaceMesh();

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
        img.src = URL.createObjectURL(file);
      });

      setCapturedImage(img.src);

      // 캔버스에 이미지 그리기
      if (canvasRef.current && faceMeshRef.current) {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }

        // FaceMesh로 분석
        let detectedLandmarks: FaceLandmark[] | null = null;
        faceMeshRef.current.onResults((results: MediaPipeResults) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks[0]) {
            detectedLandmarks = results.multiFaceLandmarks[0];
          }
        });

        await faceMeshRef.current.send({ image: img });

        // 잠시 대기 후 결과 확인
        await new Promise(resolve => setTimeout(resolve, 500));

        if (detectedLandmarks) {
          // 캔버스에서 이미지 데이터 추출
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          await analyzeWithLandmarks(detectedLandmarks, img.width, img.height, imageData);
        } else {
          setError('얼굴을 찾을 수 없습니다. 다른 사진을 시도해주세요.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      setError('이미지 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [initFaceMesh, analyzeWithLandmarks]);

  // 선택 화면
  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="container mx-auto px-4 py-8 max-w-lg">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔮</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 관상 분석</h1>
            <p className="text-gray-600">
              얼굴 특징을 분석하여 성격과 운세를 알려드려요
            </p>
          </div>

          {/* 성별 선택 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">성별 선택</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setGender('male')}
                className={`py-4 rounded-xl font-semibold transition-all ${
                  gender === 'male'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl block mb-1">👨</span>
                남성
              </button>
              <button
                onClick={() => setGender('female')}
                className={`py-4 rounded-xl font-semibold transition-all ${
                  gender === 'female'
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl block mb-1">👩</span>
                여성
              </button>
            </div>
          </div>

          {/* 분석 방법 선택 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">분석 방법 선택</h3>
            <div className="space-y-4">
              <button
                onClick={() => setMode('camera')}
                disabled={!faceMeshLoaded}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <span className="text-2xl block mb-1">📸</span>
                카메라로 촬영하기
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!faceMeshLoaded}
                className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                <span className="text-2xl block mb-1">🖼️</span>
                사진 업로드하기
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* 로딩 상태 */}
          {(!faceMeshLoaded || isLoading) && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent mb-2"></div>
              <p className="text-gray-600">
                {isLoading ? '얼굴 분석 중...' : '얼굴 인식 준비 중...'}
              </p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* 안내 */}
          <div className="bg-white/80 backdrop-blur rounded-xl p-5 mt-6">
            <h4 className="font-semibold text-gray-800 mb-3">📌 정확한 분석을 위한 팁</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                정면을 바라보며 자연스러운 표정을 유지해주세요
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                조명이 밝은 곳에서 촬영하면 더 정확해요
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500">•</span>
                머리카락이 이마나 눈을 가리지 않도록 해주세요
              </li>
            </ul>
          </div>
        </div>

        {/* 숨겨진 캔버스 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // 카메라 모드
  if (mode === 'camera') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* 비디오 영역 */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* 얼굴 가이드 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-64 h-80 border-4 rounded-[50%] transition-colors ${
              landmarks ? 'border-green-500' : 'border-white/50'
            }`} />
          </div>

          {/* 상태 표시 */}
          <div className="absolute top-4 left-0 right-0 text-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              landmarks
                ? 'bg-green-500 text-white'
                : 'bg-white/80 text-gray-800'
            }`}>
              {landmarks ? '얼굴 인식됨 - 촬영 가능' : '얼굴을 가이드에 맞춰주세요'}
            </span>
          </div>
        </div>

        {/* 컨트롤 영역 */}
        <div className="bg-black/90 p-6">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => {
                stopCamera();
                setMode('select');
              }}
              className="p-4 rounded-full bg-gray-700 text-white"
            >
              ✕
            </button>
            <button
              onClick={capturePhoto}
              disabled={!landmarks}
              className={`w-20 h-20 rounded-full border-4 transition-all ${
                landmarks
                  ? 'bg-white border-green-500 hover:scale-105'
                  : 'bg-gray-600 border-gray-500 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl">{landmarks ? '📸' : '🔍'}</span>
            </button>
            <button
              onClick={() => {
                // 전면/후면 카메라 전환 (모바일)
              }}
              className="p-4 rounded-full bg-gray-700 text-white"
            >
              🔄
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return null;
}
