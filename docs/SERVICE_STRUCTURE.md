# 서비스 구조 분석 문서

## 1. 프로젝트 개요

**프로젝트명**: 언연이 (mytype.co.kr)
**설명**: 연애 준비 상태 분석 및 성격 유형 매칭 플랫폼

### 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15.1.2, React 19, TypeScript |
| Backend | Node.js (Next.js App Router) |
| Database | MySQL (Prisma ORM) |
| Auth | NextAuth.js (Kakao OAuth) |
| UI | Tailwind CSS, Lucide React Icons |

---

## 2. 디렉토리 구조

```
/home/user/sogae/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # 인증 그룹 라우트
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── auth-error/page.tsx
│   │   └── onboarding/page.tsx
│   ├── api/                          # API 라우트
│   │   ├── auth/                     # 인증 관련
│   │   ├── test/                     # 테스트 관련
│   │   ├── card/                     # 카드 생성/조회
│   │   ├── stores/                   # 디저트 매장 관리
│   │   ├── users/                    # 사용자 관련
│   │   ├── face/                     # 관상 분석
│   │   ├── admin/                    # 관리자 API
│   │   └── ...
│   ├── test/                         # 테스트 페이지
│   ├── dessert-map/                  # 디저트맵
│   ├── face-analysis/                # 관상 분석 페이지
│   ├── personality/                  # 성격 분석 페이지
│   ├── card/[slug]/                  # 공유 카드 보기
│   ├── my/                           # 마이페이지
│   ├── share/test/[code]/            # 테스트 결과 공유
│   └── xq9k2m-admin-panel/           # 관리자 대시보드
├── lib/                              # 유틸리티 & 비즈니스 로직
│   ├── auth.ts                       # NextAuth 설정
│   ├── prisma.ts                     # Prisma 클라이언트
│   ├── face-analysis.ts              # 관상 분석 로직
│   ├── compatibility-analysis.ts     # 궁합 분석
│   ├── tests/                        # 테스트 관련 로직
│   └── types/                        # 타입 정의
├── components/                       # React 컴포넌트
├── prisma/
│   └── schema.prisma                 # DB 스키마
├── public/                           # 정적 파일
└── types/                            # 타입 정의
```

---

## 3. 데이터베이스 모델

### 주요 모델

| 모델 | 설명 |
|------|------|
| `User` | 사용자 정보 (Kakao OAuth, 애착유형, 레벨/경험치) |
| `TestResult` | 테스트 결과 (5가지 테스트) |
| `UnifiedCard` | 통합 성격 카드 |
| `DatingState` | 연애 준비 상태 |
| `DujjonkuStore` | 디저트 매장 정보 |
| `StoreReport` | 매장 신고 |
| `StoreEditRequest` | 매장 수정 요청 |
| `FaceAnalysis` | 관상 분석 결과 |
| `FaceCompatibility` | 관상 궁합 분석 |
| `BannedKakao` | 영구정지 관리 |

### User 모델 상세

```prisma
model User {
  id                String
  kakaoId           String         @unique
  nickname          String?
  gender            String?
  birthYear         Int?
  attachmentStyle   String?        // 애착유형
  readinessScore    Int?           // 연애 준비도
  personalityCode   String?        // 성격 코드 (4글자)
  level             Int            @default(1)
  exp               Int            @default(0)
  bannedUntil       DateTime?      // 정지 기간
  onboardingCompleted Boolean      @default(false)
}
```

### DujjonkuStore 모델 상세

```prisma
model DujjonkuStore {
  id          String
  name        String
  address     String
  lat         Float
  lng         Float
  category    String[]    // dujjonku, dubai, signature
  price       Int?
  clickCount  Int         @default(0)
  reportCount Int         @default(0)
  isHidden    Boolean     @default(false)
}
```

---

## 4. API 엔드포인트

### 인증 API

| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth 핸들러 |
| POST | `/api/auth/logout` | 로그아웃 |

### 테스트 API

| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/test/submit` | 테스트 제출 및 채점 |
| GET | `/api/test/results` | 테스트 결과 조회 |
| DELETE | `/api/test/results` | 모든 테스트 삭제 |

**테스트 타입**:
1. 감정 타입 (불안형, 회피형, 몰입형 등)
2. 소비 심리 (위로/인정/통제/충동 소비)
3. 일 처리 방식 (계획형, 탐색형, 즉흥형 등)
4. 갈등 대처법 (회피, 공격, 설득, 수용)
5. 번아웃 위험도

### 카드 API

| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/card/generate` | 통합 카드 생성 |
| GET | `/api/card/list` | 사용자 카드 목록 |
| GET | `/api/card/[slug]` | 공유 카드 조회 |

### 사용자 API

| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/users/me` | 현재 사용자 정보 |
| GET | `/api/users/check-nickname` | 닉네임 중복 확인 |
| GET | `/api/users/matching` | 성격 코드 매칭 |

### 디저트 매장 API

| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/stores` | 맵 바운드 기반 매장 목록 |
| POST | `/api/stores` | 매장 등록 |
| GET | `/api/stores/[id]` | 매장 상세 정보 |
| POST | `/api/stores/[id]/report` | 매장 신고 |
| POST | `/api/stores/[id]/edit-request` | 매장 수정 요청 |

### 관상 분석 API

| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | `/api/face/analyze` | 얼굴 분석 |
| POST | `/api/face/save` | 분석 결과 저장 |
| GET | `/api/face/result/[code]` | 분석 결과 조회 |
| POST | `/api/face/compatibility/analyze` | 궁합 분석 |
| GET | `/api/face/compatibility/result/[code]` | 궁합 결과 조회 |

### 관리자 API

| 메소드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET/POST | `/api/admin/stores` | 모든 매장 관리 |
| GET/PUT/DELETE | `/api/admin/stores/[id]` | 매장 상세 관리 |
| GET | `/api/admin/users` | 사용자 관리 |
| GET | `/api/admin/stats` | 통계 |
| GET/PUT | `/api/admin/store-edit-requests/[id]` | 수정 요청 관리 |
| GET | `/api/admin/face-results` | 관상 분석 결과 관리 |

---

## 5. 페이지 라우팅

### 공개 페이지

| 경로 | 설명 |
|------|------|
| `/` | 홈페이지 |
| `/test` | 테스트 목록 |
| `/test/[id]` | 개별 테스트 |
| `/test/[id]/result` | 테스트 결과 |
| `/personality` | 성격 분석 페이지 |
| `/card/[slug]` | 공유 카드 보기 |
| `/share/test/[code]` | 테스트 결과 공유 |
| `/dessert-map` | 디저트맵 |
| `/face-analysis` | 관상 분석 |
| `/face-analysis/compatibility` | 관상 궁합 분석 |

### 인증 페이지

| 경로 | 설명 |
|------|------|
| `/login` | 로그인 (Kakao OAuth) |
| `/signup` | 회원가입 |
| `/onboarding` | 온보딩 |
| `/auth-error` | 인증 오류 |

### 사용자 페이지

| 경로 | 설명 |
|------|------|
| `/my` | 마이페이지 |

### 관리자 페이지

| 경로 | 설명 |
|------|------|
| `/xq9k2m-admin-panel` | 관리자 대시보드 |
| `/xq9k2m-admin-panel/users` | 사용자 관리 |
| `/xq9k2m-admin-panel/dessert` | 디저트 매장 관리 |
| `/xq9k2m-admin-panel/face-results` | 관상 분석 결과 관리 |

---

## 6. 주요 비즈니스 로직

### 테스트 채점 시스템 (`lib/tests/scoring.ts`)

1. 역채점 처리 (특정 문항)
2. 하위척도별 점수 계산 (1-5점 평균)
3. 백분위 변환 (0-100 스케일)
4. 테스트별 결과 라벨 생성
5. 호환 성격 타입 제시

### 성격 유형 생성 (`lib/types/personality-types.ts`)

구성 요소:
- Attachment Style: ANX/AVD 점수 기반
- Energy Level: 번아웃 점수 기반
- Conflict Style: 갈등 처리 기반
- Lifestyle Mode: 일 처리 기반
- Spending Pattern: 소비 심리 기반

결과: 4글자 성격 코드 (SHCP 형태)

### 연애 준비도 계산 (`lib/tests/readiness.ts`)

4가지 평가 요소:
1. 정서 안정성 (Emotional Stability)
2. 자기 조절 (Self-Regulation)
3. 관계 기술 (Relationship Skills)
4. 심리 자원 (Psychological Resources)

결과:
- `readinessScore`: 0-100
- `modeLabel`: "적극 추천", "천천히 권장", "회복 권장"

### 관상 분석 (`lib/face-analysis.ts`)

입력: MediaPipe 468개 랜드마크

처리:
1. 얼굴 각도 계산 (pan, tilt, roll)
2. 부위별 특성 분석 (눈, 코, 입, 턱, 얼굴형, 미간)
3. 4가지 카테고리 점수 계산:
   - r1: 권력/운명
   - r2: 정신/사랑
   - r3: 일/재물/사교
   - r4: 성실/책임

### 궁합 분석 (`lib/compatibility-analysis.ts`)

입력: 남성 관상 + 여성 관상

처리:
1. 카테고리별 점수 비교
2. 부위별 호환도 계산
3. 에너지 체크
4. 보너스 점수 적용

결과: `compatibilityScore` (0-100)

---

## 7. 인증 및 보안

### 인증 방식

- NextAuth.js v4 + JWT
- Kakao OAuth 2.0
- 세션 유효기간: 30일
- 쿠키 기반 저장

### 사용자 상태 관리

정지 상태:
1. **기간 정지** (`bannedUntil` 날짜 설정) - 자동 해제
2. **영구 정지** (`bannedUntil = null`) - `BannedKakao` 테이블 참조

### 관리자 인증

- 헤더 `x-admin-key` 검증
- API별 권한 확인

---

## 8. 외부 연동

| 서비스 | 용도 |
|--------|------|
| Kakao OAuth | 로그인/회원가입 |
| Google Analytics | 사용자 행동 추적 |
| Google AdSense | 광고 표시 |
| Naver Search | 디저트 매장 검색 연동 |

---

## 9. 개선 포인트

### 보안 이슈
- 관리자 키 하드코딩 → 환경변수로 관리 필요
- base64 이미지 저장으로 DB 용량 증가
- 클라이언트 IP 기반 추적 (프라이버시)

### 성능 최적화 기회
- 이미지 압축 전 저장
- CDN 활용
- 쿼리 캐싱 전략
- 데이터베이스 읽기 복제

### 기술 부채
- 관상 분석 로직 파일 크기 (61KB)
- 타입 정의 파일 크기 (39KB)
- 하드코딩된 상수들

---

*문서 생성일: 2026-02-14*
