import prisma from '../config/prisma';
import { SentimentService } from '../services/ai/ai.sentiment';

// Gemini free-tier: 20 request/ngày dùng chung với chatbox AI + nút "AI đánh giá ngay" của Admin.
// Chỉ thử lại tối đa 3 đánh giá/lượt quét để dành phần lớn hạn mức cho người dùng thật.
const MAX_ITEMS_PER_RUN = 3;
// 5 request/phút là giới hạn free-tier của Gemini -> nghỉ 13s giữa các lần gọi trong cùng 1 lượt quét.
const DELAY_BETWEEN_CALLS_MS = 13000;
const SCAN_INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 tiếng/lượt

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runSentimentRetryScan = async () => {
  try {
    const pending = await prisma.danh_gia.findMany({
      where: { cam_xuc: null, nhan_xet: { not: null } },
      orderBy: { ngay_cap_nhat: 'asc' },
      take: MAX_ITEMS_PER_RUN,
    });

    const withContent = pending.filter(r => r.nhan_xet && r.nhan_xet.trim());
    if (withContent.length === 0) return;

    console.log(`[Sentiment Retry Job] Thử phân tích lại ${withContent.length} đánh giá chưa có cảm xúc AI...`);

    for (let i = 0; i < withContent.length; i++) {
      const review = withContent[i];
      const result = await SentimentService.classify(review.nhan_xet as string, review.so_sao);

      if (!result) {
        // Nhiều khả năng đang hết quota Gemini trong ngày -> dừng lượt quét này ngay, để lượt sau
        // (khi quota có thể đã hồi) tự thử lại thay vì tiếp tục gọi API rồi lại thất bại.
        console.log('[Sentiment Retry Job] Gọi AI thất bại (có thể hết quota hôm nay), dừng lượt quét, sẽ tự thử lại vào lượt sau.');
        break;
      }

      await prisma.danh_gia.update({
        where: { id: review.id },
        data: {
          cam_xuc: result.sentiment,
          do_tin_cay: result.confidence,
          ly_do_cam_xuc: result.reason,
          de_xuat_hanh_dong: result.suggestedAction,
          de_xuat_phan_hoi: result.draftReply,
        },
      });
      console.log(`[Sentiment Retry Job] OK đánh giá ${review.id} -> ${result.sentiment}`);

      if (i < withContent.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
    }
  } catch (error) {
    console.error('[Sentiment Retry Job] Lỗi khi quét đánh giá chờ phân tích cảm xúc:', error);
  }
};

export const initSentimentRetryJob = () => {
  console.log('🤖 Chức năng tự động thử lại phân tích cảm xúc đánh giá (Native Interval Scheduler) đã khởi động!');

  // Không quét ngay lúc khởi động (khác reminder job): server dev dùng nodemon, restart liên tục khi
  // sửa code sẽ vô tình gọi Gemini tốn quota không cần thiết -> chỉ quét theo chu kỳ định kỳ bên dưới.
  setInterval(runSentimentRetryScan, SCAN_INTERVAL_MS);
};
