'use client';

import { usePathname, useRouter } from 'next/navigation';

interface FaceAnalysisToggleProps {
  variant?: 'light' | 'dark';
}

export default function FaceAnalysisToggle({ variant = 'dark' }: FaceAnalysisToggleProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isCompatibility = pathname?.includes('/compatibility');

  const bgClass = variant === 'light'
    ? 'bg-gray-100 border-gray-200'
    : 'bg-white/10 backdrop-blur border-white/20';

  const inactiveClass = variant === 'light'
    ? 'text-gray-500 hover:text-gray-700'
    : 'text-white/70 hover:text-white';

  return (
    <div className="flex justify-center mb-6">
      <div className={`inline-flex ${bgClass} rounded-full p-1 border`}>
        <button
          onClick={() => router.push('/face-analysis')}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            !isCompatibility
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
              : inactiveClass
          }`}
        >
          <span className="mr-1.5">👤</span>
          한사람 관상
        </button>
        <button
          onClick={() => router.push('/face-analysis/compatibility')}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            isCompatibility
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
              : inactiveClass
          }`}
        >
          <span className="mr-1.5">👥</span>
          두사람 궁합
        </button>
      </div>
    </div>
  );
}
