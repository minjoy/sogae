'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    nickname: '',
    gender: '',
    birthyear: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일을 입력해주세요';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (formData.password.length < 8) {
      newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }

    if (!formData.nickname) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (formData.nickname.length < 2) {
      newErrors.nickname = '닉네임은 최소 2자 이상이어야 합니다';
    }

    if (!formData.gender) {
      newErrors.gender = '성별을 선택해주세요';
    }

    if (!formData.birthyear) {
      newErrors.birthyear = '출생연도를 입력해주세요';
    } else {
      const year = parseInt(formData.birthyear);
      const currentYear = new Date().getFullYear();
      if (year < 1950 || year > currentYear - 18) {
        newErrors.birthyear = '올바른 출생연도를 입력해주세요 (만 18세 이상)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nickname: formData.nickname,
          gender: formData.gender,
          birthyear: parseInt(formData.birthyear),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || '회원가입에 실패했습니다' });
        return;
      }

      // 토큰 저장
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 비회원 테스트 데이터 삭제
      localStorage.removeItem('guestResults');

      // 테스트 페이지로 이동
      router.push('/test');
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: '회원가입 중 오류가 발생했습니다' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 76 }, (_, i) => currentYear - 18 - i);

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 via-primary-50 to-white flex items-center justify-center px-4 py-4">
      <div className="max-w-md w-full">
        {/* 로고 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">💕</span>
            <div>
              <div className="text-3xl font-bold text-primary-600">언연이</div>
              <div className="text-xs text-gray-500">언제 연애하는게 이득일까</div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">나의 연애 타이밍 찾기</h1>
          <p className="text-gray-600">현재 마음 상태를 분석하고 최적의 타이밍을 알아보세요</p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 border border-primary-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="이메일"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="your@email.com"
            />

            <Input
              label="닉네임"
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              error={errors.nickname}
              placeholder="다정한 닉네임을 지어주세요"
            />

            {/* 성별 선택 */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                성별 <span className="text-primary-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, gender: 'M' }));
                    setErrors((prev) => ({ ...prev, gender: '' }));
                  }}
                  className={`py-4 rounded-xl border-2 transition-all ${
                    formData.gender === 'M'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  남성
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, gender: 'F' }));
                    setErrors((prev) => ({ ...prev, gender: '' }));
                  }}
                  className={`py-4 rounded-xl border-2 transition-all ${
                    formData.gender === 'F'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 font-semibold'
                      : 'border-gray-200 hover:border-primary-200'
                  }`}
                >
                  여성
                </button>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* 출생연도 */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                출생연도 <span className="text-primary-600">*</span>
              </label>
              <select
                name="birthyear"
                value={formData.birthyear}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-gray-900 font-semibold ${
                  errors.birthyear ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">선택해주세요</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
              {errors.birthyear && (
                <p className="mt-1 text-sm text-red-600">{errors.birthyear}</p>
              )}
            </div>

            <Input
              label="비밀번호"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="8자 이상 입력해주세요"
            />

            <Input
              label="비밀번호 확인"
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              error={errors.passwordConfirm}
              placeholder="비밀번호를 다시 입력해주세요"
            />

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="mt-6 py-4 text-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700"
            >
              시작하기
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary-600 font-semibold hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-xs text-center text-gray-500 leading-relaxed">
          회원가입 시 서비스 이용약관 및 개인정보처리방침에 동의하게 됩니다.<br />
          여러분의 소중한 정보는 안전하게 보호됩니다. 💝
        </p>
      </div>
    </div>
  );
}
