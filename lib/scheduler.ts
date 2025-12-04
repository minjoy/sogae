import cron from 'node-cron';
import { runDailyMatchingJob } from './engines/matchingEngine';

/**
 * 매일 오전 9시에 매칭 작업 실행
 * Cron 표현식: "0 9 * * *" = 매일 9:00
 */
export function startMatchingScheduler() {
  console.log('[Scheduler] Starting daily matching scheduler...');

  // 매일 오전 9시에 실행
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Running daily matching job at 9:00 AM');
    try {
      await runDailyMatchingJob();
      console.log('[Scheduler] Daily matching job completed successfully');
    } catch (error) {
      console.error('[Scheduler] Daily matching job failed:', error);
    }
  }, {
    timezone: 'Asia/Seoul' // 한국 시간 기준
  });

  console.log('[Scheduler] Daily matching scheduler started (every day at 9:00 AM KST)');
}

/**
 * 테스트용: 즉시 매칭 작업 실행
 */
export async function runMatchingJobNow() {
  console.log('[Scheduler] Running matching job immediately for testing...');
  try {
    await runDailyMatchingJob();
    console.log('[Scheduler] Matching job completed successfully');
  } catch (error) {
    console.error('[Scheduler] Matching job failed:', error);
    throw error;
  }
}
