'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ALL_TESTS } from '@/lib/tests/test-data';
import Button from '@/components/Button';

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = parseInt(params?.id as string);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const testDef = ALL_TESTS[testId];

  useEffect(() => {
    // 비회원도 테스트 가능
    // 로그인 확인은 제거
  }, [router]);

  if (!testDef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            테스트를 찾을 수 없습니다
          </h1>
          <Button onClick={() => router.push('/test')}>
            테스트 목록으로
          </Button>
        </div>
      </div>
    );
  }

  const question = testDef.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / testDef.questions.length) * 100;

  const handleAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (!answers[question.id]) {
      setError('답변을 선택해주세요');
      return;
    }
    setError('');

    if (currentQuestion < testDef.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const answerArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId: parseInt(questionId),
        value,
      }));

      if (token) {
        // 로그인된 사용자: API에 제출
        const response = await fetch('/api/test/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            testType: testId,
            answers: answerArray,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '테스트 제출 실패');
        }

        // 결과 페이지로 이동
        router.push(`/test/${testId}/result`);
      } else {
        // 비회원: localStorage에 저장
        const guestResults = JSON.parse(localStorage.getItem('guestResults') || '[]');

        // 클라이언트에서 간단히 점수 계산 (임시)
        const totalScore = answerArray.reduce((sum, ans) => sum + ans.value, 0);
        const avgScore = totalScore / answerArray.length;

        // 기존 결과 제거하고 새 결과 추가
        const filteredResults = guestResults.filter((r: Record<string, any>) => r.testType !== testId);
        filteredResults.push({
          testType: testId,
          answers: answerArray,
          avgScore,
          completedAt: new Date().toISOString(),
        });

        localStorage.setItem('guestResults', JSON.stringify(filteredResults));

        // 결과 페이지로 이동
        router.push(`/test/${testId}/result`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || '제출 중 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scaleLabels = [
    '전혀 아니다',
    '아니다',
    '보통',
    '그렇다',
    '매우 그렇다',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/test')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <div className="text-sm text-gray-600">
              {currentQuestion + 1} / {testDef.questions.length}
            </div>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 테스트 정보 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{testDef.emoji}</div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {testDef.title}
          </h1>
          <p className="text-gray-600">{testDef.description}</p>
        </div>

        {/* 질문 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 text-center leading-relaxed">
            {question.text}
          </h2>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleAnswer(value)}
                className={`w-full px-6 py-4 rounded-xl border-2 transition-all text-left ${
                  answers[question.id] === value
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {scaleLabels[value - 1]}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[question.id] === value
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {answers[question.id] === value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-4">
          {currentQuestion > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1"
            >
              이전
            </Button>
          )}
          <Button
            onClick={handleNext}
            isLoading={isSubmitting}
            className="flex-1"
          >
            {currentQuestion < testDef.questions.length - 1 ? '다음' : '완료'}
          </Button>
        </div>

        {/* 안내 문구 */}
        <p className="mt-6 text-center text-sm text-gray-500">
          💡 지난 3개월을 기준으로 솔직하게 답변해주세요
        </p>
      </div>
    </div>
  );
}
