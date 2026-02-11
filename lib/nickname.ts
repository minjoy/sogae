// 닉네임 블랙리스트 단어
const BLACKLIST_WORDS = [
  '관리자', 'admin', 'administrator', 'root', 'system',
  '운영자', '매니저', 'manager', 'staff', 'official',
  '섹스', '씹', '좆', '보지', '자지', 'sex', 'fuck', 'shit',
  '병신', '지랄', '년', '놈', '새끼',
  '카카오', 'kakao', '네이버', 'naver', '구글', 'google',
];

// 닉네임 패턴 (한글, 영문, 숫자, 언더스코어)
const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9_]+$/;

export interface NicknameValidationResult {
  valid: boolean;
  error?: string;
}

export function validateNickname(nickname: string): NicknameValidationResult {
  // 길이 체크 (2~10자)
  if (nickname.length < 2) {
    return { valid: false, error: '닉네임은 2자 이상이어야 합니다.' };
  }

  if (nickname.length > 10) {
    return { valid: false, error: '닉네임은 10자 이하여야 합니다.' };
  }

  // 패턴 체크
  if (!NICKNAME_PATTERN.test(nickname)) {
    return { valid: false, error: '닉네임은 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.' };
  }

  // 블랙리스트 체크
  const lowerNickname = nickname.toLowerCase();
  for (const word of BLACKLIST_WORDS) {
    if (lowerNickname.includes(word.toLowerCase())) {
      return { valid: false, error: '사용할 수 없는 단어가 포함되어 있습니다.' };
    }
  }

  // user_ 로 시작하는 임시 닉네임 형식 체크
  if (/^user_[a-f0-9]+(_\d+)?$/i.test(nickname)) {
    return { valid: false, error: '다른 닉네임을 선택해주세요.' };
  }

  return { valid: true };
}

// 랜덤 닉네임 생성 (추천용)
export function generateRandomNickname(): string {
  const adjectives = ['귀여운', '멋진', '행복한', '신나는', '즐거운', '활발한', '상큼한', '달달한'];
  const nouns = ['토끼', '고양이', '강아지', '판다', '펭귄', '코알라', '다람쥐', '곰돌이'];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);

  return `${adj}${noun}${num}`;
}
