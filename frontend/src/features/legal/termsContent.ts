export interface TermsSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TERMS_EFFECTIVE_DATE = '13/07/2026';

export const TERMS_OF_SERVICE: TermsSection[] = [
  {
    heading: '1. Phạm vi dịch vụ',
    paragraphs: [
      'Office Care ("Phòng khám", "chúng tôi") cung cấp dịch vụ khám lâm sàng, điều trị vật lý trị liệu theo buổi lẻ và các gói liệu trình (package) chuyên sâu cho hội chứng cơ xương khớp văn phòng (đau lưng, cổ, vai gáy). Điều khoản này áp dụng cho mọi khách hàng tạo tài khoản và sử dụng dịch vụ đặt lịch, thanh toán, theo dõi hồ sơ điều trị trên hệ thống Office Care.',
      'Việc đăng ký tài khoản và/hoặc sử dụng dịch vụ đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý với toàn bộ nội dung điều khoản dưới đây.',
    ],
  },
  {
    heading: '2. Đặt lịch & thay đổi lịch hẹn',
    paragraphs: [
      'Sau khi đặt lịch, cuộc hẹn ở trạng thái "Chưa xác nhận" cho đến khi Lễ tân gọi điện xác nhận trực tiếp với khách hàng. Phòng khám không tự động hủy lịch chưa xác nhận; trường hợp không thể liên lạc được sau nhiều lần gọi, Lễ tân có quyền chủ động hủy lịch để giải phóng chỗ cho khách khác.',
      'Với các gói liệu trình, khách hàng phải hoàn thành buổi điều trị trước đó (được ghi nhận "Hoàn thành") mới có thể đặt lịch cho buổi kế tiếp trong cùng phác đồ, nhằm đảm bảo tiến độ điều trị liên tục và đúng chỉ định của bác sĩ.',
      'Khung giờ khám có giới hạn số lượng theo sức chứa phòng khám và nhân sự trực ca; hệ thống sẽ ẩn hoặc báo "Đầy" khi khung giờ không còn chỗ.',
    ],
  },
  {
    heading: '3. Thanh toán & hình thức đóng tiền gói liệu trình',
    paragraphs: [
      'Gói liệu trình có thể thanh toán theo 3 hình thức: từng buổi (thanh toán xong buổi hiện tại mới đặt được buổi tiếp theo), trả theo tháng, hoặc trả góp (đóng trước một phần, phần còn lại phải hoàn tất trước một mốc buổi điều trị nhất định tùy theo tổng số buổi của gói — hệ thống sẽ thông báo cụ thể mốc này trong hồ sơ điều trị của bạn).',
      'Với hình thức trả góp, phần còn lại bắt buộc phải thanh toán trước khi bắt đầu buổi điều trị đến mốc quy định; nếu chưa thanh toán, buổi điều trị tương ứng sẽ không thể được đánh dấu hoàn thành cho đến khi hóa đơn được thanh toán đầy đủ.',
      'Một số gói liệu trình thanh toán theo tháng hoặc trả góp với giá trị đủ lớn được miễn phí buổi khám lâm sàng đầu tiên; chính sách miễn phí khám cụ thể sẽ được thể hiện rõ trong báo giá gói tại thời điểm tư vấn/mua gói.',
    ],
  },
  {
    heading: '4. Hủy gói & hoàn tiền',
    paragraphs: [
      'Khách hàng có quyền yêu cầu hủy gói liệu trình đang sử dụng. Khi hủy, phòng khám sẽ áp dụng phí phạt hủy gói bằng 10% trên tổng giá trị hợp đồng của gói đã chốt theo hình thức thanh toán đã chọn (không phải 10% trên số tiền đã đóng thực tế) — đây là mức phí cố định theo hợp đồng nhằm bù đắp chi phí vận hành, nhân sự và giữ chỗ đã phát sinh.',
      'Số tiền hoàn lại cho khách hàng được tính bằng: tổng số tiền đã đóng, trừ đi chi phí các buổi điều trị đã sử dụng (theo đơn giá dịch vụ thực tế đã đăng ký), trừ đi chi phí khám lâm sàng nếu chưa được thanh toán hoặc miễn phí trước đó, và trừ đi phí phạt hủy gói nêu trên.',
      'Mọi khoản hoàn tiền sẽ được xử lý và thông báo qua hồ sơ điều trị điện tử của khách hàng trong hệ thống.',
    ],
  },
  {
    heading: '5. Chính sách vắng mặt / không đến (No-show)',
    paragraphs: [
      'Với các gói trả theo tháng hoặc trả góp: lần đầu hủy lịch trễ hoặc không đến sẽ được miễn trừ (không ảnh hưởng điểm uy tín tài khoản); từ lần thứ hai trở đi, buổi hẹn sẽ được ghi nhận là vi phạm và có thể ảnh hưởng đến quyền lợi đặt lịch ưu tiên của khách hàng.',
      'Với các buổi/gói thanh toán theo từng buổi: mỗi lần hủy lịch trễ hoặc không đến sẽ bị trừ điểm uy tín tài khoản ngay từ lần đầu tiên, không có miễn trừ.',
      'Phòng khám khuyến khích khách hàng chủ động báo hủy hoặc dời lịch sớm nhất có thể để tránh ảnh hưởng đến quyền lợi cá nhân và tạo điều kiện cho khách hàng khác được sắp xếp khám kịp thời.',
    ],
  },
  {
    heading: '6. Bảo mật hồ sơ bệnh án điện tử & dữ liệu cá nhân',
    paragraphs: [
      'Toàn bộ thông tin cá nhân, hồ sơ bệnh án, kết quả thăm khám và lịch sử điều trị của khách hàng được lưu trữ trên hệ thống Office Care và chỉ được truy cập bởi đội ngũ y tế trực tiếp phụ trách (bác sĩ, kỹ thuật viên) và bộ phận quản lý có thẩm quyền, phục vụ đúng mục đích khám chữa bệnh và vận hành phòng khám.',
      'Phòng khám cam kết không chia sẻ, bán hoặc tiết lộ thông tin bệnh án của khách hàng cho bên thứ ba vì mục đích thương mại. Thông tin chỉ được cung cấp cho cơ quan có thẩm quyền khi có yêu cầu hợp pháp theo quy định pháp luật hiện hành.',
      'Khách hàng có quyền yêu cầu xem lại, chỉnh sửa thông tin cá nhân của mình thông qua trang Hồ sơ cá nhân/Cài đặt tài khoản, hoặc liên hệ trực tiếp phòng khám để được hỗ trợ.',
    ],
  },
  {
    heading: '7. Quyền & trách nhiệm của khách hàng',
    paragraphs: [
      'Khách hàng có trách nhiệm cung cấp thông tin y tế, tiền sử bệnh lý trung thực và đầy đủ để bác sĩ xây dựng phác đồ điều trị phù hợp và an toàn.',
      'Khách hàng có quyền được tư vấn rõ ràng về chi phí, số buổi, hình thức thanh toán trước khi quyết định mua gói liệu trình, và có quyền tra cứu lịch sử buổi điều trị, hóa đơn của mình bất cứ lúc nào trong hồ sơ điện tử.',
      'Khách hàng cam kết tuân thủ đúng lịch hẹn đã xác nhận và hướng dẫn điều trị từ đội ngũ y tế để đảm bảo hiệu quả và an toàn trong quá trình phục hồi.',
    ],
  },
  {
    heading: '8. Miễn trừ trách nhiệm y khoa',
    paragraphs: [
      'Kết quả điều trị vật lý trị liệu phụ thuộc vào nhiều yếu tố cá nhân như cơ địa, mức độ tuân thủ phác đồ, tình trạng sức khỏe nền và thói quen sinh hoạt của từng khách hàng. Phòng khám cam kết áp dụng phác đồ điều trị theo đúng chuyên môn y khoa nhưng không thể đảm bảo tuyệt đối về thời gian hoặc mức độ hồi phục cụ thể cho mọi trường hợp.',
      'Khách hàng cần thông báo ngay cho đội ngũ y tế nếu có bất kỳ dấu hiệu bất thường nào trong và sau quá trình điều trị để được xử lý kịp thời.',
    ],
  },
  {
    heading: '9. Thay đổi điều khoản & hiệu lực',
    paragraphs: [
      `Điều khoản này có hiệu lực kể từ ngày ${TERMS_EFFECTIVE_DATE} và áp dụng cho mọi tài khoản đăng ký từ thời điểm đó trở đi.`,
      'Phòng khám có quyền cập nhật, điều chỉnh nội dung điều khoản dịch vụ để phù hợp với thay đổi vận hành hoặc quy định pháp luật. Mọi thay đổi sẽ được thông báo công khai trên hệ thống trước khi áp dụng.',
    ],
  },
  {
    heading: '10. Thông tin liên hệ',
    paragraphs: [
      'Nếu có bất kỳ thắc mắc nào về Điều khoản dịch vụ này, vui lòng liên hệ Office Care qua các kênh sau:',
    ],
    bullets: [
      'Địa chỉ: Khu đô thị Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      'Hotline: 1900 1234',
      'Email: hello@officecare.com',
    ],
  },
];
