export interface TermsSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TERMS_EFFECTIVE_DATE = '02/08/2026';

export const TERMS_OF_SERVICE: TermsSection[] = [
  {
    heading: '1. Định nghĩa thuật ngữ',
    paragraphs: [
      '1.1 OfficeCare: Thương hiệu thuộc quản lý của Phòng khám Phục hồi chức năng & Trị liệu Cột sống OfficeCare.',
      '1.2 Dịch vụ: Các gói dịch vụ khám lâm sàng, lượng giá cơ sinh học, điều trị vật lý trị liệu (buổi lẻ hoặc liệu trình dài ngày) được mô tả trên hệ thống.',
      '1.3 Phác đồ điều trị: Lộ trình điều trị được Bác sĩ chuyên khoa thiết lập riêng cho từng bệnh nhân dựa trên kết quả lượng giá lâm sàng.',
      '1.4 Tài khoản bệnh nhân: Tài khoản điện tử đăng ký trên website/ứng dụng OfficeCare bằng email và số điện thoại chính chủ để quản lý lịch hẹn, hóa đơn và bệnh án điện tử.',
      '1.5 Điểm uy tín: Chỉ số đánh giá mức độ tuân thủ lịch hẹn của khách hàng. Điểm uy tín mặc định là 100 và sẽ bị khấu trừ nếu vi phạm quy định hủy lịch trễ hoặc tự ý vắng mặt.',
      '1.6 Hạn sử dụng gói: Mốc thời gian (tính từ ngày kích hoạt gói cộng số ngày quy định riêng cho từng gói dịch vụ) mà Khách hàng cần hoàn tất sử dụng hết gói liệu trình đã mua. Hạn sử dụng được chốt cố định ngay khi gói được kích hoạt, không thay đổi dù OfficeCare sau đó điều chỉnh cấu hình gói.',
      '1.7 Mã giảm giá (Voucher): Mã ưu đãi do OfficeCare phát hành, được áp dụng theo các điều kiện về hình thức thanh toán, giá trị đơn hàng tối thiểu và số lượt sử dụng tối đa cho mỗi Khách hàng, quy định chi tiết tại Điều 5.',
    ],
  },
  {
    heading: '2. Phạm vi dịch vụ & Quy chuẩn y đức',
    paragraphs: [
      'OfficeCare cung cấp các dịch vụ khám và điều trị bảo tồn (không dùng thuốc, không phẫu thuật) đối với các hội giúp đau mỏi cơ xương khớp văn phòng (đau lưng, cổ, vai gáy, tê bì tay...).',
      'Bằng việc đăng ký tài khoản hoặc sử dụng dịch vụ đặt lịch hẹn, Khách hàng xác nhận đã đọc, hiểu và đồng ý tự nguyện tuân thủ toàn bộ các quy định trong Thỏa thuận này.',
    ],
  },
  {
    heading: '3. Quy định đặt lịch & Đặt lịch tuần tự',
    paragraphs: [
      '3.1 Xác nhận lịch hẹn: Lịch hẹn ban đầu ở trạng thái Đã xác nhận.',
      '3.2 Quy tắc đặt lịch tuần tự: Đối với các gói liệu trình, Khách hàng bắt buộc phải hoàn thành buổi điều trị trước đó mới được quyền đặt lịch cho buổi tiếp theo.',
      '3.3 Sức chứa khả dụng: Số lượng lịch hẹn trong mỗi khung giờ được giới hạn dựa trên năng lực phục vụ của phòng khám. Hệ thống sẽ báo Đầy hoặc ẩn khung giờ khi đã đạt giới hạn sức chứa, không cho phép đặt lịch vượt tải.',
    ],
  },
  {
    heading: '4. Biểu phí & Hình thức thanh toán gói liệu trình',
    paragraphs: [
      'Khách hàng có thể lựa chọn các hình thức thanh toán sau:',
      '4.1 Thanh toán từng buổi: Khách hàng thanh toán dứt điểm chi phí của buổi hiện tại mới được phép đặt lịch cho buổi kế tiếp.',
      '4.2 Thanh toán trả thẳng: Khách hàng thanh toán 100% giá trị gói ngay khi đăng ký mua.',
      '4.3 Ưu đãi tự động theo hình thức thanh toán: Khi mua Gói liệu trình, hệ thống tự động áp dụng giảm giá 10% cho hình thức Trả thẳng (hình thức Từng buổi không có ưu đãi tự động). Nếu Khách hàng sử dụng thêm Mã giảm giá (Voucher) cho cùng hóa đơn, ưu đãi tự động này sẽ KHÔNG được cộng dồn — hệ thống chỉ áp dụng mức giảm giá của Voucher.',
    ],
  },
  {
    heading: '5. Chính sách mã giảm giá (Voucher)',
    paragraphs: [
      '5.1 Điều kiện áp dụng: Mỗi Voucher có thể được giới hạn theo một hoặc nhiều hình thức thanh toán cụ thể (Trả thẳng/Từng buổi) và/hoặc giá trị đơn hàng tối thiểu. Voucher không ghi rõ giới hạn hình thức thanh toán được áp dụng cho mọi hình thức.',
      '5.2 Giới hạn lượt sử dụng: Số lượt sử dụng tối đa của mỗi Voucher (nếu có) được tính riêng cho từng Khách hàng, không phải tổng lượt dùng chung của toàn hệ thống — khi một Khách hàng đã dùng hết số lượt được phép, mã sẽ không còn khả dụng đối với chính Khách hàng đó (các Khách hàng khác không bị ảnh hưởng).',
      '5.3 Không cộng dồn: Voucher không được cộng dồn với ưu đãi tự động theo hình thức thanh toán (Điều 4.3) hoặc với Voucher khác trên cùng một hóa đơn.',
      '5.4 Thay đổi lựa chọn: Nếu Khách hàng đã áp dụng một Voucher rồi sau đó thay đổi hình thức thanh toán hoặc gói dịch vụ khiến Voucher không còn đủ điều kiện áp dụng, hệ thống sẽ tự động gỡ Voucher đó và yêu cầu Khách hàng chọn lại mã phù hợp.',
    ],
  },
  {
    heading: '6. Chính sách miễn phí khám lâm sàng',
    paragraphs: [
      '6.1 Điều kiện miễn phí: Khách hàng được miễn phí 100% chi phí khám lâm sàng ban đầu khi mua Gói liệu trình (nhiều buổi) theo hình thức Trả thẳng, với điều kiện giá trị gốc của gói (không bao gồm phí khám) đạt từ 1.000.000đ trở lên.',
      '6.2 Đối tượng loại trừ: Chính sách miễn phí khám KHÔNG áp dụng dưới bất kỳ hình thức nào đối với khách hàng lựa chọn hình thức Thanh toán từng buổi, và KHÔNG áp dụng cho Dịch vụ lẻ (gói 1 buổi độc lập, không thuộc liệu trình) dù giá trị dịch vụ có đạt ngưỡng trên.',
    ],
  },
  {
    heading: '7. Chính sách thay đổi lịch hẹn',
    paragraphs: [
      '7.1 Quyền thay đổi lịch hẹn: Khách hàng được phép thay đổi giờ hẹn/ngày hẹn bằng cách liên hệ hotline trước ít nhất 8 tiếng trước giờ bắt đầu của ca hẹn.',
      '7.2 Hạn chế đổi lịch: Trong vòng 8 tiếng trước khi ca hẹn bắt đầu, Khách hàng không thể thực hiện đổi lịch mà chỉ được phép hủy lịch hoặc chấp nhận vắng mặt.',
    ],
  },
  {
    heading: '8. Chính sách vắng mặt & Hủy lịch trễ (No-Show & Penalty)',
    paragraphs: [
      'Để đảm bảo công bằng cho tất cả bệnh nhân và tối ưu hóa thời gian điều trị của bác sĩ, OfficeCare áp dụng khấu trừ Điểm uy tín ngay từ lần vi phạm đầu tiên khi Khách hàng chủ động hủy lịch hoặc vắng mặt không báo trước. Hậu quả cụ thể căn cứ theo hành động vi phạm và nhóm hình thức thanh toán của buổi hẹn:',
      '8.1 Nhóm chưa thanh toán trước (gói Khám, Dịch vụ lẻ, và gói liệu trình Từng buổi):',
      '- Chủ động hủy lịch: Trừ 10 điểm uy tín. Buổi hẹn KHÔNG bị tính là đã sử dụng, Khách hàng có thể đặt lại bình thường.',
      '- Vắng mặt không báo trước (No-show): Trừ 20 điểm uy tín. Buổi hẹn KHÔNG bị tính là đã sử dụng, Khách hàng có thể đặt lại bình thường.',
      '8.2 Nhóm đã thanh toán trước (gói liệu trình Trả thẳng 100%):',
      '- Chủ động hủy lịch: Trừ 10 điểm uy tín. Buổi hẹn KHÔNG bị tính là đã sử dụng — Khách hàng có thể đặt lại đúng buổi đó.',
      '- Vắng mặt không báo trước (No-show): KHÔNG bị trừ điểm uy tín (đã chịu hậu quả mất buổi nên hệ thống không phạt điểm trùng lặp), nhưng buổi hẹn bị tính là ĐÃ SỬ DỤNG và không được hoàn lại.',
      '8.3 Mốc thời gian hủy lịch: Khách hàng tự hủy lịch qua hệ thống/ứng dụng chỉ được thực hiện khi còn tối thiểu 8 tiếng trước giờ hẹn. Trong vòng 8 tiếng trước giờ hẹn, Khách hàng vui lòng liên hệ trực tiếp Lễ tân qua hotline để được hỗ trợ hủy lịch.',
      '8.4 Quyền khóa tài khoản: Nếu Điểm uy tín của tài khoản giảm xuống mức thấp, OfficeCare có quyền chủ động tạm khóa hoặc khóa vĩnh viễn tài khoản của Khách hàng thông qua bộ phận kiểm duyệt và lọc thành viên định kỳ.',
    ],
  },
  {
    heading: '9. Chính sách phạt hủy gói & Hoàn tiền (Refund Policy)',
    paragraphs: [
      'Khách hàng có quyền yêu cầu chấm dứt hợp đồng sử dụng gói liệu trình trước thời hạn (khi gói vẫn còn trong Hạn sử dụng — xem Điều 10 đối với trường hợp gói đã quá hạn). Việc hoàn tiền sẽ tuân thủ nghiêm ngặt công thức sau:',
      '9.1 Phí phạt hủy gói: Được tính cố định bằng 10% trên tổng giá trị hợp đồng gói đã chốt theo hình thức thanh toán (không tính trên số tiền thực tế khách hàng đã đóng đến thời điểm hủy).',
      '9.2 Khấu trừ chi phí các buổi đã sử dụng: Được tính theo phương pháp phân bổ đều trên giá gói đã chốt theo hình thức thanh toán, cụ thể: (Giá gói đã chốt ÷ Tổng số buổi của gói) × Số buổi đã sử dụng.',
      '9.3 Khấu trừ chi phí khám lâm sàng: Trường hợp gói có kèm ca khám lâm sàng ban đầu mà Khách hàng chưa thanh toán riêng phí khám đó (kể cả trường hợp đã được miễn phí theo Điều 6), phí khám sẽ được truy thu theo đơn giá dịch vụ khám hiện hành của OfficeCare tại thời điểm hủy gói. Phí khám chỉ bị truy thu đúng 1 lần, không trừ trùng nếu Khách hàng đã thanh toán riêng trước đó.',
      'Số tiền hoàn lại = (Tổng số tiền khách đã đóng) - (Chi phí các buổi đã sử dụng) - (Chi phí khám lâm sàng truy thu, nếu có) - (Phí phạt hủy gói 10%). Số tiền hoàn lại tối thiểu là 0đ — Khách hàng không phát sinh nghĩa vụ phải đóng thêm trong mọi trường hợp.',
    ],
  },
  {
    heading: '10. Chính sách hạn sử dụng gói liệu trình (Quá hạn — Không hoàn tiền)',
    paragraphs: [
      '10.1 Mỗi gói liệu trình có Hạn sử dụng được xác định ngay khi kích hoạt (ngày kích hoạt cộng số ngày quy định riêng cho từng gói dịch vụ) và được hiển thị trong hồ sơ điều trị cá nhân của Khách hàng. Hạn sử dụng đã chốt cho một Khách hàng không thay đổi dù OfficeCare sau đó điều chỉnh cấu hình gói dịch vụ.',
      '10.2 Nếu Khách hàng không hoàn tất sử dụng hết số buổi của gói trước Hạn sử dụng, OfficeCare có quyền chủ động chấm dứt gói do quá hạn sử dụng.',
      '10.3 Trong trường hợp chấm dứt do quá hạn sử dụng: OfficeCare giữ nguyên toàn bộ số tiền Khách hàng đã đóng cho gói — KHÔNG hoàn trả bất kỳ khoản nào và KHÔNG thu thêm bất kỳ khoản nào, không phân biệt hình thức thanh toán. Công thức phạt 10% và khấu trừ theo buổi tại Điều 9 KHÔNG áp dụng cho trường hợp này.',
      '10.4 Khách hàng vui lòng chủ động theo dõi tiến độ sử dụng gói và liên hệ Lễ tân/hotline để sắp xếp lịch trước khi gói hết hạn, nhằm tránh phát sinh trường hợp tại Điều 10.3.',
    ],
  },
];
