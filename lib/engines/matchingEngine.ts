import { prisma } from '../prisma';
import { calculateCompatibilityScore } from './compatibilityEngine';

/**
 * 매일 9시에 실행되는 매칭 배치 작업
 */
export async function runDailyMatchingJob(): Promise<void> {
  console.log('[Matching Job] Starting daily matching job...');

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정

  try {
    // 1. 매칭 참여 중인 유저 목록 조회
    const participatingUsers = await prisma.user.findMany({
      where: {
        isEmailVerified: true,
        matchPreference: {
          isParticipating: true,
        },
      },
      include: {
        matchPreference: true,
        surveyResults: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    console.log(`[Matching Job] Found ${participatingUsers.length} participating users`);

    // 2. 각 유저에 대해 후보 생성
    for (const user of participatingUsers) {
      // 설문 결과가 없으면 스킵
      if (user.surveyResults.length === 0) {
        console.log(`[Matching Job] User ${user.id} has no survey result, skipping`);
        continue;
      }

      const userCode = user.surveyResults[0].code3;
      const preference = user.matchPreference!;

      // 3. 반대 성별 후보 찾기
      const oppositeGender = user.gender === 'male' ? 'female' : 'male';

      // 4. 나이 필터
      const currentYear = new Date().getFullYear();
      const minBirthYear = preference.preferredMaxAge
        ? currentYear - preference.preferredMaxAge
        : 1900;
      const maxBirthYear = preference.preferredMinAge
        ? currentYear - preference.preferredMinAge
        : currentYear;

      // 5. 후보 쿼리
      const candidates = await prisma.user.findMany({
        where: {
          id: { not: user.id },
          gender: oppositeGender,
          isEmailVerified: true,
          birthYear: {
            gte: minBirthYear,
            lte: maxBirthYear,
          },
          ...(preference.preferredRegion && {
            region: preference.preferredRegion,
          }),
          matchPreference: {
            isParticipating: true,
          },
          surveyResults: {
            some: {},
          },
          // 오늘 이미 후보로 뽑힌 사람 제외
          candidatesOwned: {
            none: {
              ownerUserId: user.id,
              date: today,
            },
          },
        },
        include: {
          surveyResults: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        take: 50, // 일단 50명 가져와서 필터링
      });

      // 6. 궁합 점수 계산 및 정렬
      const scoredCandidates = candidates
        .filter((candidate) => candidate.surveyResults.length > 0)
        .map((candidate) => ({
          candidate,
          score: calculateCompatibilityScore(userCode, candidate.surveyResults[0].code3),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // 상위 5명만

      // 7. DailyCandidate 생성
      for (const { candidate } of scoredCandidates) {
        await prisma.dailyCandidate.create({
          data: {
            date: today,
            ownerUserId: user.id,
            candidateUserId: candidate.id,
          },
        });
      }

      console.log(
        `[Matching Job] Created ${scoredCandidates.length} candidates for user ${user.id}`
      );
    }

    console.log('[Matching Job] Daily matching job completed successfully');
  } catch (error) {
    console.error('[Matching Job] Error during daily matching job:', error);
    throw error;
  }
}

/**
 * 상호 선택 확인 및 MutualMatch 생성
 */
export async function checkAndCreateMutualMatch(
  userId: string,
  selectedUserId: string,
  date: Date
): Promise<boolean> {
  // 양방향으로 선택했는지 확인
  const userSelection = await prisma.dailySelection.findFirst({
    where: {
      userId,
      selectedUserId,
      date,
    },
  });

  const oppositeSelection = await prisma.dailySelection.findFirst({
    where: {
      userId: selectedUserId,
      selectedUserId: userId,
      date,
    },
  });

  if (userSelection && oppositeSelection) {
    // 상호 매칭 확인 - 이미 존재하는지 체크
    const existingMatch = await prisma.mutualMatch.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: selectedUserId },
          { userAId: selectedUserId, userBId: userId },
        ],
        date,
      },
    });

    if (!existingMatch) {
      // MutualMatch 생성
      await prisma.mutualMatch.create({
        data: {
          date,
          userAId: userId,
          userBId: selectedUserId,
          bothSelected: true,
        },
      });

      console.log(`[Mutual Match] Created mutual match between ${userId} and ${selectedUserId}`);
      return true;
    }
  }

  return false;
}
