import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/utils/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, gender, birthYear, region, tempToken } = body;

    // 입력 검증
    if (!email || !password || !name || !gender || !birthYear || !region) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: '이미 사용 중인 이메일입니다.' }, { status: 400 });
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        gender,
        birthYear: parseInt(birthYear),
        region,
        isEmailVerified: false,
      },
    });

    // tempToken이 있으면 설문 결과 연결
    if (tempToken) {
      try {
        const surveyToken = await prisma.temporarySurveyToken.findUnique({
          where: { token: tempToken },
          include: { surveyResult: true },
        });

        if (surveyToken && surveyToken.expiresAt > new Date()) {
          await prisma.economicSurveyResult.update({
            where: { id: surveyToken.surveyResultId },
            data: { userId: user.id },
          });
        }
      } catch (error) {
        console.error('Error linking survey result:', error);
      }
    }

    // 이메일 인증 토큰 생성
    const verificationToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // 이메일 발송
    try {
      await sendVerificationEmail(email, verificationToken, name);
    } catch (error) {
      console.error('Error sending verification email:', error);
    }

    return NextResponse.json(
      {
        message: '회원가입이 완료되었습니다. 이메일을 확인해 주세요.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: '회원가입에 실패했습니다.' }, { status: 500 });
  }
}
