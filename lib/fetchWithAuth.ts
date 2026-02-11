import { getSession } from 'next-auth/react';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 인증이 필요한 API 요청을 위한 fetch wrapper
 * - 세션 체크 및 자동 리다이렉트
 * - JSON 응답 자동 파싱
 * - 에러 핸들링
 */
export async function fetchWithAuth<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { requireAuth = true, ...fetchOptions } = options;

  // 인증 필요 시 세션 체크
  if (requireAuth) {
    const session = await getSession();
    if (!session) {
      // 로그인 페이지로 리다이렉트
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { success: false, error: 'Unauthorized' };
    }

    // 밴 체크
    if (session.user?.isBanned) {
      if (typeof window !== 'undefined') {
        const bannedUntil = session.user.bannedUntil
          ? new Date(session.user.bannedUntil).toISOString()
          : 'permanent';
        window.location.href = `/auth-error?error=banned&bannedUntil=${bannedUntil}`;
      }
      return { success: false, error: 'Banned' };
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    // 인증 에러 처리
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { success: false, error: 'Unauthorized' };
    }

    // JSON 파싱
    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('Fetch error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * GET 요청 헬퍼
 */
export async function apiGet<T = unknown>(
  url: string,
  requireAuth = true
): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(url, {
    method: 'GET',
    requireAuth,
  });
}

/**
 * POST 요청 헬퍼
 */
export async function apiPost<T = unknown>(
  url: string,
  body: unknown,
  requireAuth = true
): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
    requireAuth,
  });
}

/**
 * PUT 요청 헬퍼
 */
export async function apiPut<T = unknown>(
  url: string,
  body: unknown,
  requireAuth = true
): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    requireAuth,
  });
}

/**
 * DELETE 요청 헬퍼
 */
export async function apiDelete<T = unknown>(
  url: string,
  requireAuth = true
): Promise<ApiResponse<T>> {
  return fetchWithAuth<T>(url, {
    method: 'DELETE',
    requireAuth,
  });
}
