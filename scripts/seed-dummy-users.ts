/**
 * 더미 사용자 생성 스크립트
 * 실행: npx ts-node scripts/seed-dummy-users.ts
 * 또는 API 호출: POST /api/admin/seed-dummy
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

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
  const adjectives = ['행복한', '즐거운', '따뜻한', '귀여운', '멋진', '사랑스런', '빛나는', '포근한'];
  const nicknameStyles = [
    name,
    name + suffix,
    getRandomElement(adjectives) + ' ' + name.slice(1),
    name.slice(1) + suffix,
  ];
  return getRandomElement(nicknameStyles);
}

export async function seedDummyUsers(count: number = 50) {
  console.log(`더미 사용자 ${count}명 생성 시작...`);

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
      birthyear: 1990 + Math.floor(Math.random() * 15), // 1990-2004
    });
  }

  // 배치로 생성
  const result = await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log(`더미 사용자 ${result.count}명 생성 완료!`);
  return result;
}

// 더미 사용자 삭제
export async function deleteDummyUsers() {
  const result = await prisma.user.deleteMany({
    where: { isDummy: true },
  });
  console.log(`더미 사용자 ${result.count}명 삭제 완료!`);
  return result;
}

// CLI로 직접 실행 시
if (require.main === module) {
  const action = process.argv[2];

  if (action === 'delete') {
    deleteDummyUsers()
      .then(() => prisma.$disconnect())
      .catch(console.error);
  } else {
    const count = parseInt(process.argv[2]) || 50;
    seedDummyUsers(count)
      .then(() => prisma.$disconnect())
      .catch(console.error);
  }
}
