'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

declare global {
  interface Window {
    kakao: any;
  }
}

interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  clickCount: number;
}

interface StoreDetail {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  description: string | null;
  imageUrl: string | null;
  clickCount: number;
  registeredBy: string;
  createdAt: string;
}

export default function DujjonkuMapPage() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<any>(null);
  const previewMapRef = useRef<any>(null);
  const previewMarkerRef = useRef<any>(null);

  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 매장 등록 폼
  const [registerForm, setRegisterForm] = useState({
    name: '',
    address: '',
    lat: 0,
    lng: 0,
    phone: '',
    description: '',
  });

  // 신고 폼
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // 이미 SDK가 로드되어 있는지 확인 (클라이언트 사이드 네비게이션 시)
    if (window.kakao && window.kakao.maps) {
      setSdkLoaded(true);
    }
  }, []);

  // SDK 로딩 완료 후 지도 초기화
  useEffect(() => {
    if (!sdkLoaded) return;

    // 약간의 지연을 두어 DOM이 확실히 렌더링되도록
    const timer = setTimeout(() => {
      initMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [sdkLoaded]);

  // 카카오맵 초기화
  const initMap = useCallback(() => {
    if (!window.kakao || !window.kakao.maps) return;

    const container = document.getElementById('map');
    if (!container) return;

    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.978), // 서울 시청
      level: 5,
    };

    const map = new window.kakao.maps.Map(container, options);
    mapRef.current = map;

    // 클러스터러 생성
    clustererRef.current = new window.kakao.maps.MarkerClusterer({
      map: map,
      averageCenter: true,
      minLevel: 6,
      disableClickZoom: true,
      styles: [{
        width: '50px',
        height: '50px',
        background: 'rgba(255, 107, 107, 0.9)',
        borderRadius: '50%',
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        lineHeight: '50px',
        fontSize: '16px',
      }],
    });

    // 지도 이동/확대 이벤트
    window.kakao.maps.event.addListener(map, 'idle', () => {
      fetchStores();
    });

    // 초기 매장 로드
    fetchStores();
  }, []);

  // 매장 목록 조회
  const fetchStores = useCallback(async () => {
    if (!mapRef.current) return;

    const bounds = mapRef.current.getBounds();
    const level = mapRef.current.getLevel();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    try {
      const response = await fetch(
        `/api/stores?swLat=${sw.getLat()}&swLng=${sw.getLng()}&neLat=${ne.getLat()}&neLng=${ne.getLng()}&level=${level}`
      );
      const data = await response.json();

      if (data.success) {
        setStores(data.stores);
        updateMarkers(data.stores);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  }, []);

  // 마커 업데이트
  const updateMarkers = useCallback((storeList: Store[]) => {
    if (!mapRef.current || !clustererRef.current) return;

    // 기존 마커 제거
    clustererRef.current.clear();
    markersRef.current = [];

    // 새 마커 생성
    const markers = storeList.map((store) => {
      const markerImage = new window.kakao.maps.MarkerImage(
        'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
        new window.kakao.maps.Size(24, 35)
      );

      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(store.lat, store.lng),
        image: markerImage,
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        handleStoreClick(store.id);
      });

      return marker;
    });

    markersRef.current = markers;
    clustererRef.current.addMarkers(markers);
  }, []);

  // 매장 클릭 (상세 조회)
  const handleStoreClick = async (storeId: string) => {
    try {
      const response = await fetch(`/api/stores/${storeId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedStore(data.store);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch store detail:', error);
    }
  };

  // 현재 위치로 이동
  const moveToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('위치 정보를 사용할 수 없습니다');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const moveLatLng = new window.kakao.maps.LatLng(latitude, longitude);
        mapRef.current?.setCenter(moveLatLng);
        mapRef.current?.setLevel(3);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('위치 정보를 가져올 수 없습니다');
      }
    );
  };

  // 매장 등록 모달 열기
  const openRegisterModal = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    // 미리보기 맵 초기화
    previewMapRef.current = null;
    previewMarkerRef.current = null;

    // 폼 초기화
    setRegisterForm({
      name: '',
      address: '',
      lat: 0,
      lng: 0,
      phone: '',
      description: '',
    });
    setIsRegisterOpen(true);
  };

  // 미리보기 맵 초기화/업데이트
  const updatePreviewMap = useCallback((lat: number, lng: number) => {
    if (!window.kakao || !window.kakao.maps) return;

    const container = document.getElementById('preview-map');
    if (!container) return;

    const position = new window.kakao.maps.LatLng(lat, lng);

    if (!previewMapRef.current) {
      // 미리보기 맵 생성
      const options = {
        center: position,
        level: 3,
      };
      previewMapRef.current = new window.kakao.maps.Map(container, options);
    } else {
      // 기존 맵 중심 이동
      previewMapRef.current.setCenter(position);
    }

    // 기존 마커 제거
    if (previewMarkerRef.current) {
      previewMarkerRef.current.setMap(null);
    }

    // 새 마커 생성
    previewMarkerRef.current = new window.kakao.maps.Marker({
      position: position,
      map: previewMapRef.current,
    });
  }, []);

  // 주소 검색
  const searchAddress = () => {
    if (!window.kakao || !window.kakao.maps.services) return;

    const ps = new window.kakao.maps.services.Places();

    const keyword = registerForm.address;
    if (!keyword) {
      alert('주소를 입력해주세요');
      return;
    }

    ps.keywordSearch(keyword, (data: any[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.y);
        const lng = parseFloat(place.x);

        setRegisterForm((prev) => ({
          ...prev,
          address: place.address_name,
          lat,
          lng,
        }));

        // 미리보기 맵 업데이트
        setTimeout(() => updatePreviewMap(lat, lng), 100);
      } else {
        alert('검색 결과가 없습니다');
      }
    });
  };

  // 매장 등록
  const handleRegister = async () => {
    if (!registerForm.name || !registerForm.address) {
      alert('매장명과 주소는 필수입니다');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setIsRegisterOpen(false);
        fetchStores();
      } else {
        alert(data.error || '등록에 실패했습니다');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('등록 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 신고하기
  const handleReport = async () => {
    if (!selectedStore || !reportReason) {
      alert('신고 사유를 입력해주세요');
      return;
    }

    if (!isLoggedIn) {
      alert('로그인이 필요합니다');
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/stores/${selectedStore.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reportReason }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setIsReportOpen(false);
        setReportReason('');
      } else {
        alert(data.error || '신고에 실패했습니다');
      }
    } catch (error) {
      console.error('Report error:', error);
      alert('신고 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 길찾기
  const openDirection = () => {
    if (!selectedStore) return;
    const url = `https://map.kakao.com/link/to/${selectedStore.name},${selectedStore.lat},${selectedStore.lng}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <Script
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=4608bb9158fa17e55fe0999938e4e812&libraries=services,clusterer&autoload=false`}
        onLoad={() => {
          window.kakao.maps.load(() => setSdkLoaded(true));
        }}
      />

      <div className="fixed inset-0 flex flex-col bg-white z-[100]">
        {/* 헤더 */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">두쫀쿠맵</h1>
          <div className="w-10" /> {/* 균형용 */}
        </header>

        {/* 지도 영역 */}
        <div className="flex-1 relative">
          <div id="map" className="w-full h-full" />

          {/* 현재 위치 버튼 */}
          <button
            onClick={moveToCurrentLocation}
            className="absolute bottom-24 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-10 hover:bg-gray-50"
          >
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* 매장 등록 버튼 */}
          <button
            onClick={openRegisterModal}
            className="absolute bottom-24 left-4 px-4 py-2 bg-primary-500 text-white rounded-full shadow-lg flex items-center gap-2 z-10 hover:bg-primary-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-semibold">매장 등록</span>
          </button>

          {/* 매장 수 표시 */}
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full shadow text-sm text-gray-700 z-10">
            현재 지역 매장 <span className="font-bold text-primary-600">{stores.length}</span>개
          </div>
        </div>

        {/* 광고 영역 (하단 고정) */}
        <div className="h-16 bg-gray-100 border-t border-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">광고 영역</span>
        </div>
      </div>

      {/* 매장 상세 모달 */}
      {isDetailOpen && selectedStore && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsDetailOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-8 animate-slide-up">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-2 pr-8">{selectedStore.name}</h2>
            <p className="text-gray-600 text-sm mb-4">{selectedStore.address}</p>

            {selectedStore.phone && (
              <p className="text-gray-700 text-sm mb-2">
                <span className="font-semibold">전화:</span> {selectedStore.phone}
              </p>
            )}

            {selectedStore.description && (
              <p className="text-gray-700 text-sm mb-4">{selectedStore.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
              <span>조회수: {selectedStore.clickCount}</span>
              <span>등록자: {selectedStore.registeredBy}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={openDirection}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600"
              >
                길찾기
              </button>
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsReportOpen(true);
                }}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
              >
                신고
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 매장 등록 모달 */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsRegisterOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">두쫀쿠 매장 등록</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  매장명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="예: 달달한 두쫀쿠"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  주소 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="주소 또는 장소명 입력"
                  />
                  <button
                    onClick={searchAddress}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 whitespace-nowrap"
                  >
                    검색
                  </button>
                </div>
                {registerForm.lat !== 0 && (
                  <>
                    <p className="text-xs text-green-600 mt-1 mb-2">
                      위치가 설정되었습니다: {registerForm.address}
                    </p>
                    {/* 미리보기 맵 */}
                    <div
                      id="preview-map"
                      className="w-full h-40 rounded-xl border border-gray-200 overflow-hidden"
                    />
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="예: 02-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  매장 설명
                </label>
                <textarea
                  value={registerForm.description}
                  onChange={(e) => setRegisterForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="매장에 대한 간단한 설명"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-xl">
              <p className="text-sm text-primary-700">
                매장을 등록하면 <span className="font-bold">달달함 점수 +2점</span>을 받아요!
              </p>
            </div>

            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full mt-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50"
            >
              {isLoading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </div>
      )}

      {/* 신고 모달 */}
      {isReportOpen && selectedStore && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsReportOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6">
            <button
              onClick={() => setIsReportOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-2">매장 신고</h2>
            <p className="text-gray-600 text-sm mb-6">{selectedStore.name}</p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                신고 사유
              </label>
              <div className="space-y-2 mb-4">
                {['허위 정보', '폐업한 매장', '두쫀쿠 판매 안함', '기타'].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`w-full px-4 py-3 text-left rounded-xl border ${
                      reportReason === reason
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {reportReason === '기타' && (
                <textarea
                  value={reportReason === '기타' ? '' : reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="신고 사유를 입력해주세요"
                />
              )}
            </div>

            <button
              onClick={handleReport}
              disabled={isLoading || !reportReason}
              className="w-full mt-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              {isLoading ? '신고 중...' : '신고하기'}
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
