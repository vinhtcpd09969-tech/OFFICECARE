export const removeVietnameseTones = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const normalizeText = (text: string) => {
  if (!text) return '';
  return removeVietnameseTones(text.toLowerCase().trim());
};

export const ALL_DEVICES = [
  { value: 'không có', label: 'Không cần thiết bị (Trị liệu bằng tay)', type: 'hand' },
  { value: 'Tác động điện', label: 'Tác động điện', type: 'mobile' },
  { value: 'Tác động nhiệt', label: 'Tác động nhiệt', type: 'mobile' },
  { value: 'Tác động cơ học / sóng', label: 'Tác động cơ học / sóng', type: 'mobile' },
  { value: 'Thiết bị đặc biệt', label: 'Thiết bị đặc biệt', type: 'stationary' }
];

export const HINT_KEYWORDS = [
  { keywords: ['hong ngoai', 'hồng ngoại', 'laser', 'nhiệt', 'nhiet'], device: 'Tác động nhiệt' },
  { keywords: ['dien xung', 'điện xung', 'điện phân', 'điện', 'dien'], device: 'Tác động điện' },
  { keywords: ['shockwave', 'xung kich', 'xung kích', 'sieu am', 'siêu âm', 'nen ep', 'nén ép', 'co hoc', 'cơ học'], device: 'Tác động cơ học / sóng' },
  { keywords: ['keo gian co', 'kéo giãn cổ', 'keo gian', 'kéo giãn', 'tu truong', 'từ trường', 'sis', 'đặc biệt', 'dac biet'], device: 'Thiết bị đặc biệt' },
  { keywords: ['tay', 'tay khong', 'xoa bop', 'massage', 'giai co', 'tay không'], device: 'không có' }
];

export const currencyFormatter = new Intl.NumberFormat('vi-VN');

export const getServiceImage = (id: string | number) => {
  const isEven = String(id).charCodeAt(0) % 2 === 0;
  return `https://images.unsplash.com/photo-${isEven ? '1576091160550-21080f0c7324' : '1544367567-0f2fcb009e0b'}?q=80&w=200&auto=format&fit=crop`;
};

export const isSharedLibraryService = (svc: any) => {
  const name = (svc.ten_dich_vu || '').toLowerCase();
  return (
    name.includes('deep tissue') ||
    name.includes('muscle release') ||
    name.includes('electrotherapy') ||
    name.includes('heat therapy') ||
    name.includes('cervical stretching') ||
    name.includes('spinal stretching') ||
    name.includes('stretching therapy') ||
    name.includes('shoulder mobility') ||
    name.includes('wrist mobility') ||
    name.includes('tendon release') ||
    name.includes('joint mobility') ||
    name.includes('piriformis release') ||
    name.includes('exercise guidance') ||
    (svc.mo_ta_ngan && svc.mo_ta_ngan.includes('SVC-'))
  );
};

export const getServiceBenefits = (svc: any) => {
  if (svc.loai_dich_vu_ho_tro) {
    let benefits = svc.loai_dich_vu_ho_tro;
    if (typeof benefits === 'string') {
      try {
        benefits = JSON.parse(benefits);
      } catch (e) {}
    }
    if (Array.isArray(benefits) && benefits.length > 0) {
      return benefits;
    }
  }
  const name = (svc.ten_dich_vu || '').toLowerCase();
  if (name.includes('giải cơ') || name.includes('deep tissue')) {
    return [
      "Giải phóng các co cứng thắt cơ ở các sợi cơ sâu nhất.",
      "Tăng cung cấp oxy và tuần hoàn máu phục hồi mô tổn thương.",
      "Giảm nhanh chứng đau mỏi bả vai, thắt lưng mãn tính."
    ];
  }
  if (name.includes('điện xung') || name.includes('electrotherapy')) {
    return [
      "Ức chế tín hiệu đau dẫn truyền lên brain bộ tức thì.",
      "Kích thích giải phóng hoóc-môn Endorphin tự nhiên của cơ thể để giảm đau.",
      "Tăng kích thích cơ vận động chống xơ hóa cơ lực."
    ];
  }
  if (name.includes('nhiệt') || name.includes('heat')) {
    return [
      "Giãn cơ toàn vùng, giải phóng tình trạng co cứng khớp cấp.",
      "Tăng tuần hoàn máu thúc đẩy đào thải axit lactic gây mỏi.",
      "Xoa dịu hệ thần kinh nhạy cảm, mang lại giấc ngủ sâu."
    ];
  }
  if (name.includes('kéo giãn') || name.includes('stretching')) {
    return [
      "Giải áp đĩa đệm thắt lưng thắt ngực tối đa, giải nén rễ thần kinh.",
      "Mở rộng lỗ liên hợp cột sống cổ và thắt lưng.",
      "Tăng tính đàn hồi cho nhóm cơ dựng gai và cơ dây chằng."
    ];
  }
  if (name.includes('vận động') || name.includes('mobility')) {
    return [
      "Bôi trơn diện khớp tăng tiết dịch ổ khớp tự nhiên.",
      "Ngăn chặn dính bao khớp gây đông cứng vai hoặc cổ tay.",
      "Khôi phục hoàn toàn biên độ vận động gập duỗi tự nhiên."
    ];
  }
  if (name.includes('bài tập') || name.includes('exercise')) {
    return [
      "Kích hoạt các nhóm cơ lõi bảo vệ cột sống thắt lưng.",
      "Chỉnh sửa sai lệch tư thế lệch vẹo vai hông tận gốc.",
      "Duy trì kết quả trị liệu lâm sàng, chống tái phát đau."
    ];
  }
  if (name.includes('gân cơ') || name.includes('tendon')) {
    return [
      "Tách dính gân cơ ở điểm bám tận vùng khuỷu tay, cổ tay.",
      "Giảm viêm điểm bám gân do các động tác gõ phím di chuột liên tục.",
      "Tăng cường lực cầm nắm, hết mỏi buốt ngón tay."
    ];
  }
  if (name.includes('massage')) {
    return [
      "Thư giãn hệ thần kinh ngoại biên, xua tan stress mệt mỏi.",
      "Thúc đẩy lưu thông hệ bạch huyết tăng cường thải độc.",
      "Xoa dịu cơ thể mềm mại, đem lại trạng thái sảng khoái sâu."
    ];
  }
  if (name.includes('giác hơi') || name.includes('cupping')) {
    return [
      "Tạo áp suất âm hút khí huyết ứ đọng giải độc cơ thắt lưng.",
      "Trị cảm lạnh cấp tính, giảm mỏi cơ tức thì.",
      "Kích thích tuần hoàn máu cục bộ tái tạo mô cơ."
    ];
  }
  if (name.includes('đá nóng') || name.includes('hotstone')) {
    return [
      "Nhiệt đá bazan tự nhiên thông kinh hoạt lạc toàn thân.",
      "Giảm lạnh chân tay, giữ ấm cơ sâu vùng lưng bụng.",
      "Đem lại giấc ngủ chất lượng cao và bình an tâm trí."
    ];
  }
  return [
    "Hỗ trợ giảm đau cơ xương khớp cục bộ an toàn chuẩn y khoa.",
    "Thúc đẩy quá trình tái tạo mô và rút ngắn thời gian hồi phục thể trạng.",
    "Nâng cao sức khỏe chủ động và cải thiện chất lượng cuộc sống hàng ngày."
  ];
};
