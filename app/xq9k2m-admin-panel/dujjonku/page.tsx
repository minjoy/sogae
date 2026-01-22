'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// 가격 포맷팅 헬퍼 (천단위 콤마)
const formatPrice = (value: string | number): string => {
  const numStr = String(value).replace(/[^0-9]/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('ko-KR');
};

// 숫자만 추출
const extractNumber = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

interface StoreReport {
  id: string;
  reason: string;
  createdAt: string;
  user: { nickname: string } | null;
}

interface Store {
  id: string;
  name: string;
  category: string;
  dessertName: string | null;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  description: string | null;
  imageUrl: string | null;
  clickCount: number;
  reportCount: number;
  isHidden: boolean;
  isAdmin: boolean;
  createdAt: string;
  user: { nickname: string; email: string } | null;
  _count: { reports: number };
  reports?: StoreReport[];
}

interface EditRequest {
  id: string;
  storeId: string;
  userId: string;
  name: string | null;
  category: string | null;
  dessertName: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  description: string | null;
  imageUrl: string | null;
  storeUrl: string | null;
  passOrderUrl: string | null;
  price: number | null;
  status: string;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
  store: {
    id: string;
    name: string;
    category: string;
    dessertName: string | null;
    address: string;
    lat: number;
    lng: number;
    phone: string | null;
    description: string | null;
    imageUrl: string | null;
    storeUrl: string | null;
    passOrderUrl: string | null;
    price: number | null;
  };
}

// 카테고리 정보
const CATEGORIES = [
  { key: 'dujjonku', label: '두쫀쿠', emoji: '🍪' },
  { key: 'dubai', label: '두바이파생', emoji: '🍫' },
  { key: 'signature', label: '시그니처간식', emoji: '🎂' },
] as const;

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ADMIN_KEY = 'sogae-admin-2024';

export default function AdminDujjonkuPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'stores' | 'editRequests'>('stores');
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    categories: ['dujjonku'] as string[],
    dubaiDessertName: '',
    signatureDessertName: '',
    price: '',
    address: '',
    lat: '',
    lng: '',
    phone: '',
    description: '',
    imageUrl: '',
    storeUrl: '',
    passOrderUrl: '',
  });

  // 두바이파생/시그니처간식 선택 여부 확인
  const needsDubaiDessert = createForm.categories.includes('dubai');
  const needsSignatureDessert = createForm.categories.includes('signature');

  // 수정 요청 관련 상태
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [editRequestFilter, setEditRequestFilter] = useState('pending');
  const [selectedEditRequest, setSelectedEditRequest] = useState<EditRequest | null>(null);
  const [isEditRequestDetailOpen, setIsEditRequestDetailOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // 세션 확인
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') {
        setIsCheckingAuth(false);
        return;
      }

      const storedData = localStorage.getItem('adminSession');
      if (!storedData) {
        router.push('/xq9k2m-admin-panel');
        return;
      }

      try {
        const { password, expiry } = JSON.parse(storedData);

        if (Date.now() > expiry) {
          localStorage.removeItem('adminSession');
          router.push('/xq9k2m-admin-panel');
          return;
        }

        // 저장된 비밀번호로 인증 확인
        const response = await fetch('/api/admin/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const data = await response.json();

        if (data.success) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminSession');
          router.push('/xq9k2m-admin-panel');
        }
      } catch {
        localStorage.removeItem('adminSession');
        router.push('/xq9k2m-admin-panel');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchStores = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/stores?page=${page}&limit=20&filter=${filter}`,
        { headers: { 'x-admin-key': ADMIN_KEY } }
      );
      const data = await response.json();

      if (data.success) {
        setStores(data.stores);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // 수정 요청 목록 조회
  const fetchEditRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/store-edit-requests?status=${editRequestFilter}`,
        { headers: { 'x-admin-key': ADMIN_KEY } }
      );
      const data = await response.json();

      if (data.success) {
        setEditRequests(data.editRequests);
      }
    } catch (error) {
      console.error('Failed to fetch edit requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [editRequestFilter]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === 'stores') {
      fetchStores();
    } else {
      fetchEditRequests();
    }
  }, [activeTab, isAuthenticated, fetchStores, fetchEditRequests]);

  // 수정 요청 승인/거절
  const handleEditRequestAction = async (
    requestId: string,
    action: 'approve' | 'reject',
    applyFields?: string[]
  ) => {
    try {
      const response = await fetch(`/api/admin/store-edit-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY,
        },
        body: JSON.stringify({
          action,
          applyFields: action === 'approve' ? applyFields : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setIsEditRequestDetailOpen(false);
        fetchEditRequests();
      } else {
        alert(data.error || '처리에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to process edit request:', error);
      alert('처리 중 오류가 발생했습니다');
    }
  };

  const handleToggleHidden = async (storeId: string, currentHidden: boolean) => {
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY,
        },
        body: JSON.stringify({ isHidden: !currentHidden }),
      });

      if (response.ok) {
        fetchStores(pagination?.page || 1);
      }
    } catch (error) {
      console.error('Failed to toggle hidden:', error);
    }
  };

  const handleDelete = async (storeId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': ADMIN_KEY },
      });

      if (response.ok) {
        fetchStores(pagination?.page || 1);
        setIsDetailOpen(false);
      }
    } catch (error) {
      console.error('Failed to delete store:', error);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.address || !createForm.lat || !createForm.lng) {
      alert('필수 항목을 입력해주세요');
      return;
    }

    if (createForm.categories.length === 0) {
      alert('카테고리를 하나 이상 선택해주세요');
      return;
    }

    // 두바이파생 선택 시 디저트명 필수
    if (createForm.categories.includes('dubai') && !createForm.dubaiDessertName.trim()) {
      alert('두바이파생 디저트명을 입력해주세요');
      return;
    }

    // 시그니처간식 선택 시 디저트명 필수
    if (createForm.categories.includes('signature') && !createForm.signatureDessertName.trim()) {
      alert('시그니처간식 디저트명을 입력해주세요');
      return;
    }

    // 디저트명 조합
    const dessertParts: string[] = [];
    if (createForm.dubaiDessertName.trim()) {
      dessertParts.push(`[두바이파생] ${createForm.dubaiDessertName.trim()}`);
    }
    if (createForm.signatureDessertName.trim()) {
      dessertParts.push(`[시그니처간식] ${createForm.signatureDessertName.trim()}`);
    }
    const combinedDessertName = dessertParts.join(' | ');

    // 카테고리 결정: 첫 번째 선택된 카테고리를 메인으로
    const mainCategory = createForm.categories[0];

    try {
      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY,
        },
        body: JSON.stringify({
          name: createForm.name,
          category: mainCategory,
          dessertName: combinedDessertName || null,
          address: createForm.address,
          lat: createForm.lat,
          lng: createForm.lng,
          phone: createForm.phone,
          description: createForm.description,
          imageUrl: createForm.imageUrl,
          storeUrl: createForm.storeUrl || null,
          passOrderUrl: createForm.passOrderUrl || null,
          price: createForm.price ? extractNumber(createForm.price) : null,
        }),
      });

      if (response.ok) {
        setIsCreateOpen(false);
        setCreateForm({
          name: '',
          categories: ['dujjonku'],
          dubaiDessertName: '',
          signatureDessertName: '',
          price: '',
          address: '',
          lat: '',
          lng: '',
          phone: '',
          description: '',
          imageUrl: '',
          storeUrl: '',
          passOrderUrl: '',
        });
        fetchStores();
      }
    } catch (error) {
      console.error('Failed to create store:', error);
    }
  };

  const viewDetail = async (storeId: string) => {
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        headers: { 'x-admin-key': ADMIN_KEY },
      });
      const data = await response.json();

      if (data.success) {
        setSelectedStore(data.store);
        setIsDetailOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch store detail:', error);
    }
  };

  // 인증 확인 중
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">세션 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 (리다이렉트 중)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">관리자 인증이 필요합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/xq9k2m-admin-panel" className="text-sm text-gray-500 hover:text-gray-700">
              ← 관리자 홈
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">두쫀쿠맵 관리</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/xq9k2m-admin-panel/dujjonku/naver-search"
              className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
            >
              네이버 검색 결과
            </Link>
            {activeTab === 'stores' && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600"
              >
                + 매장 등록
              </button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'stores'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            매장 목록
          </button>
          <button
            onClick={() => setActiveTab('editRequests')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'editRequests'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            수정 요청
            {editRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {editRequests.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* 필터 - 매장 목록 탭 */}
        {activeTab === 'stores' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { value: 'all', label: '전체' },
              { value: 'hidden', label: '숨김' },
              { value: 'reported', label: '신고됨' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === item.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            <span className="w-px bg-gray-300 mx-2" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === cat.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* 필터 - 수정 요청 탭 */}
        {activeTab === 'editRequests' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { value: 'pending', label: '대기 중' },
              { value: 'approved', label: '승인됨' },
              { value: 'rejected', label: '거절됨' },
              { value: 'all', label: '전체' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setEditRequestFilter(item.value)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  editRequestFilter === item.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* 통계 - 매장 목록 */}
        {activeTab === 'stores' && pagination && (
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <p className="text-gray-600">
              총 <span className="font-bold text-primary-600">{pagination.total}</span>개 매장
            </p>
          </div>
        )}

        {/* 통계 - 수정 요청 */}
        {activeTab === 'editRequests' && (
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <p className="text-gray-600">
              총 <span className="font-bold text-primary-600">{editRequests.length}</span>개 수정 요청
            </p>
          </div>
        )}

        {/* 매장 목록 테이블 */}
        {activeTab === 'stores' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">매장명</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">카테고리</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">주소</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">클릭수</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">신고수</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">상태</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">등록자</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    등록된 매장이 없습니다
                  </td>
                </tr>
              ) : (
                stores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewDetail(store.id)}
                        className="font-medium text-gray-900 hover:text-primary-600"
                      >
                        {store.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        store.category === 'dujjonku' ? 'bg-yellow-100 text-yellow-800' :
                        store.category === 'dubai' ? 'bg-amber-100 text-amber-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {CATEGORIES.find((c) => c.key === store.category)?.emoji}{' '}
                        {CATEGORIES.find((c) => c.key === store.category)?.label || '두쫀쿠'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {store.address}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {store.clickCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${store.reportCount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {store.reportCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {store.isHidden ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          숨김
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          공개
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {store.isAdmin ? '관리자' : store.user?.nickname || '탈퇴회원'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleHidden(store.id, store.isHidden)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            store.isHidden
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          {store.isHidden ? '공개' : '숨김'}
                        </button>
                        <button
                          onClick={() => handleDelete(store.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}

        {/* 페이지네이션 */}
        {activeTab === 'stores' && pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchStores(page)}
                className={`w-10 h-10 rounded-lg font-medium ${
                  pagination.page === page
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        {/* 수정 요청 목록 */}
        {activeTab === 'editRequests' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">매장명</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">수정 내용</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">요청일</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : editRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      수정 요청이 없습니다
                    </td>
                  </tr>
                ) : (
                  editRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{req.store.name}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {[
                          req.name && '매장명',
                          req.category && '카테고리',
                          req.dessertName && '디저트명',
                          req.address && '주소',
                          req.phone && '전화번호',
                          req.description && '설명',
                          req.imageUrl && '이미지',
                          req.storeUrl && '매장링크',
                          req.passOrderUrl && '패스오더',
                          req.price && '가격',
                        ].filter(Boolean).join(', ') || '없음'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {req.status === 'pending' ? '대기' :
                           req.status === 'approved' ? '승인' : '거절'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {new Date(req.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedEditRequest(req);
                            setSelectedFields([
                              req.name && 'name',
                              req.category && 'category',
                              req.dessertName && 'dessertName',
                              req.address && 'address',
                              req.lat && 'lat',
                              req.lng && 'lng',
                              req.phone && 'phone',
                              req.description && 'description',
                              req.imageUrl && 'imageUrl',
                              req.storeUrl && 'storeUrl',
                              req.passOrderUrl && 'passOrderUrl',
                              req.price && 'price',
                            ].filter((f): f is string => !!f));
                            setIsEditRequestDetailOpen(true);
                          }}
                          className="px-3 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium hover:bg-primary-200"
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {isDetailOpen && selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsDetailOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedStore.name}</h2>

            {/* 이미지 */}
            {selectedStore.imageUrl && (
              <div className="mb-4 relative w-full h-48">
                <Image
                  src={selectedStore.imageUrl}
                  alt={selectedStore.name}
                  fill
                  className="object-cover rounded-xl"
                  unoptimized
                />
              </div>
            )}

            <div className="space-y-3 mb-6">
              <p>
                <span className="font-semibold">카테고리:</span>{' '}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedStore.category === 'dujjonku' ? 'bg-yellow-100 text-yellow-800' :
                  selectedStore.category === 'dubai' ? 'bg-amber-100 text-amber-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {CATEGORIES.find((c) => c.key === selectedStore.category)?.emoji}{' '}
                  {CATEGORIES.find((c) => c.key === selectedStore.category)?.label || '두쫀쿠'}
                </span>
              </p>
              <p><span className="font-semibold">주소:</span> {selectedStore.address}</p>
              <p><span className="font-semibold">위치:</span> {selectedStore.lat}, {selectedStore.lng}</p>
              {selectedStore.phone && <p><span className="font-semibold">전화:</span> {selectedStore.phone}</p>}
              {selectedStore.description && <p><span className="font-semibold">설명:</span> {selectedStore.description}</p>}
              <p><span className="font-semibold">클릭수:</span> {selectedStore.clickCount}</p>
              <p><span className="font-semibold">신고수:</span> {selectedStore.reportCount}</p>
              <p>
                <span className="font-semibold">등록자:</span>{' '}
                {selectedStore.isAdmin
                  ? '관리자'
                  : selectedStore.user
                  ? `${selectedStore.user.nickname} (${selectedStore.user.email})`
                  : '탈퇴회원'}
              </p>
              <p><span className="font-semibold">등록일:</span> {new Date(selectedStore.createdAt).toLocaleString('ko-KR')}</p>
            </div>

            {/* 신고 내역 */}
            {selectedStore.reports && selectedStore.reports.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">신고 내역</h3>
                <div className="space-y-2">
                  {selectedStore.reports.map((report) => (
                    <div key={report.id} className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-700">{report.reason}</p>
                      <p className="text-xs text-red-500 mt-1">
                        {report.user?.nickname || '탈퇴회원'} · {new Date(report.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleToggleHidden(selectedStore.id, selectedStore.isHidden)}
                className={`flex-1 py-3 rounded-xl font-semibold ${
                  selectedStore.isHidden
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {selectedStore.isHidden ? '공개하기' : '숨기기'}
              </button>
              <button
                onClick={() => handleDelete(selectedStore.id)}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 등록 모달 */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-2xl p-6 overflow-y-auto">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">매장 등록 (관리자)</h2>

            <div className="space-y-4">
              {/* 카테고리 선택 (복수 선택 가능) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">카테고리 * (복수 선택 가능)</label>
                <div className="flex gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = createForm.categories.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setCreateForm((prev) => {
                            const newCategories = isSelected
                              ? prev.categories.filter((c) => c !== cat.key)
                              : [...prev.categories, cat.key];
                            return {
                              ...prev,
                              categories: newCategories.length > 0 ? newCategories : [cat.key],
                              // 카테고리 해제 시 해당 디저트명도 초기화
                              dubaiDessertName: cat.key === 'dubai' && isSelected ? '' : prev.dubaiDessertName,
                              signatureDessertName: cat.key === 'signature' && isSelected ? '' : prev.signatureDessertName,
                            };
                          });
                        }}
                        className={`relative flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {/* 체크 아이콘 */}
                        {isSelected && (
                          <span className="absolute top-1 right-1">
                            <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        <span className="block text-lg mb-1">{cat.emoji}</span>
                        <span className="block text-xs">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 두바이파생 디저트명 */}
              {needsDubaiDessert && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    🍫 두바이파생 디저트명 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {createForm.dubaiDessertName.split(',').filter(tag => tag.trim()).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm"
                      >
                        {tag.trim()}
                        <button
                          type="button"
                          onClick={() => {
                            const tags = createForm.dubaiDessertName.split(',').filter(t => t.trim());
                            tags.splice(index, 1);
                            setCreateForm(prev => ({ ...prev, dubaiDessertName: tags.join(',') }));
                          }}
                          className="ml-1 text-amber-500 hover:text-amber-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="디저트명 입력 후 Enter (예: 두바이초콜릿)"
                    className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-amber-50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim().replace(/,/g, '');
                        if (value) {
                          const currentTags = createForm.dubaiDessertName.split(',').filter(t => t.trim());
                          if (!currentTags.includes(value)) {
                            setCreateForm(prev => ({
                              ...prev,
                              dubaiDessertName: [...currentTags, value].join(',')
                            }));
                          }
                          input.value = '';
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.currentTarget.value.trim().replace(/,/g, '');
                      if (value) {
                        const currentTags = createForm.dubaiDessertName.split(',').filter(t => t.trim());
                        if (!currentTags.includes(value)) {
                          setCreateForm(prev => ({
                            ...prev,
                            dubaiDessertName: [...currentTags, value].join(',')
                          }));
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              )}

              {/* 시그니처간식 디저트명 */}
              {needsSignatureDessert && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    🎂 시그니처간식 디저트명 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {createForm.signatureDessertName.split(',').filter(tag => tag.trim()).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {tag.trim()}
                        <button
                          type="button"
                          onClick={() => {
                            const tags = createForm.signatureDessertName.split(',').filter(t => t.trim());
                            tags.splice(index, 1);
                            setCreateForm(prev => ({ ...prev, signatureDessertName: tags.join(',') }));
                          }}
                          className="ml-1 text-purple-500 hover:text-purple-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="디저트명 입력 후 Enter (예: 크로플, 마카롱)"
                    className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-purple-50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const value = input.value.trim().replace(/,/g, '');
                        if (value) {
                          const currentTags = createForm.signatureDessertName.split(',').filter(t => t.trim());
                          if (!currentTags.includes(value)) {
                            setCreateForm(prev => ({
                              ...prev,
                              signatureDessertName: [...currentTags, value].join(',')
                            }));
                          }
                          input.value = '';
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = e.currentTarget.value.trim().replace(/,/g, '');
                      if (value) {
                        const currentTags = createForm.signatureDessertName.split(',').filter(t => t.trim());
                        if (!currentTags.includes(value)) {
                          setCreateForm(prev => ({
                            ...prev,
                            signatureDessertName: [...currentTags, value].join(',')
                          }));
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              )}

              {/* 두쫀쿠 가격 */}
              {createForm.categories.includes('dujjonku') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    🍪 두쫀쿠 가격
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={createForm.price}
                      onChange={(e) => {
                        const formatted = formatPrice(e.target.value);
                        setCreateForm((prev) => ({ ...prev, price: formatted }));
                      }}
                      className="w-full px-4 py-3 pr-8 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-900 bg-yellow-50"
                      placeholder="예: 5,000"
                      inputMode="numeric"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">원</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">두쫀쿠 1개 가격을 입력해주세요</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">매장명 *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">주소 *</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">위도 *</label>
                  <input
                    type="text"
                    value={createForm.lat}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, lat: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="37.5665"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">경도 *</label>
                  <input
                    type="text"
                    value={createForm.lng}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, lng: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                    placeholder="126.978"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">전화번호</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">설명</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">상품 이미지 URL</label>
                <input
                  type="url"
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com/image.jpg"
                />
                {createForm.imageUrl && (
                  <div className="mt-2 relative w-full h-32">
                    <Image
                      src={createForm.imageUrl}
                      alt="미리보기"
                      fill
                      className="object-cover rounded-xl border border-gray-200"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">매장 링크</label>
                <input
                  type="url"
                  value={createForm.storeUrl}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, storeUrl: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500"
                  placeholder="https://instagram.com/store 또는 네이버 플레이스 링크"
                />
                <p className="text-xs text-gray-500 mt-1">
                  인스타그램, 네이버 플레이스 등 매장 링크를 입력하세요
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">패스오더 링크</label>
                <input
                  type="url"
                  value={createForm.passOrderUrl}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, passOrderUrl: e.target.value }))}
                  className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-blue-50"
                  placeholder="https://app.passorder.co.kr/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  패스오더 주문 링크가 있는 경우 입력하세요
                </p>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full mt-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600"
            >
              등록하기
            </button>
          </div>
        </div>
      )}

      {/* 수정 요청 상세 모달 */}
      {isEditRequestDetailOpen && selectedEditRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsEditRequestDetailOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditRequestDetailOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-2">수정 요청 상세</h2>
            <p className="text-gray-500 text-sm mb-6">매장: {selectedEditRequest.store.name}</p>

            {/* 상태 표시 */}
            <div className="mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedEditRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                selectedEditRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedEditRequest.status === 'pending' ? '대기 중' :
                 selectedEditRequest.status === 'approved' ? '승인됨' : '거절됨'}
              </span>
            </div>

            {/* 변경 내용 비교 */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-gray-900">변경 요청 내용</h3>
              <p className="text-xs text-gray-500">적용할 항목을 선택하세요</p>

              {selectedEditRequest.name && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('name')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'name']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'name'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">매장명</p>
                      <p className="text-sm text-gray-500">현재: {selectedEditRequest.store.name}</p>
                      <p className="text-sm text-primary-600">변경: {selectedEditRequest.name}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.category && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('category')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'category']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'category'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">카테고리</p>
                      <p className="text-sm text-gray-500">현재: {selectedEditRequest.store.category}</p>
                      <p className="text-sm text-primary-600">변경: {selectedEditRequest.category}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.dessertName !== null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('dessertName')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'dessertName']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'dessertName'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">디저트명</p>
                      <p className="text-sm text-gray-500">현재: {selectedEditRequest.store.dessertName || '없음'}</p>
                      <p className="text-sm text-primary-600">변경: {selectedEditRequest.dessertName || '없음'}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.address && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('address')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'address', 'lat', 'lng']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => !['address', 'lat', 'lng'].includes(f)));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">주소</p>
                      <p className="text-sm text-gray-500">현재: {selectedEditRequest.store.address}</p>
                      <p className="text-sm text-primary-600">변경: {selectedEditRequest.address}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.phone !== null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('phone')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'phone']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'phone'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">전화번호</p>
                      <p className="text-sm text-gray-500">현재: {selectedEditRequest.store.phone || '없음'}</p>
                      <p className="text-sm text-primary-600">변경: {selectedEditRequest.phone || '없음'}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.description !== null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('description')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'description']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'description'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">설명</p>
                      <p className="text-sm text-gray-500">현재: {selectedEditRequest.store.description || '없음'}</p>
                      <p className="text-sm text-primary-600">변경: {selectedEditRequest.description || '없음'}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.imageUrl !== null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('imageUrl')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'imageUrl']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'imageUrl'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">이미지 URL</p>
                      <p className="text-sm text-gray-500 break-all">현재: {selectedEditRequest.store.imageUrl || '없음'}</p>
                      <p className="text-sm text-primary-600 break-all">변경: {selectedEditRequest.imageUrl || '없음'}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.storeUrl !== null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('storeUrl')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'storeUrl']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'storeUrl'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">매장 링크</p>
                      <p className="text-sm text-gray-500 break-all">현재: {selectedEditRequest.store.storeUrl || '없음'}</p>
                      <p className="text-sm text-primary-600 break-all">변경: {selectedEditRequest.storeUrl || '없음'}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.passOrderUrl !== null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('passOrderUrl')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'passOrderUrl']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'passOrderUrl'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">패스오더 링크</p>
                      <p className="text-sm text-gray-500 break-all">현재: {selectedEditRequest.store.passOrderUrl || '없음'}</p>
                      <p className="text-sm text-blue-600 break-all">변경: {selectedEditRequest.passOrderUrl || '없음'}</p>
                    </div>
                  </label>
                </div>
              )}

              {selectedEditRequest.price !== null && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes('price')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFields([...selectedFields, 'price']);
                        } else {
                          setSelectedFields(selectedFields.filter((f) => f !== 'price'));
                        }
                      }}
                      className="mt-1"
                      disabled={selectedEditRequest.status !== 'pending'}
                    />
                    <div>
                      <p className="font-medium text-gray-700">🍪 두쫀쿠 가격</p>
                      <p className="text-sm text-gray-500">현재: {selectedEditRequest.store.price ? `${formatPrice(selectedEditRequest.store.price)}원` : '없음'}</p>
                      <p className="text-sm text-primary-600">변경: {selectedEditRequest.price ? `${formatPrice(selectedEditRequest.price)}원` : '없음'}</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            {selectedEditRequest.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleEditRequestAction(selectedEditRequest.id, 'approve', selectedFields)}
                  disabled={selectedFields.length === 0}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50"
                >
                  선택 항목 승인
                </button>
                <button
                  onClick={() => handleEditRequestAction(selectedEditRequest.id, 'reject')}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
                >
                  거절
                </button>
              </div>
            )}

            {selectedEditRequest.status !== 'pending' && (
              <div className="p-4 bg-gray-100 rounded-xl text-center text-gray-600">
                이미 처리된 요청입니다
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
