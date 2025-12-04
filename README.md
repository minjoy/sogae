# Sogae (소개) - 경제 성향 기반 매칭 서비스 MVP

경제 성향 설문을 통해 사용자를 분석하고, MBTI 스타일의 3글자 코드로 분류하여 매칭하는 데이팅 서비스입니다.

## 📋 주요 기능

### 1. 경제 성향 설문
- 8개 문항으로 구성된 경제 가치관/미래 계획/소비 성향 설문
- 3개 축을 기반으로 한 3글자 코드 생성 (예: SPL, CFR)
  - **첫 번째 축**: S(절약형) vs C(소비형)
  - **두 번째 축**: P(계획형) vs F(유연형)
  - **세 번째 축**: L(안정투자형) vs R(공격투자형)

### 2. 회원가입 및 인증
- 이메일 + 비밀번호 기반 회원가입
- 이메일 인증 토큰 방식
- JWT 기반 인증

### 3. 매칭 시스템
- 매일 오전 9시 자동 매칭 배치 작업
- 최대 5명의 이성 후보 배정
- 궁합 점수 기반 후보 선정
- 상호 선택 시 매칭 성공

### 4. 결제 및 연락처 공개
- 상호 매칭 시 1인당 3,000원 결제 (MVP는 시뮬레이션)
- 양쪽 모두 결제 시 연락처(이메일) 공개
- 이메일로 상대방 정보 발송

## 🛠️ 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: MySQL (Prisma ORM)
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer (SMTP)
- **Scheduler**: node-cron

## 🚀 시작하기

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 설정하세요 (`.env.example` 참고):

```env
DATABASE_URL="mysql://user:password@localhost:3306/sogae"
JWT_SECRET="your-jwt-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 2. 데이터베이스 설정 (Docker)

```bash
docker run -d \
  --name sogae-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=sogae \
  -e MYSQL_USER=user \
  -e MYSQL_PASSWORD=password \
  -p 3306:3306 \
  mysql:8.0
```

### 3. 패키지 설치 및 실행

```bash
pnpm install
pnpm db:push
pnpm dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 📡 주요 API 엔드포인트

### 인증
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/verify-email?token={token}` - 이메일 인증

### 설문
- `POST /api/survey/complete` - 설문 완료
- `GET /api/survey/my-result` - 내 결과 조회

### 매칭
- `POST /api/match/preference` - 매칭 설정
- `GET /api/match/today-candidates` - 오늘의 후보
- `POST /api/match/select` - 후보 선택
- `GET /api/match/mutual` - 상호 매칭 목록

### 결제
- `POST /api/payment/pay-for-match` - 결제 시뮬레이션

## 🎯 경제 성향 코드 시스템

8가지 타입: SPL, SPR, SFL, SFR, CPL, CPR, CFL, CFR

각 타입별로 잘 맞는 타입과 주의가 필요한 타입이 정의되어 있습니다.

---

**Made with ❤️ for economic matching**
