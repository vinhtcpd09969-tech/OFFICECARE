import { GoogleGenerativeAI, SchemaType, FunctionDeclaration, Part, Content } from '@google/generative-ai';
import prisma from '../config/prisma';
import appointmentService from './appointment.service';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

const STATIC_HEADER = `
Bạn là trợ lý y khoa ảo của trung tâm vật lý trị liệu phục hồi chức năng OfficeCare.
Nhiệm vụ của bạn là tư vấn sức khỏe liên quan đến cơ xương khớp, trị liệu phục hồi và hướng dẫn khách hàng theo quy trình khoa học.

⚠️ RÀNG BUỘC AN TOÀN Y TẾ (kiểm tra điều này TRƯỚC mọi phản hồi khác, ưu tiên cao nhất):
Nếu khách hàng mô tả bất kỳ dấu hiệu nào sau đây: đau ngực dữ dội, khó thở, yếu/liệt tay chân đột ngột, mất ý thức, chấn thương nặng (gãy xương hở, chảy máu nhiều), tê liệt nửa người, nói khó/méo miệng đột ngột — PHẢI DỪNG NGAY việc tư vấn gói dịch vụ, KHÔNG phân tích triệu chứng, và chỉ trả lời khuyên khách gọi ngay 115 hoặc đến cơ sở y tế/bệnh viện gần nhất. Trong trường hợp này luôn đặt suggest_booking = false.
`;

const STATIC_FLOW_AND_RULES = `
Bạn là một AI Trợ lý Y Khoa THÔNG MINH BẬC NHẤT, có khả năng NHẬN DIỆN CẢM XÚC VÀ TÂM LÝ KHÁCH HÀNG (Emotional & Intent Intelligence) để đưa ra câu trả lời linh hoạt 100% theo đúng nhu cầu:

BƯỚC 1: PHÂN PHẠM VI CẢM XÚC & NGUYỆN VỌNG CỦA KHÁCH HÀNG:

👉 CHẾ ĐỘ 1: KHÁCH ĐANG MỆT MỎI, STRESS, CHẠY DEADLINE, MUỐN THƯ GIÃN NGAY, CẦN CÂU TRẢ LỜI NHANH
(Dấu hiệu: Khách nhắc đến "chạy deadline", "stress", "mệt mỏi quá", "muốn thư giãn", "lười đọc", hoặc hỏi thẳng "dịch vụ ở đây có làm được không?")
- NGUYÊN TẮC: KHÔNG viết dài dòng lê thê, KHÔNG phân tích dông dài 1-2-3 làm khách mệt thêm.
- HÀNH ĐỘNG:
  1. Câu đầu tiên: Đồng cảm sâu sắc & Chấn an cảm xúc ngay lập tức (ví dụ: "Dạ OfficeCare rất thấu hiểu áp lực và sự mệt mỏi của bạn khi phải gồng mình chạy deadline liên tục những ngày qua!").
  2. Khẳng định dứt khoát: "Dạ dịch vụ tại OfficeCare HOÀN TOÀN GIẢI QUYẾT TRIỆT ĐỂ vấn đề đau lưng và stress này cho bạn ạ!"
  3. Giới thiệu ngắn gọn 1 gói trị liệu/massage thư giãn cơ sâu phù hợp nhất (kèm giá) và nhấn mạnh cảm giác sảng khoái sau khi làm xong.
  4. Đặt suggest_booking = true để khách bấm 1 chạm đặt lịch ngay mà không cần suy nghĩ nhiều.

👉 CHẾ ĐỘ 2: KHÁCH HỎI TÌM HIỂU CHUYÊN SÂU BỆNH LÝ & NGUYÊN NHÂN Y KHOA
(Dấu hiệu: Khách muốn tìm hiểu vì sao đau, triệu chứng bệnh lý, tư vấn phương pháp điều trị dài hạn)
- Trình bày mạch lạc 3 phần:
  1. 🔍 Phân tích nguyên nhân khả dĩ (do tư thế ngồi, căng cơ, thoái hóa...).
  2. 💡 Lời khuyên tự chăm sóc tại chỗ + Bài tập giãn cơ + Note cảnh báo: "📌 *Lưu ý: Phân tích chỉ mang tính chất tham khảo y khoa ban đầu, không thay thế cho chẩn đoán trực tiếp từ Bác sĩ.*"
  3. 🏥 Đề xuất gói OfficeCare phù hợp + Đặt suggest_booking = true.

👉 CHẾ ĐỘ 3: CHÀO HỎI CHUNG HOẶC CHƯA NÊU VÙNG ĐAU
- Chào lại ân cần, hỏi nhẹ nhàng khách đang bị đau vùng nào và đặt suggest_booking = false.

BƯỚC 2: SỬ DỤNG CÔNG CỤ TRA CỨU DỮ LIỆU THẬT KHI CẦN (bắt buộc, không được đoán/bịa số liệu):
- Nếu khách hỏi về lịch trống/còn giờ khám không của MỘT NGÀY CỤ THỂ (vd "mai còn lịch không", "thứ 7 này đặt được không") → PHẢI gọi tool "kiem_tra_lich_kham_trong" trước khi trả lời, không được tự đoán còn trống hay hết chỗ.
- Nếu khách hỏi về thông tin CỦA CHÍNH HỌ (gói đang điều trị, còn bao nhiêu buổi, điểm uy tín, lịch hẹn sắp tới) → PHẢI gọi tool "xem_thong_tin_ca_nhan" trước khi trả lời. Nếu tool trả về lỗi "chưa đăng nhập", hãy nhắc khách đăng nhập tài khoản để được tra cứu chính xác, không bịa số liệu thay thế.
- Sau khi có kết quả tool, tổng hợp lại bằng lời văn tự nhiên, không hiển thị nguyên JSON thô cho khách.

Quy tắc chung:
- CHỈ trả lời các câu hỏi về sức khỏe cơ xương khớp và dịch vụ trị liệu. Từ chối lịch sự các câu hỏi ngoài lề (như toán học, thời tiết, lập trình...), và đặt suggest_booking = false.
- Văn phong: Cực kỳ tinh tế, thông minh, linh hoạt theo tâm lý khách hàng.
- Chỉ dùng đúng số liệu/tên gói/giá/khuyến mãi được cung cấp trong ngữ cảnh hệ thống hoặc trả về từ tool — KHÔNG tự bịa số liệu, giá, hoặc chương trình khuyến mãi không có thật.

ĐỊNH DẠNG BẮT BUỘC CỦA MỖI CÂU TRẢ LỜI CUỐI CÙNG (sau khi đã gọi tool nếu cần):
Chỉ được trả lời bằng ĐÚNG 1 đối tượng JSON hợp lệ duy nhất, không kèm markdown code fence (không có \`\`\`), không kèm bất kỳ chữ nào khác ngoài JSON đó, theo đúng cấu trúc:
{"reply": "<nội dung trả lời khách bằng tiếng Việt>", "suggest_booking": true hoặc false}
`;

/** Khai báo các tool (function calling) mà AI được phép tự gọi để lấy dữ liệu THẬT thay vì đoán. */
const AI_TOOLS: FunctionDeclaration[] = [
  {
    name: 'kiem_tra_lich_kham_trong',
    description:
      'Tra cứu buổi sáng/chiều còn nhận khách THẬT trong hệ thống đặt lịch của OfficeCare cho một ngày cụ thể (hệ thống đặt lịch theo buổi, không còn khung giờ cố định). Dùng khi khách hỏi về việc đặt lịch cho 1 ngày xác định (hôm nay/ngày mai/thứ mấy/ngày dd-mm).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        ngay: {
          type: SchemaType.STRING,
          description: 'Ngày cần tra cứu, định dạng YYYY-MM-DD (tự quy đổi từ ngôn ngữ tự nhiên của khách sang định dạng này).',
        },
      },
      required: ['ngay'],
    },
  },
  {
    name: 'xem_thong_tin_ca_nhan',
    description:
      'Lấy thông tin cá nhân của khách hàng ĐANG ĐĂNG NHẬP trong phiên chat này: điểm uy tín, gói liệu trình đang điều trị (số buổi đã dùng/tổng số buổi, hạn sử dụng), lịch hẹn sắp tới gần nhất. Không cần tham số.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
];

async function toolKiemTraLichKhamTrong(args: any): Promise<object> {
  const ngay = typeof args?.ngay === 'string' ? args.ngay.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) {
    return { error: 'Ngày không hợp lệ, cần đúng định dạng YYYY-MM-DD.' };
  }
  const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (ngay < todayVN) {
    return { error: 'Ngày đã qua, không thể tra cứu lịch trống cho ngày trong quá khứ.' };
  }

  // Đặt lịch giờ theo mô hình BUỔI (sáng/chiều), không còn lưới giờ cố định — tra cứu mặc định cho
  // dịch vụ Lượng giá (không truyền dichVuId, khớp hành vi mặc định cũ của getBookedSlots).
  const result = await appointmentService.getBuoiAvailability(ngay);

  return {
    ngay,
    buoi_sang: {
      con_cho: result?.sang?.choPhep ?? false,
      so_phut_con_lai_uoc_tinh: result?.sang?.conLaiChung ?? 0,
    },
    buoi_chieu: {
      con_cho: result?.chieu?.choPhep ?? false,
      so_phut_con_lai_uoc_tinh: result?.chieu?.conLaiChung ?? 0,
    },
    so_nhan_su_truc_hom_do: (result?.nhanSu || []).length,
  };
}

async function toolXemThongTinCaNhan(khachHangId: string | null): Promise<object> {
  if (!khachHangId) {
    return { error: 'Khách đang chat ở chế độ vãng lai (chưa đăng nhập), không thể tra cứu thông tin cá nhân.' };
  }

  const customer = await prisma.khach_hang.findUnique({
    where: { id: khachHangId },
    select: { ho_ten: true, diem_uy_tin: true },
  });
  if (!customer) {
    return { error: 'Không tìm thấy thông tin tài khoản khách hàng.' };
  }

  const activePackage = await prisma.phac_do_dieu_tri.findFirst({
    where: { khach_hang_id: khachHangId, trang_thai: 'dang_dieu_tri' },
    orderBy: { ngay_kich_hoat: 'desc' },
    select: {
      so_buoi_da_dung: true,
      tong_so_buoi: true,
      han_su_dung: true,
      goi_dich_vu: { select: { ten_goi: true } },
    },
  });

  const nextAppointment = await prisma.cuoc_hen.findFirst({
    where: {
      khach_hang_id: khachHangId,
      trang_thai: 'da_xac_nhan',
      ngay_gio_bat_dau: { gt: new Date() },
    },
    orderBy: { ngay_gio_bat_dau: 'asc' },
    select: { ngay_gio_bat_dau: true, loai: true },
  });

  return {
    ten_khach_hang: customer.ho_ten,
    diem_uy_tin: customer.diem_uy_tin,
    goi_dang_dieu_tri: activePackage
      ? {
          ten_goi: activePackage.goi_dich_vu.ten_goi,
          so_buoi_da_dung: activePackage.so_buoi_da_dung,
          tong_so_buoi: activePackage.tong_so_buoi,
          han_su_dung: activePackage.han_su_dung ? activePackage.han_su_dung.toISOString().slice(0, 10) : null,
        }
      : null,
    lich_hen_sap_toi: nextAppointment
      ? {
          // Định dạng sẵn theo giờ Việt Nam trước khi đưa cho AI — trả nguyên chuỗi ISO (giờ UTC)
          // khiến model đọc thẳng số giờ UTC mà không tự quy đổi +7h, gây báo sai giờ hẹn cho khách
          // (vd 18:00 giờ VN bị đọc nhầm thành 11:00).
          thoi_gian: nextAppointment.ngay_gio_bat_dau.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          loai: nextAppointment.loai,
        }
      : null,
  };
}

async function executeTool(name: string, args: any, khachHangId: string | null): Promise<object> {
  try {
    if (name === 'kiem_tra_lich_kham_trong') return await toolKiemTraLichKhamTrong(args);
    if (name === 'xem_thong_tin_ca_nhan') return await toolXemThongTinCaNhan(khachHangId);
    return { error: `Không hỗ trợ công cụ "${name}".` };
  } catch (error) {
    console.error(`Lỗi khi thực thi tool AI "${name}":`, error);
    return { error: 'Không thể truy vấn dữ liệu hệ thống lúc này.' };
  }
}

async function buildSystemInstruction(): Promise<string> {
  const [packages, activeVouchers] = await Promise.all([
    prisma.goi_dich_vu.findMany({
      where: { trang_thai: 'hoat_dong' },
      select: { ten_goi: true, don_gia: true, loai_goi: true, tong_so_buoi: true, muc_tieu: true },
      orderBy: { ten_goi: 'asc' },
    }),
    prisma.khuyen_mai_voucher.findMany({
      where: {
        dang_kich_hoat: true,
        ngay_bat_dau: { lte: new Date() },
        OR: [{ ngay_het_han: null }, { ngay_het_han: { gte: new Date() } }],
      },
      select: { ma_code: true, ten_chien_dich: true, loai_giam_gia: true, gia_tri_giam: true, don_hang_toi_thieu: true },
      orderBy: { ngay_bat_dau: 'desc' },
      take: 10,
    }),
  ]);

  const serviceList = packages.length > 0
    ? packages.map((p, i) => {
        const gia = Number(p.don_gia).toLocaleString('vi-VN');
        const loaiLabel = p.loai_goi === 'KHAM'
          ? 'Khám'
          : p.loai_goi === 'LE'
            ? 'Dịch vụ lẻ'
            : `Liệu trình ${p.tong_so_buoi} buổi`;
        const mucTieu = p.muc_tieu ? ` — Mục tiêu: ${p.muc_tieu}` : '';
        return `${i + 1}. ${p.ten_goi} (${loaiLabel}, giá ${gia}đ)${mucTieu}`;
      }).join('\n')
    : 'Hiện chưa có dữ liệu gói dịch vụ.';

  const voucherList = activeVouchers.length > 0
    ? activeVouchers.map((v) => {
        const gia = v.loai_giam_gia === 'phan_tram' || v.loai_giam_gia === 'percentage'
          ? `giảm ${Number(v.gia_tri_giam)}%`
          : `giảm ${Number(v.gia_tri_giam).toLocaleString('vi-VN')}đ`;
        const dieuKien = Number(v.don_hang_toi_thieu) > 0
          ? ` (đơn tối thiểu ${Number(v.don_hang_toi_thieu).toLocaleString('vi-VN')}đ)`
          : '';
        return `- Mã "${v.ma_code}"${v.ten_chien_dich ? ` (${v.ten_chien_dich})` : ''}: ${gia}${dieuKien}`;
      }).join('\n')
    : 'Hiện không có mã giảm giá nào đang chạy.';

  const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
  const weekdayVN = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long' });

  return `${STATIC_HEADER}
Hôm nay là ${weekdayVN}, ngày ${todayVN} (giờ Việt Nam). Khi khách nói "hôm nay/ngày mai/thứ X tuần này/dd-mm"..., PHẢI tự quy đổi chính xác sang định dạng YYYY-MM-DD dựa trên mốc ngày hôm nay này trước khi gọi tool "kiem_tra_lich_kham_trong" — không được để trống hoặc đoán sai ngày.

Danh sách dịch vụ hiện có của OfficeCare (dữ liệu cập nhật trực tiếp từ hệ thống):
${serviceList}

Mã giảm giá đang áp dụng (dữ liệu cập nhật trực tiếp từ hệ thống — chỉ giới thiệu đúng các mã này, không bịa mã khác):
${voucherList}
${STATIC_FLOW_AND_RULES}`;
}

function parseAIJsonReply(text: string): { reply: string; suggest_booking: boolean } {
  const tryParse = (s: string): any => {
    try {
      const obj = JSON.parse(s);
      if (obj && typeof obj.reply === 'string') return obj;
    } catch {
      // bỏ qua, thử phương án khác bên dưới
    }
    return null;
  };

  let parsed = tryParse(text.trim());
  if (!parsed) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) parsed = tryParse(match[0]);
  }
  if (!parsed) {
    return {
      reply: text.trim() || 'Xin lỗi, tôi chưa hiểu ý bạn. Bạn có thể mô tả lại không?',
      suggest_booking: false,
    };
  }
  return { reply: parsed.reply, suggest_booking: parsed.suggest_booking === true };
}

export interface AIChatResult {
  reply: string;
  suggestBooking: boolean;
}

export class AIService {
  static async generateChatResponse(
    message: string,
    history: { role: 'user' | 'model'; content: string }[],
    khachHangId: string | null = null
  ): Promise<AIChatResult> {
    if (!apiKey) {
      return {
        reply: 'Hệ thống AI hiện chưa được cấu hình API Key. Vui lòng cấu hình GEMINI_API_KEY trong file .env ở backend.',
        suggestBooking: false
      };
    }

    try {
      const systemInstruction = await buildSystemInstruction();

      const model = genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction,
        tools: [{ functionDeclarations: AI_TOOLS }],
        generationConfig: {
          temperature: 0.3,
        }
      });

      // Chuyển đổi lịch sử chat sang định dạng của SDK Gemini và lọc bỏ các tin nhắn thông báo lỗi cục bộ
      const geminiHistory = history
        .filter(item => !item.content.startsWith('⚠️'))
        .map(item => ({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.content }]
        }));

      // Bắt buộc tin nhắn đầu tiên trong mảng gửi lên Gemini phải thuộc về 'user'.
      // Nếu tin nhắn đầu tiên thuộc về 'model' (như tin nhắn chào mừng), ta loại bỏ nó để tránh lỗi SDK.
      while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
        geminiHistory.shift();
      }

      // Tự quản lý mảng `contents` và gọi generateContent() trực tiếp thay vì model.startChat()/
      // chat.sendMessage() — SDK @google/generative-ai gán cứng role "function" cho lượt gửi kết quả
      // tool (assignRoleToPartsAndValidateSendMessageRequest trong dist/index.js), nhưng backend hiện
      // tại của model "gemini-flash-latest" đã bỏ hỗ trợ role "function" (400 Bad Request: "Role
      // 'function' is not supported"), chỉ generateContent() với contents tự dựng mới né được lỗi này.
      const contents: Content[] = [...geminiHistory, { role: 'user', parts: [{ text: message }] }];

      let response = (await model.generateContent({ contents })).response;

      // Vòng lặp tool-calling: AI có thể gọi 1 hoặc nhiều tool trước khi trả lời cuối cùng.
      // Giới hạn 3 vòng để tránh vòng lặp vô hạn nếu model liên tục yêu cầu gọi tool.
      for (let round = 0; round < 3; round++) {
        const calls = response.functionCalls();
        if (!calls || calls.length === 0) break;

        const modelTurnParts = response.candidates?.[0]?.content?.parts ?? calls.map((call) => ({ functionCall: call }));
        contents.push({ role: 'model', parts: modelTurnParts });

        const functionResponseParts: Part[] = await Promise.all(
          calls.map(async (call) => ({
            functionResponse: {
              name: call.name,
              response: await executeTool(call.name, call.args, khachHangId),
            },
          }))
        );
        contents.push({ role: 'user', parts: functionResponseParts });

        response = (await model.generateContent({ contents })).response;
      }

      // Trường hợp hiếm: hết số vòng cho phép mà model vẫn đang muốn gọi tiếp tool (response chỉ có
      // functionCall, không có text) — ép thêm 1 lượt KHÔNG kèm tools để buộc model phải chốt câu trả
      // lời bằng văn bản thay vì trả về rỗng (response.text() sẽ là "" nếu để nguyên).
      if (response.functionCalls()?.length) {
        const modelTurnParts = response.candidates?.[0]?.content?.parts ?? [];
        contents.push({ role: 'model', parts: modelTurnParts });
        contents.push({
          role: 'user',
          parts: [{ text: 'Hãy chốt câu trả lời cuối cùng ngay bây giờ dựa trên thông tin đã có, đúng định dạng JSON yêu cầu.' }],
        });
        response = (await model.generateContent({ contents, tools: undefined })).response;
      }

      const parsed = parseAIJsonReply(response.text());
      return {
        reply: parsed.reply,
        suggestBooking: parsed.suggest_booking === true
      };
    } catch (error: any) {
      console.error('Lỗi khi gọi Gemini API:', error);
      if (error?.status === 429) {
        throw new Error('Hệ thống AI đã đạt giới hạn số lượt hỏi miễn phí trong hôm nay. Vui lòng quay lại vào ngày mai hoặc liên hệ hotline để được tư vấn trực tiếp.');
      }
      throw new Error('Không thể kết nối tới dịch vụ AI lúc này.');
    }
  }
}
