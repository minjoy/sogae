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

// 분석 결과 유효성 검사 함수
interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

function validateAnalysisResult(
  panAngle: number,
  tiltAngle: number,
  rollAngle: number,
  faceLandmarks: FaceLandmark[],
  imageWidth: number,
  imageHeight: number
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // 1. 얼굴 회전 각도 검사 (40도 초과 시 경고)
  const MAX_ROTATION_ANGLE = 40;

  if (Math.abs(panAngle) > MAX_ROTATION_ANGLE) {
    warnings.push(`얼굴이 좌우로 ${Math.abs(panAngle).toFixed(0)}° 돌아가 있습니다. 정면을 바라보면 더 정확한 분석이 가능합니다.`);
  } else if (Math.abs(panAngle) > 25) {
    warnings.push(`얼굴이 약간 옆으로 돌아가 있어 일부 측정값이 보정되었습니다.`);
  }

  if (Math.abs(tiltAngle) > MAX_ROTATION_ANGLE) {
    warnings.push(`얼굴이 위/아래로 ${Math.abs(tiltAngle).toFixed(0)}° 기울어져 있습니다. 정면을 바라보면 더 정확한 분석이 가능합니다.`);
  }

  if (Math.abs(rollAngle) > 20) {
    warnings.push(`얼굴이 ${Math.abs(rollAngle).toFixed(0)}° 기울어져 있습니다.`);
  }

  // 2. 얼굴 크기 검사 (실제 픽셀 크기 기준)
  if (faceLandmarks && faceLandmarks.length > 0) {
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    faceLandmarks.forEach(lm => {
      minX = Math.min(minX, lm.x);
      maxX = Math.max(maxX, lm.x);
      minY = Math.min(minY, lm.y);
      maxY = Math.max(maxY, lm.y);
    });

    const faceWidthRatio = maxX - minX;
    const faceHeightRatio = maxY - minY;

    // 실제 얼굴 픽셀 크기 계산
    const faceWidthPixels = faceWidthRatio * imageWidth;
    const faceHeightPixels = faceHeightRatio * imageHeight;
    const facePixels = Math.min(faceWidthPixels, faceHeightPixels);

    // 얼굴이 80픽셀 미만이면 분석 불가 (랜드마크 정확도 떨어짐)
    if (facePixels < 80) {
      errors.push(`얼굴이 너무 작게 찍혔습니다 (${Math.round(facePixels)}px). 카메라에 가까이 다가가서 다시 촬영해주세요.`);
    } else if (facePixels < 150) {
      // 80~150px는 경고만 (무시하고 진행 가능)
      warnings.push(`얼굴이 작게 찍혔습니다 (${Math.round(facePixels)}px). 가까이 촬영하면 더 정확한 분석이 가능합니다.`);
    }

    // 얼굴이 화면 끝에 걸쳐있는지 확인
    if (minX < 0.02 || maxX > 0.98) {
      warnings.push(`얼굴 일부가 화면 밖으로 잘렸을 수 있습니다.`);
    }
  }

  // 3. 복합적인 문제 (여러 각도가 동시에 크면 신뢰도 하락)
  const totalRotation = Math.abs(panAngle) + Math.abs(tiltAngle) + Math.abs(rollAngle);
  if (totalRotation > 60 && errors.length === 0) {
    warnings.push(`얼굴 각도가 정면에서 많이 벗어나 있어 분석 정확도가 낮을 수 있습니다.`);
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
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
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        // 여러 얼굴이 감지된 경우 가장 큰 얼굴 선택
        let selectedLandmarks = results.multiFaceLandmarks[0];

        if (results.multiFaceLandmarks.length > 1) {
          let maxArea = 0;
          results.multiFaceLandmarks.forEach((landmarks) => {
            let minX = 1, maxX = 0, minY = 1, maxY = 0;
            landmarks.forEach(lm => {
              minX = Math.min(minX, lm.x);
              maxX = Math.max(maxX, lm.x);
              minY = Math.min(minY, lm.y);
              maxY = Math.max(maxY, lm.y);
            });
            const area = (maxX - minX) * (maxY - minY);
            if (area > maxArea) {
              maxArea = area;
              selectedLandmarks = landmarks;
            }
          });
        }

        setLandmarks(selectedLandmarks);
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

  // 얼굴 영역만 크롭하여 압축 + 랜드마크 좌표 변환
  const cropFaceImage = useCallback((
    imageDataUrl: string,
    faceLandmarks: FaceLandmark[],
    imgWidth: number,
    imgHeight: number
  ): Promise<{ image: string; landmarks: number[][] }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // 얼굴 바운딩 박스 계산
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        faceLandmarks.forEach(lm => {
          minX = Math.min(minX, lm.x);
          maxX = Math.max(maxX, lm.x);
          minY = Math.min(minY, lm.y);
          maxY = Math.max(maxY, lm.y);
        });

        // 패딩 추가 (30%)
        const padding = 0.3;
        const faceWidth = maxX - minX;
        const faceHeight = maxY - minY;

        const cropMinX = Math.max(0, minX - faceWidth * padding);
        const cropMaxX = Math.min(1, maxX + faceWidth * padding);
        const cropMinY = Math.max(0, minY - faceHeight * padding);
        const cropMaxY = Math.min(1, maxY + faceHeight * padding);

        // 픽셀 좌표로 변환
        const sx = cropMinX * img.width;
        const sy = cropMinY * img.height;
        const sw = (cropMaxX - cropMinX) * img.width;
        const sh = (cropMaxY - cropMinY) * img.height;

        // 정사각형으로 만들기
        const size = Math.max(sw, sh);
        const centerX = sx + sw / 2;
        const centerY = sy + sh / 2;
        const finalSx = Math.max(0, centerX - size / 2);
        const finalSy = Math.max(0, centerY - size / 2);
        const finalSize = Math.min(size, img.width - finalSx, img.height - finalSy);

        // 출력 크기 (최대 600px)
        const outputSize = Math.min(600, finalSize);

        // 랜드마크 좌표 변환 (크롭된 이미지 기준으로)
        const transformedLandmarks = faceLandmarks.map(lm => {
          // 원본 픽셀 좌표
          const origX = lm.x * img.width;
          const origY = lm.y * img.height;
          // 크롭 영역 기준 상대 좌표 (0-1)
          const newX = (origX - finalSx) / finalSize;
          const newY = (origY - finalSy) / finalSize;
          return [newX, newY, lm.z];
        });

        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(
            img,
            finalSx, finalSy, finalSize, finalSize,
            0, 0, outputSize, outputSize
          );
          // 품질 0.6으로 압축
          resolve({
            image: canvas.toDataURL('image/jpeg', 0.6),
            landmarks: transformedLandmarks
          });
        } else {
          // 실패 시 원본 반환
          resolve({
            image: imageDataUrl,
            landmarks: faceLandmarks.map(lm => [lm.x, lm.y, lm.z])
          });
        }
      };
      img.onerror = () => resolve({
        image: imageDataUrl,
        landmarks: faceLandmarks.map(lm => [lm.x, lm.y, lm.z])
      });
      img.src = imageDataUrl;
    });
  }, []);

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
      // 1. 얼굴 분석 실행
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Analyze API error:', response.status, errorText);
        setError(`분석 실패 (${response.status})`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        // 분석 결과 유효성 검사
        const validation = validateAnalysisResult(
          data.result.panAngle || 0,
          data.result.tiltAngle || 0,
          data.result.rollAngle || 0,
          faceLandmarks,
          imageWidth,
          imageHeight
        );

        // 에러가 있으면 분석 중단하고 알림
        if (!validation.isValid) {
          const errorMessage = validation.errors.join('\n\n');
          alert(`⚠️ 분석 정확도 문제\n\n${errorMessage}\n\n다시 촬영해주세요.`);
          setError(validation.errors[0]);
          setIsLoading(false);
          return;
        }

        // 경고가 있으면 사용자에게 알림 (계속 진행 가능)
        if (validation.warnings.length > 0) {
          const warningMessage = validation.warnings.join('\n• ');
          const shouldContinue = confirm(
            `📌 분석 정확도 알림\n\n• ${warningMessage}\n\n계속 진행하시겠습니까?`
          );
          if (!shouldContinue) {
            setIsLoading(false);
            return;
          }
        }
        // 2. 얼굴 영역만 크롭하여 압축 + 랜드마크 변환
        let croppedData = {
          image: imageData || capturedImage || '',
          landmarks: faceLandmarks.map(lm => [lm.x, lm.y, lm.z])
        };

        if (croppedData.image) {
          croppedData = await cropFaceImage(croppedData.image, faceLandmarks, imageWidth, imageHeight);
        }

        // 3. 결과를 DB에 저장 (변환된 랜드마크 사용)
        // 얼굴 크기 계산 (디버그용)
        let facePixels = 0;
        if (faceLandmarks && faceLandmarks.length > 0) {
          let minX = 1, maxX = 0, minY = 1, maxY = 0;
          faceLandmarks.forEach(lm => {
            minX = Math.min(minX, lm.x);
            maxX = Math.max(maxX, lm.x);
            minY = Math.min(minY, lm.y);
            maxY = Math.max(maxY, lm.y);
          });
          const faceWidthPixels = (maxX - minX) * imageWidth;
          const faceHeightPixels = (maxY - minY) * imageHeight;
          facePixels = Math.min(faceWidthPixels, faceHeightPixels);
        }

        // analysis에 debug 정보도 포함 (각도, 얼굴크기 추가)
        const analysisWithDebug = {
          ...data.result.analysis,
          debug: {
            ...data.result.debug,
            // 얼굴 각도 정보
            panAngle: data.result.panAngle || 0,
            tiltAngle: data.result.tiltAngle || 0,
            rollAngle: data.result.rollAngle || 0,
            // 얼굴 크기 정보
            facePixels: Math.round(facePixels),
            imageWidth,
            imageHeight,
          },
        };

        const saveResponse = await fetch('/api/face/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: data.result.score,
            gender: data.result.gender,
            categories: data.result.categories,
            analysis: analysisWithDebug,
            landmarks: croppedData.landmarks,
            imageWidth: 600, // 크롭된 이미지 크기
            imageHeight: 600,
            imageData: croppedData.image,
            panAngle: data.result.panAngle,
            tiltAngle: data.result.tiltAngle,
            rollAngle: data.result.rollAngle,
          }),
        });

        if (!saveResponse.ok) {
          console.error('Save API error:', saveResponse.status);
          // DB 저장 실패 시 기존 방식으로 폴백
          sessionStorage.setItem('faceAnalysisResult', JSON.stringify({
            result: data.result,
            image: croppedData.image,
            landmarks: croppedData.landmarks.map(([x, y, z]) => ({ x, y, z })),
            imageWidth: 600,
            imageHeight: 600,
            gender,
          }));
          router.push('/face-analysis/result');
          return;
        }

        const saveData = await saveResponse.json();

        if (saveData.success) {
          // 4. 공유 가능한 결과 페이지로 리다이렉트
          router.push(`/face-analysis/result/${saveData.shareCode}`);
        } else {
          // DB 저장 실패 시 기존 방식으로 폴백
          sessionStorage.setItem('faceAnalysisResult', JSON.stringify({
            result: data.result,
            image: croppedData.image,
            landmarks: croppedData.landmarks.map(([x, y, z]) => ({ x, y, z })),
            imageWidth: 600,
            imageHeight: 600,
            gender,
          }));
          router.push('/face-analysis/result');
        }
      } else {
        setError(data.error || '분석에 실패했습니다.');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`오류: ${err instanceof Error ? err.message : '서버 연결 실패'}`);
    } finally {
      setIsLoading(false);
    }
  }, [gender, capturedImage, router, cropFaceImage]);

  // 사진 촬영
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !landmarks) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 비디오 크기 검증
    if (!video.videoWidth || !video.videoHeight) {
      console.error('Video dimensions not available');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    // landmarks를 로컬 변수에 복사 (stopCamera에서 null로 설정되기 전에)
    const currentLandmarks = [...landmarks];
    const width = video.videoWidth;
    const height = video.videoHeight;

    setCapturedImage(imageData);
    stopCamera();
    setMode('select');

    // 분석 실행 (복사된 landmarks 사용)
    await analyzeWithLandmarks(currentLandmarks, width, height, imageData);
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
        let allFaceLandmarks: FaceLandmark[][] = [];
        faceMeshRef.current.onResults((results: MediaPipeResults) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            allFaceLandmarks = results.multiFaceLandmarks;
          }
        });

        await faceMeshRef.current.send({ image: img });

        // 잠시 대기 후 결과 확인
        await new Promise(resolve => setTimeout(resolve, 500));

        if (allFaceLandmarks.length > 0) {
          // 여러 얼굴이 감지된 경우 가장 큰 얼굴 선택
          let selectedLandmarks = allFaceLandmarks[0];

          if (allFaceLandmarks.length > 1) {
            // 각 얼굴의 바운딩 박스 크기 계산하여 가장 큰 것 선택
            let maxArea = 0;
            allFaceLandmarks.forEach((landmarks) => {
              let minX = 1, maxX = 0, minY = 1, maxY = 0;
              landmarks.forEach(lm => {
                minX = Math.min(minX, lm.x);
                maxX = Math.max(maxX, lm.x);
                minY = Math.min(minY, lm.y);
                maxY = Math.max(maxY, lm.y);
              });
              const area = (maxX - minX) * (maxY - minY);
              if (area > maxArea) {
                maxArea = area;
                selectedLandmarks = landmarks;
              }
            });

            // 여러 얼굴 감지 알림 (에러 아님, 정보성)
            console.log(`${allFaceLandmarks.length}개의 얼굴이 감지되어 가장 큰 얼굴을 선택했습니다.`);
          }

          // 캔버스에서 이미지 데이터 추출
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          await analyzeWithLandmarks(selectedLandmarks, img.width, img.height, imageData);
        } else {
          setError('😕 얼굴을 인식할 수 없습니다.\n\n가능한 원인:\n• 얼굴이 너무 작거나 멀리 있음\n• 얼굴이 흐릿하거나 가려져 있음\n• 조명이 너무 어둡거나 역광\n• 모자, 선글라스 등으로 가려짐\n\n💡 팁: 밝은 곳에서 정면을 바라보고 다시 촬영해주세요.');
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 whitespace-pre-line text-left text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 w-full py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                닫기
              </button>
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
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* 비디오 영역 */}
        <div className="flex-1 relative overflow-hidden">
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
          <div className="absolute top-12 left-0 right-0 text-center px-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl py-3 px-4 inline-block">
              <span className={`text-base font-medium ${
                landmarks ? 'text-green-400' : 'text-white'
              }`}>
                {landmarks ? '✓ 촬영 가능' : '얼굴을 가이드에 맞춰주세요'}
              </span>
              <p className="mt-1 text-white/90 text-sm">
                📷 카메라를 정면으로 바라봐 주세요
              </p>
            </div>
          </div>

          {/* 컨트롤 영역 - 비디오 위에 오버레이 */}
          <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => {
                  stopCamera();
                  setMode('select');
                }}
                className="p-4 rounded-full bg-gray-700/80 text-white backdrop-blur-sm"
              >
                ✕
              </button>
              <button
                onClick={capturePhoto}
                disabled={!landmarks}
                className={`w-20 h-20 rounded-full border-4 transition-all ${
                  landmarks
                    ? 'bg-white border-green-500 hover:scale-105 shadow-lg'
                    : 'bg-gray-600 border-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">{landmarks ? '📸' : '🔍'}</span>
              </button>
              <button
                onClick={() => {
                  // 전면/후면 카메라 전환 (모바일)
                }}
                className="p-4 rounded-full bg-gray-700/80 text-white backdrop-blur-sm"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return null;
}
