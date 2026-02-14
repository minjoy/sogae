'use client';

import { useState, useEffect, useCallback } from 'react';

// 세션 만료 시간 (24시간)
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'adminSession';

interface AdminSession {
  password: string;
  expiry: number;
}

interface UseAdminAuthReturn {
  password: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  getStoredPassword: () => string | null;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 저장된 비밀번호 가져오기
  const getStoredPassword = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;

    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;

    try {
      const { password: storedPassword, expiry } = JSON.parse(storedData) as AdminSession;

      // 세션 만료 확인
      if (Date.now() > expiry) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return storedPassword;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  // 세션 저장
  const saveSession = useCallback((pwd: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        password: pwd,
        expiry: Date.now() + SESSION_EXPIRY_MS,
      }));
    }
  }, []);

  // 로그인
  const login = useCallback(async (pwd: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      const data = await response.json();

      if (data.success) {
        setPassword(pwd);
        setIsAuthenticated(true);
        saveSession(pwd);
        return true;
      } else {
        setError(data.error || '인증 실패');
        return false;
      }
    } catch {
      setError('서버 오류가 발생했습니다');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  // 로그아웃
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setPassword('');
    setIsAuthenticated(false);
  }, []);

  // 초기 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      const storedPassword = getStoredPassword();

      if (!storedPassword) {
        setIsLoading(false);
        return;
      }

      // 저장된 비밀번호로 자동 로그인
      try {
        const response = await fetch('/api/admin/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: storedPassword }),
        });

        const data = await response.json();

        if (data.success) {
          setPassword(storedPassword);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [getStoredPassword]);

  return {
    password,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getStoredPassword,
  };
}
