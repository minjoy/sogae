# 언연이 (Unyeoni)

> 언제 연애하는게 이득일까?

현재의 마음 상태를 분석해서 연애할 타이밍인지, 어떤 상태의 상대방이 잘 어울리는지 분석하는 서비스입니다.

## 🎯 핵심 가치

- **타이밍 분석**: 5가지 테스트로 현재 연애 준비 상태 파악
- **상대 매칭**: 나와 잘 어울리는 상대방 유형 분석
- **나 사용설명서**: 통합 카드로 나를 소개하고 공유

## 🧪 5가지 테스트

1. **감정 타입** 💭 - 불안/회피/몰입/완벽주의 패턴
2. **소비 성향** 💰 - 위로/인정/통제/충동 소비 이해
3. **일 처리 방식** ⚡ - 계획/탐색/즉흥/마감 성향
4. **갈등 스타일** 💬 - 회피/공격/설득/수용 대화법
5. **번아웃 위험도** 🔋 - 현재 에너지 상태 측정

## 🛠 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL (AWS RDS)
- **ORM**: Prisma
- **Authentication**: JWT
- **Deployment**: AWS EC2

## 📦 설치 및 실행

```bash
# 패키지 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에 실제 데이터베이스 정보 입력

# Prisma 마이그레이션
npx prisma migrate dev

# Prisma Client 생성
npx prisma generate

# 개발 서버 실행
npm run dev
```

## 🗄️ 데이터베이스 설정

`.env` 파일에 MySQL 연결 정보를 입력하세요:

```
DATABASE_URL="mysql://username:password@host:3306/sogae"
JWT_SECRET="your-secret-key-min-32-characters"
```

## 📁 프로젝트 구조

```
sogae/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   ├── (auth)/         # 인증 관련 페이지
│   ├── test/           # 테스트 페이지
│   ├── my/             # 마이페이지
│   └── card/           # 공유 카드 페이지
├── lib/                # 유틸리티 및 로직
│   ├── prisma.ts       # Prisma 클라이언트
│   ├── auth.ts         # 인증 유틸리티
│   └── tests/          # 테스트 관련 로직
│       ├── test-data.ts    # 테스트 질문
│       ├── scoring.ts      # 채점 로직
│       └── readiness.ts    # 준비 상태 계산
├── components/         # React 컴포넌트
└── prisma/            # Prisma 스키마
```

## 🚀 배포 정보

- **EC2 Instance**: sogae (i-082150d38ae7d50d2)
- **Public IP**: 3.34.99.23
- **Region**: ap-northeast-2 (Seoul)

## 📝 면책 조항

이 서비스의 결과는 참고용이며, 전문 상담이나 의료 진단을 대체하지 않습니다.

## 📄 License

MIT
