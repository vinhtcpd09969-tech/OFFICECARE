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
  { value: 'Máy siêu âm điều trị', label: 'Máy siêu âm điều trị', type: 'mobile' },
  { value: 'Máy sóng xung kích Shockwave', label: 'Máy sóng xung kích Shockwave', type: 'mobile' },
  { value: 'Máy Laser công suất cao', label: 'Máy Laser công suất cao', type: 'mobile' },
  { value: 'Máy kéo giãn cột sống tự động', label: 'Máy kéo giãn cột sống tự động', type: 'stationary' },
  { value: 'Giường nắn chỉnh xương khớp chuyên dụng', label: 'Giường nắn chỉnh xương khớp chuyên dụng', type: 'stationary' },
  { value: 'Giường trị liệu bằng tay', label: 'Giường trị liệu bằng tay', type: 'stationary' },
  { value: 'Đèn hồng ngoại', label: 'Đèn hồng ngoại', type: 'mobile' },
  { value: 'Máy điện xung', label: 'Máy điện xung', type: 'mobile' },
  { value: 'Máy nén ép', label: 'Máy nén ép', type: 'mobile' },
  { value: 'Máy từ trường', label: 'Máy từ trường', type: 'stationary' }
];

export const DEVICE_CATEGORIES = [
  {
    id: 'dien_tu',
    name: 'Trị liệu điện & từ trường',
    devices: ['Máy điện xung', 'Máy từ trường']
  },
  {
    id: 'nhiet_quang',
    name: 'Trị liệu nhiệt & quang học',
    devices: ['Đèn hồng ngoại', 'Máy Laser công suất cao']
  },
  {
    id: 'song_ap_luc',
    name: 'Trị liệu sóng & áp lực',
    devices: ['Máy siêu âm điều trị', 'Máy sóng xung kích Shockwave', 'Máy nén ép']
  },
  {
    id: 'giuong_keo',
    name: 'Giường & Kéo giãn chuyên dụng',
    devices: ['Máy kéo giãn cột sống tự động', 'Giường nắn chỉnh xương khớp chuyên dụng', 'Giường trị liệu bằng tay']
  }
];

export const HINT_KEYWORDS = [
  { keywords: ['hong ngoai', 'hồng ngoại'], device: 'Đèn hồng ngoại' },
  { keywords: ['laser'], device: 'Máy Laser công suất cao' },
  { keywords: ['dien xung', 'điện xung', 'điện phân', 'điện', 'dien'], device: 'Máy điện xung' },
  { keywords: ['shockwave', 'xung kich', 'xung kích'], device: 'Máy sóng xung kích Shockwave' },
  { keywords: ['sieu am', 'siêu âm'], device: 'Máy siêu âm điều trị' },
  { keywords: ['nen ep', 'nén ép'], device: 'Máy nén ép' },
  { keywords: ['keo gian', 'kéo giãn'], device: 'Máy kéo giãn cột sống tự động' },
  { keywords: ['nan chinh', 'nắn chỉnh'], device: 'Giường nắn chỉnh xương khớp chuyên dụng' },
  { keywords: ['tay', 'tay khong', 'massage', 'giai co', 'tay không'], device: 'không có' }
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
    name.includes('exercise guidance')
  );
};

export const getServiceBenefits = (svc: any) => {
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
