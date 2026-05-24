import { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  CheckCircle, 
  Clock, 
  Stethoscope, 
  Check, 
  ShieldAlert,
  TrendingUp
} from 'lucide-react';
import { getServices } from '../../../api/admin.api';

export default function TechnicianWorkspace() {
  // State for active session/patient
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Interactive checklist states
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [beforeNotes, setBeforeNotes] = useState('');
  const [afterNotes, setAfterNotes] = useState('');
  const [restorationIndex, setRestorationIndex] = useState(80); // percentage slider

  // Fetch initial services & mocked clinical data
  const fetchData = async () => {
    try {
      setLoading(true);
      await getServices();

      // Clinical Mock Sessions representing actual KTV workflow for roleplaying
      const mockSessions = [
        {
          id: 'btl-001',
          ma_ca: 'TR-10258',
          khach_hang_id: 'kh-001',
          ten_khach: 'Nguyễn Văn Mạnh',
          so_dien_thoai: '0987.654.321',
          ngay_sinh: '1988-06-12',
          gioi_tinh: 'Nam',
          hang_khach: 'Vàng',
          phong: 'Phòng Trị Liệu Cơ Xương Khớp 1',
          gio_hen: '08:30 - 10:00',
          trang_thai: 'dang_thuc_hien',
          loai_lich: 'dieu_tri',
          chan_doan: 'Thoát vị đĩa đệm cột sống thắt lưng L4-L5 chèn ép rễ thần kinh tọa bên trái, gây co rút cơ vuông thắt lưng và cơ hình lê (Piriformis syndrome) mức độ trung bình.',
          chong_chi_dinh: 'Hạn chế vận động bẻ khớp đột ngột vùng cột sống thắt lưng. Tránh nhiệt độ đèn hồng ngoại quá cao trên vùng da mất cảm giác.',
          ten_goi: 'Gói Phục Hồi Thoát Vị Đĩa Đệm & Thần Kinh Tọa Chuyên Sâu (10 Buổi)',
          ma_goi: 'PKG-LBR-SCI-10',
          tong_so_buoi: 10,
          so_buoi_da_dung: 2, // Đây là buổi thứ 3
          so_dv_toi_da_moi_buoi: 5,
          chi_tiet_dich_vu: [
            { id: '1', name: 'Khám lượng giá cột sống & tư thế', limit: 1, used: 1, batBuoc: true, order: 1 },
            { id: '2', name: 'Nhiệt trị liệu hồng ngoại', limit: 10, used: 2, batBuoc: true, order: 2 },
            { id: '3', name: 'Trị liệu giảm đau bằng dòng điện xung', limit: 10, used: 2, batBuoc: true, order: 3 },
            { id: '4', name: 'Kỹ thuật giải cơ chuyên sâu', limit: 10, used: 2, batBuoc: true, order: 4 },
            { id: '5', name: 'Giải phóng cơ hình lê chuyên sâu', limit: 5, used: 4, batBuoc: true, order: 5 }, // KTV đã dùng 4/5 lần
            { id: '6', name: 'Kéo giãn cột sống thắt lưng bằng máy', limit: 9, used: 1, batBuoc: true, order: 6 },
            { id: '7', name: 'Hướng dẫn tập phục hồi chức năng', limit: 5, used: 0, batBuoc: true, order: 7 } // Tập từ buổi 6 trở đi
          ]
        },
        {
          id: 'btl-002',
          ma_ca: 'TR-10259',
          khach_hang_id: 'kh-002',
          ten_khach: 'Trần Thị Thảo',
          so_dien_thoai: '0912.345.678',
          ngay_sinh: '1995-11-20',
          gioi_tinh: 'Nữ',
          hang_khach: 'Bạc',
          phong: 'Phòng Trị Liệu Cổ Vai Gáy 2',
          gio_hen: '10:15 - 11:45',
          trang_thai: 'cho_xac_nhan',
          loai_lich: 'dieu_tri',
          chan_doan: 'Hội chứng Cổ Vai Gáy (Cervicobrachial syndrome) do thoái hóa đốt sống cổ C5-C6, co cứng cơ thang và cơ nâng vai 2 bên.',
          chong_chi_dinh: 'Không xoay vặn cổ đột ngột lực mạnh. Lưu ý nhịp thở của khách khi kéo giãn cơ.',
          ten_goi: 'Gói Trị Liệu Cơ Xương Khớp Linh Động (Flexi-Care)',
          ma_goi: 'PKG-FLEXI-CARE',
          tong_so_buoi: 1,
          so_buoi_da_dung: 0,
          so_dv_toi_da_moi_buoi: 4,
          chi_tiet_dich_vu: [
            { id: '4', name: 'Kỹ thuật giải cơ chuyên sâu', limit: 5, used: 0, batBuoc: false, order: 1 },
            { id: '3', name: 'Trị liệu giảm đau bằng dòng điện xung', limit: 5, used: 0, batBuoc: false, order: 2 },
            { id: '2', name: 'Nhiệt trị liệu hồng ngoại', limit: 5, used: 0, batBuoc: false, order: 3 },
            { id: '8', name: 'Di động mô mềm giải phóng cơ', limit: 5, used: 0, batBuoc: false, order: 4 },
            { id: '9', name: 'Kéo giãn cột sống cổ bằng tay', limit: 5, used: 0, batBuoc: false, order: 5 },
            { id: '6', name: 'Kéo giãn cột sống thắt lưng bằng máy', limit: 5, used: 0, batBuoc: false, order: 6 },
            { id: '10', name: 'Massage Đầu Cổ Vai Gáy', limit: 5, used: 0, batBuoc: false, order: 7 }
          ]
        },
        {
          id: 'btl-003',
          ma_ca: 'TR-10260',
          khach_hang_id: 'kh-003',
          ten_khach: 'Phạm Minh Quân',
          so_dien_thoai: '0909.999.888',
          ngay_sinh: '1992-04-03',
          gioi_tinh: 'Nam',
          hang_khach: 'Thường',
          phong: 'Phòng Phục Hồi Chức Năng 3',
          gio_hen: '14:00 - 15:30',
          trang_thai: 'hoan_thanh',
          loai_lich: 'dieu_tri',
          chan_doan: 'Đau mỏi cổ tay nhẹ do hội chứng ống cổ tay thể nhẹ ở nhân viên văn phòng.',
          chong_chi_dinh: null,
          ten_goi: 'Massage Chân & Cổ Vai Gáy (Dùng lẻ)',
          ma_goi: 'LE-003',
          tong_so_buoi: 1,
          so_buoi_da_dung: 1,
          so_dv_toi_da_moi_buoi: 2,
          chi_tiet_dich_vu: [
            { id: '10', name: 'Massage Đầu Cổ Vai Gáy', limit: 1, used: 1, batBuoc: true, order: 1 },
            { id: '11', name: 'Massage Chân Phục Hồi', limit: 1, used: 1, batBuoc: true, order: 2 }
          ]
        }
      ];

      setSessions(mockSessions);
      setSelectedSessionId(mockSessions[0].id);
      
      // Auto-load mandatory/default services for session 1
      const initialChecked: Record<string, boolean> = {};
      mockSessions[0].chi_tiet_dich_vu.forEach(d => {
        // Auto check if it is part of the standard flow (e.g. Nhiệt, Điện xung, Giải cơ, Cơ hình lê, Kéo giãn thắt lưng máy)
        if (d.name !== 'Khám lượng giá cột sống & tư thế' && d.name !== 'Hướng dẫn tập phục hồi chức năng') {
          initialChecked[d.id] = true;
        }
      });
      setSelectedServices(initialChecked);
      setBeforeNotes('Bệnh nhân đau mỏi rát dọc thắt lưng lan mông trái, đứng lâu buốt mỏi. Thắt lưng hơi gù nhẹ để tránh đau.');
      setAfterNotes('Sau kéo giãn máy L4-L5 và giải cơ hình lê mông trái, bệnh nhân thấy nhả cơ đáng kể, đi lại nhẹ nhõm hơn, bớt tê rần các ngón chân.');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId) || null;
  }, [sessions, selectedSessionId]);

  // Set checklists and evaluations when active session changes
  const handleSelectSession = (session: any) => {
    setSelectedSessionId(session.id);
    const checked: Record<string, boolean> = {};
    
    if (session.trang_thai === 'hoan_thanh') {
      session.chi_tiet_dich_vu.forEach((d: any) => {
        if (d.used > 0) checked[d.id] = true;
      });
      setBeforeNotes('Ghi chú lưu trữ buổi hoàn thành.');
      setAfterNotes('Hiệu quả trị liệu tốt, phục hồi nhanh.');
    } else {
      session.chi_tiet_dich_vu.forEach((d: any) => {
        // Clinical recommendation auto-checking
        if (session.ma_goi === 'PKG-LBR-SCI-10') {
          if (d.name !== 'Khám lượng giá cột sống & tư thế' && d.name !== 'Hướng dẫn tập phục hồi chức năng') {
            checked[d.id] = true;
          }
        } else if (session.ma_goi === 'PKG-FLEXI-CARE') {
          if (d.name.includes('giải cơ') || d.name.includes('nhiệt') || d.name.includes('điện xung')) {
            checked[d.id] = true;
          }
        }
      });
      setBeforeNotes(session.id === 'btl-001' ? 'Bệnh nhân đau mỏi rát dọc thắt lưng lan mông trái, đứng lâu buốt mỏi. Thắt lưng hơi gù nhẹ để tránh đau.' : '');
      setAfterNotes(session.id === 'btl-001' ? 'Sau kéo giãn máy L4-L5 và giải cơ hình lê mông trái, bệnh nhân thấy nhả cơ đáng kể, đi lại nhẹ nhõm hơn, bớt tê rần các ngón chân.' : '');
    }
    
    setSelectedServices(checked);
  };

  // Count checked services
  const checkedCount = useMemo(() => {
    return Object.values(selectedServices).filter(Boolean).length;
  }, [selectedServices]);

  // CLINICAL OPERATION VALIDATIONS
  const handleToggleService = (item: any) => {
    if (activeSession.trang_thai === 'hoan_thanh') return; // Read-only for completed

    const isChecked = !!selectedServices[item.id];
    
    // Check constraint 1: Max services per session limit (so_dv_toi_da_moi_buoi)
    if (!isChecked && checkedCount >= activeSession.so_dv_toi_da_moi_buoi) {
      alert(`⚠️ CẢNH BÁO QUY TRÌNH Y KHOA:\n\nHạn mức tối đa của một buổi điều trị trong gói này là ${activeSession.so_dv_toi_da_moi_buoi} dịch vụ.\n\nKỹ thuật viên không được thực hiện quá hạn mức để đảm bảo cơ bắp của bệnh nhân không bị quá tải nhiệt/kích thích cơ học!`);
      return;
    }

    // Check constraint 2: Total package limits (so_lan_toi_da_trong_goi)
    if (!isChecked && item.used >= item.limit) {
      alert(`⚠️ HẾT HẠN MỨC GÓI:\n\nDịch vụ "${item.name}" đã được sử dụng hết hạn mức (${item.used}/${item.limit} lần) trong gói của khách hàng.\n\nVui lòng tư vấn nâng cấp gói hoặc chuyển đổi sang kỹ thuật hỗ trợ khác!`);
      return;
    }

    setSelectedServices(prev => ({
      ...prev,
      [item.id]: !prev[item.id]
    }));
  };

  // Complete KTV session submission
  const handleCompleteSession = () => {
    if (checkedCount === 0) {
      alert('Vui lòng tích chọn ít nhất 1 dịch vụ kỹ thuật đã thực hiện hôm nay!');
      return;
    }

    if (window.confirm(`XÁC NHẬN HOÀN THÀNH CA ĐIỀU TRỊ?\n\n- Khách hàng: ${activeSession.ten_khach}\n- Số dịch vụ đã thực hiện: ${checkedCount}/${activeSession.so_dv_toi_da_moi_buoi}\n\nHệ thống sẽ tự động trừ hạn mức gói của khách hàng và cập nhật lịch trình.`)) {
      setSessions(prev => 
        prev.map(s => 
          s.id === activeSession.id 
            ? { ...s, trang_thai: 'hoan_thanh', so_buoi_da_dung: s.so_buoi_da_dung + 1 } 
            : s
        )
      );
      alert('🎉 Đã hoàn thành ghi nhận buổi trị liệu! Hạn mức gói đã được cập nhật thành công.');
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in text-zinc-800 font-sans text-sm">
      
      {/* KTV Header Console */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-heading tracking-wider text-primary uppercase font-bold">Kỹ thuật viên chuyên nghiệp</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-secondary tracking-tight">KHÔNG GIAN LÀM VIỆC KTV</h2>
          <p className="text-zinc-500 text-xs mt-1">Lượng giá lâm sàng, tích hợp quy trình thực hiện & quản lý hạn mức buổi trị liệu chuyên nghiệp</p>
        </div>

        {/* Real-time statistics pills */}
        <div className="flex items-center gap-3 bg-zinc-50 p-2 border border-zinc-200 rounded-xl shadow-inner text-xs font-bold text-zinc-500">
          <div className="px-3 py-1 bg-white border border-zinc-200 rounded-lg flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>CA HÔM NAY: <span className="text-secondary">{sessions.length}</span></span>
          </div>
          <div className="px-3 py-1 bg-white border border-zinc-200 rounded-lg flex items-center gap-1.5 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>ĐÃ XONG: <span className="text-emerald-600">{sessions.filter(s => s.trang_thai === 'hoan_thanh').length}</span></span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Today's Treatments Directory (Width: 4/12) */}
        <div className="lg:col-span-4 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm min-h-[500px]">
          <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
            <h3 className="font-bold text-xs uppercase tracking-wider text-secondary font-heading">Danh sách ca trị liệu hôm nay</h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-150 pr-0.5 custom-scrollbar bg-white">
            {loading ? (
              <div className="p-8 text-center text-zinc-400 text-xs">CƠ SỞ DỮ LIỆU ĐANG TẢI...</div>
            ) : (
              sessions.map((s) => {
                const isSelected = s.id === selectedSessionId;
                const isDone = s.trang_thai === 'hoan_thanh';
                const isCurrent = s.trang_thai === 'dang_thuc_hien';
                
                return (
                  <div 
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`p-4 transition-all duration-150 cursor-pointer flex justify-between items-start gap-4 border-l-4 ${
                      isSelected 
                        ? 'border-l-primary bg-primary/5 border-r border-r-primary/5 border-y border-y-zinc-100 shadow-sm' 
                        : 'border-l-transparent hover:bg-zinc-50/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-[9px] font-bold text-zinc-400 uppercase">
                          {s.ma_ca}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${
                          s.hang_khach === 'Vàng' 
                            ? 'bg-amber-50 border-amber-250 text-amber-600' 
                            : 'bg-zinc-50 border-zinc-200 text-zinc-500'
                        }`}>
                          {s.hang_khach.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-secondary leading-snug truncate">
                        {s.ten_khach}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1 font-semibold">
                        KHUNG GIỜ: {s.gio_hen}
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 truncate font-medium">
                        {s.phong}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {isDone ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-emerald-250 bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase shadow-sm">
                          Hoàn thành
                        </span>
                      ) : isCurrent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-primary/20 bg-primary-container text-primary text-[8px] font-bold uppercase shadow-sm animate-pulse">
                          Đang thực hiện
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-550 text-[8px] font-bold uppercase shadow-sm">
                          Chờ điều trị
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Interactive Treatment Console (Width: 8/12) */}
        <div className="lg:col-span-8 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm min-h-[500px]">
          {activeSession ? (
            <div className="flex-1 flex flex-col bg-white">
              
              {/* Workspace Header */}
              <div className="p-5 border-b border-zinc-200 bg-zinc-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold text-primary uppercase bg-primary-container border border-primary/20 px-2.5 py-0.5 rounded-lg">
                      {activeSession.ma_ca}
                    </span>
                    <span className="text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-lg border bg-zinc-100 border-zinc-200 text-zinc-650">
                      {activeSession.ten_goi}
                    </span>
                  </div>
                  <h3 className="text-md font-bold text-secondary truncate uppercase font-heading tracking-wide flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-400" />
                    BỆNH NHÂN: {activeSession.ten_khach} ({activeSession.gioi_tinh === 'Nam' ? 'Nam' : 'Nữ'} - {new Date().getFullYear() - parseInt(activeSession.ngay_sinh.split('-')[0])} TUỔI)
                  </h3>
                </div>

                <div className="text-right flex-shrink-0 text-xs font-bold text-zinc-400">
                  TIẾN TRÌNH: <span className="text-primary font-heading font-bold text-sm">BUỔI {activeSession.so_buoi_da_dung + 1}</span> / {activeSession.tong_so_buoi}
                </div>
              </div>

              {/* Workspace Console Console Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[580px] custom-scrollbar bg-white">
                
                {/* CLINICAL PROFILE & ALERT BOXES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Diagnosis */}
                  <div className="bg-sky-50/40 p-4 border border-sky-200 rounded-2xl flex gap-3 shadow-inner">
                    <Stethoscope className="w-5 h-5 text-sky-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-sky-650 uppercase tracking-wider">Chẩn đoán chuyên môn (Bác sĩ)</p>
                      <p className="text-xs text-secondary mt-1 font-semibold leading-relaxed">
                        {activeSession.chan_doan}
                      </p>
                    </div>
                  </div>

                  {/* Contraindication Alert */}
                  <div className="bg-rose-50/30 p-4 border border-rose-250 rounded-2xl flex gap-3 shadow-inner">
                    <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Cảnh báo lâm sàng (Chống chỉ định)</p>
                      <p className="text-xs text-rose-900 mt-1 font-semibold leading-relaxed">
                        {activeSession.chong_chi_dinh || 'Không có chống chỉ định đặc biệt cho liệu trình này.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* THE SERVICE CLINICAL CHECKLIST PANEL */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>HỘP I: THỰC HIỆN DỊCH VỤ TRONG CA HÔM NAY</span>
                      <span className={`px-2 py-0.2 rounded-lg border text-[9px] font-bold font-heading ${
                        checkedCount > activeSession.so_dv_toi_da_moi_buoi
                          ? 'bg-rose-50 border-rose-200 text-rose-500'
                          : 'bg-primary-container border-primary/20 text-primary'
                      }`}>
                        ĐÃ CHỌN: {checkedCount}/{activeSession.so_dv_toi_da_moi_buoi} DỊCH VỤ TỐI ĐA
                      </span>
                    </h4>
                    <span className="text-[9px] text-zinc-400 font-bold">* MỖI DỊCH VỤ CHỈ THỰC HIỆN TỐI ĐA 1 LẦN/BUỔI</span>
                  </div>

                  {/* Checklist Table */}
                  <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 uppercase tracking-wider font-heading">
                          <th className="p-3 font-bold w-12 text-center">Thực hiện</th>
                          <th className="p-3 font-bold">Kỹ thuật lâm sàng</th>
                          <th className="p-3 font-bold text-center">Bắt buộc</th>
                          <th className="p-3 font-bold text-center">Đã dùng / Hạn mức gói</th>
                          <th className="p-3 font-bold text-center w-24">Số lần buổi này</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {activeSession.chi_tiet_dich_vu.map((item: any) => {
                          const isChecked = !!selectedServices[item.id];
                          const isExhausted = item.used >= item.limit;

                          return (
                            <tr 
                              key={item.id} 
                              className={`transition-colors ${
                                isChecked ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-zinc-50/50'
                              } ${isExhausted ? 'opacity-50' : ''}`}
                            >
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  disabled={activeSession.trang_thai === 'hoan_thanh' || isExhausted}
                                  onClick={() => handleToggleService(item)}
                                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                    isChecked
                                      ? 'bg-primary border-primary text-white shadow-sm'
                                      : 'bg-white border-zinc-200 text-transparent hover:border-primary'
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                </button>
                              </td>
                              <td className="p-3">
                                <p className={`font-bold ${isChecked ? 'text-primary' : 'text-secondary'}`}>
                                  {item.name}
                                </p>
                              </td>
                              <td className="p-3 text-center">
                                {item.batBuoc ? (
                                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-primary-container border border-primary/20 text-primary rounded-lg">BẮT BUỘC</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 text-[8px] font-bold bg-zinc-100 text-zinc-400 border border-zinc-200 rounded-lg">LINH ĐỘNG</span>
                                )}
                              </td>
                              <td className="p-3 text-center font-bold text-zinc-500">
                                <span className={isExhausted ? 'text-rose-500 font-bold' : 'text-zinc-650'}>
                                  {item.used}
                                </span>
                                <span className="text-zinc-350 font-normal"> / {item.limit} LẦN</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`font-bold font-mono text-xs ${isChecked ? 'text-primary' : 'text-zinc-450'}`}>
                                  {isChecked ? '1 Lần' : '0 Lần'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* KTV CLINICAL EVALUATIONS NOTES */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">HỘP II: GHI CHÚ LÂM SÀNG & KHẢO SÁT PHỤC HỒI</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Ghi chú trạng thái TRƯỚC buổi điều trị</label>
                      <textarea
                        value={beforeNotes}
                        onChange={(e) => setBeforeNotes(e.target.value)}
                        disabled={activeSession.trang_thai === 'hoan_thanh'}
                        rows={3}
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-300 resize-none font-medium text-xs shadow-inner"
                        placeholder="Ví dụ: Bệnh nhân mỏi buốt thắt lưng, cúi người đau co thắt nhẹ..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Ghi chú tiến trình SAU buổi điều trị</label>
                      <textarea
                        value={afterNotes}
                        onChange={(e) => setAfterNotes(e.target.value)}
                        disabled={activeSession.trang_thai === 'hoan_thanh'}
                        rows={3}
                        className="w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary placeholder-zinc-300 resize-none font-medium text-xs shadow-inner"
                        placeholder="Ví dụ: Sau kéo giãn và giải cơ mông, đi lại nhẹ nhàng, bớt buốt mông..."
                      ></textarea>
                    </div>
                  </div>

                  {/* Restoration Index slider */}
                  <div className="p-4 border border-zinc-200 rounded-2xl bg-zinc-50/50 space-y-2.5 shadow-inner">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Chỉ số lượng giá phục hồi lực cơ thắt lưng
                      </span>
                      <span className="font-bold font-heading text-sm text-primary">{restorationIndex}% (Tiến triển tốt)</span>
                    </div>
                    <input 
                      type="range" 
                      min={10} 
                      max={100} 
                      value={restorationIndex} 
                      disabled={activeSession.trang_thai === 'hoan_thanh'}
                      onChange={(e) => setRestorationIndex(Number(e.target.value))}
                      className="w-full h-1.5 bg-zinc-250 rounded-lg appearance-none cursor-pointer accent-primary" 
                    />
                    <div className="flex justify-between text-[9px] text-zinc-400 font-bold">
                      <span>10% (ĐAU CO THẮT)</span>
                      <span>50% (ĐAU NHẸ/TÊ BÌ)</span>
                      <span>100% (KHÔI PHỤC HOÀN TOÀN)</span>
                    </div>
                  </div>
                </div>

                {/* Complete Action Button */}
                {activeSession.trang_thai !== 'hoan_thanh' && (
                  <div className="pt-4 border-t border-zinc-200 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCompleteSession}
                      className="bg-primary hover:bg-primary/95 text-white shadow-soft-button active:scale-95 px-8 py-3 rounded-xl font-heading text-xs font-bold tracking-wider transition-all flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      XÁC NHẬN HOÀN THÀNH BUỔI TRỊ LIỆU HÔM NAY
                    </button>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-zinc-50/30 text-zinc-400 text-xs uppercase tracking-wider font-bold">
              VUI LÒNG CHỌN CA TRỊ LIỆU TRÊN DIRECTORY ĐỂ BẮT ĐẦU can thiệp chuyên môn
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
