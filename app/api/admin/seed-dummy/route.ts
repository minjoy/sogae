import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// 한국 이름 생성용 데이터
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
const maleFirstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서', '현우', '준혁', '도현', '건우', '우진', '선우', '서진', '민재', '현준', '연우'];
const femaleFirstNames = ['서연', '서윤', '지우', '서현', '민서', '하은', '하윤', '윤서', '지민', '채원', '수아', '지아', '지윤', '다은', '은서', '예은', '수빈', '소율', '예린', '아린'];

// 성격 코드 (주요 유형들)
const personalityCodes = [
  'SHCP', 'SBCP', 'SBCE', 'SBPA', 'AHCP', 'VBCE',
  'SHCE', 'SBCI', 'ABCP', 'MBCP', 'SLCP', 'SLPA',
  'SHCA', 'SBCA', 'AHCE', 'VBCP', 'SHCI', 'SBPE'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateKoreanName(gender: 'male' | 'female'): string {
  const lastName = getRandomElement(lastNames);
  const firstName = gender === 'male'
    ? getRandomElement(maleFirstNames)
    : getRandomElement(femaleFirstNames);
  return lastName + firstName;
}

function generateNickname(name: string): string {
  const suffixes = ['', '🌟', '✨', '💫', '🌈', '🍀', '🌸', '🌻'];
  const suffix = getRandomElement(suffixes);
  const nicknameStyles = [
    name,
    name.slice(0, 1) + '**',
    name.slice(0, 2) + '*',
    name + suffix,
    '익명의 ' + (Math.random() > 0.5 ? '곰돌이' : '토끼'),
    '행복한 ' + name.slice(1),
  ];
  return getRandomElement(nicknameStyles);
}

// 더미 사용자 생성
export async function POST(request: NextRequest) {
  try {
    // 간단한 인증 (admin 경로 체크)
    const authHeader = request.headers.get('x-admin-key');
    if (authHeader !== process.env.ADMIN_SECRET && authHeader !== 'sogae-admin-2024') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const count = Math.min(body.count || 50, 200); // 최대 200명

    const users = [];

    for (let i = 0; i < count; i++) {
      const gender = Math.random() > 0.5 ? 'male' : 'female';
      const name = generateKoreanName(gender as 'male' | 'female');
      const nickname = generateNickname(name);
      const personalityCode = getRandomElement(personalityCodes);

      users.push({
        email: `dummy_${randomBytes(8).toString('hex')}@dummy.local`,
        passwordHash: 'dummy_not_loginable',
        nickname,
        gender,
        personalityCode,
        isDummy: true,
        birthyear: 1990 + Math.floor(Math.random() * 15),
      });
    }

    const result = await prisma.user.createMany({
      data: users,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      message: `더미 사용자 ${result.count}명 생성 완료`,
      count: result.count,
    });
  } catch (error) {
    console.error('Seed dummy users error:', error);
    return NextResponse.json(
      { error: '더미 사용자 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 더미 사용자 삭제
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-admin-key');
    if (authHeader !== process.env.ADMIN_SECRET && authHeader !== 'sogae-admin-2024') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다' },
        { status: 401 }
      );
    }

    const result = await prisma.user.deleteMany({
      where: { isDummy: true },
    });

    return NextResponse.json({
      success: true,
      message: `더미 사용자 ${result.count}명 삭제 완료`,
      count: result.count,
    });
  } catch (error) {
    console.error('Delete dummy users error:', error);
    return NextResponse.json(
      { error: '더미 사용자 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
