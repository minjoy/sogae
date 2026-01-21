'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  description: string | null;
  clickCount: number;
  reportCount: number;
  isHidden: boolean;
  isAdmin: boolean;
  createdAt: string;
  user: { nickname: string; email: string } | null;
  _count: { reports: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ADMIN_KEY = 'sogae-admin-2024';

export default function AdminDujjonkuPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    phone: '',
    description: '',
  });

  const fetchStores = async (page = 1) => {
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
  };

  useEffect(() => {
    fetchStores();
  }, [filter]);

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

    try {
      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY,
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        setIsCreateOpen(false);
        setCreateForm({ name: '', address: '', lat: '', lng: '', phone: '', description: '' });
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
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600"
          >
            + 매장 등록
          </button>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-4">
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
        </div>

        {/* 통계 */}
        {pagination && (
          <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <p className="text-gray-600">
              총 <span className="font-bold text-primary-600">{pagination.total}</span>개 매장
            </p>
          </div>
        )}

        {/* 테이블 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">매장명</th>
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : stores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
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

            <div className="space-y-3 mb-6">
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
            {(selectedStore as any).reports?.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">신고 내역</h3>
                <div className="space-y-2">
                  {(selectedStore as any).reports.map((report: any) => (
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
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-6">매장 등록 (관리자)</h2>

            <div className="space-y-4">
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
    </div>
  );
}
