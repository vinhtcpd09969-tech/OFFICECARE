import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, X, Stethoscope, Zap, Hand, Dumbbell, ShieldCheck, Activity, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { getPublicServices, getPublicPackages, getPublicCategories } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import ScrollReveal from '../components/shared/ScrollReveal';

interface UnifiedService {
  id: string;
  ten_goi: string;
  ma_goi: string;
  mo_ta: string;
  tong_so_buoi: number;
  gia_tien: number;
  thoi_luong_phut?: number;
  anh_goi?: string;
  loai_goi: 'KHAM' | 'LE' | 'LIEU_TRINH';
  danh_muc_id?: number | string | null;
  luot_dung: number;
}

interface Category {
  id: string;
  ten_danh_muc: string;
  mo_ta: string | null;
  loai_goi_ap_dung: 'KHAM' | 'LE' | 'LIEU_TRINH';
}

const TAB_OPTIONS: { key: 'KHAM' | 'LE' | 'LIEU_TRINH'; label: string; icon: typeof Stethoscope }[] = [
  { key: 'KHAM', label: 'Khám Lâm Sàng', icon: Stethoscope },
  { key: 'LE', label: 'Trị Liệu Đơn Buổi', icon: Zap },
  { key: 'LIEU_TRINH', label: 'Liệu Trình Chuyên Sâu', icon: ShieldCheck },
];

function getCategoryIcon(tenDanhMuc: string) {
  const name = tenDanhMuc.toLowerCase();
  if (name.includes('công nghệ')) return Zap;
  if (name.includes('thủ công')) return Hand;
  if (name.includes('thể thao')) return Dumbbell;
  if (name.includes('phòng ngừa') || name.includes('duy trì')) return ShieldCheck;
  if (name.includes('khám')) return Stethoscope;
  return Activity;
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<UnifiedService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'KHAM' | 'LE' | 'LIEU_TRINH'>('KHAM');
  const [showLieuTrinhWarning, setShowLieuTrinhWarning] = useState(false);

  const handleTabChange = (tab: 'KHAM' | 'LE' | 'LIEU_TRINH') => {
    setActiveTab(tab);
    setSelectedCategoryId('ALL');
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, packagesRes, categoriesRes] = await Promise.all([
          getPublicServices(),
          getPublicPackages(),
          getPublicCategories()
        ]);
        setCategories(categoriesRes.data);

        // Map services (KHAM and LE)
        const servicesMapped = servicesRes.data.map((s: any) => ({
          id: s.id.toString(),
          ten_goi: s.ten_dich_vu,
          ma_goi: s.loai_dich_vu === 'KHAM' ? 'KHAM' : 'LE',
          mo_ta: s.quy_trinh || s.muc_tieu || 'Dịch vụ lượng giá lâm sàng và trị liệu chuyên khoa cơ xương khớp.',
          quy_trinh: s.quy_trinh,
          muc_tieu: s.muc_tieu,
          tong_so_buoi: 1,
          gia_tien: Number(s.don_gia),
          thoi_luong_phut: s.thoi_luong_phut,
          anh_goi: s.anh_goi || (s.loai_dich_vu === 'KHAM' ? '/goi/images/kham_sang_loc.png' : '/goi/images/laser_tri_lieu.png'),
          loai_goi: s.loai_dich_vu === 'KHAM' ? 'KHAM' : 'LE',
          danh_muc_id: s.danh_muc_id,
          luot_dung: Number(s.luot_dung || 0)
        }));

        // Map packages (LIEU_TRINH)
        const packagesMapped = packagesRes.data.map((p: any) => ({
          id: p.id.toString(),
          ten_goi: p.ten_goi,
          ma_goi: p.ma_goi || 'LIEU_TRINH',
          mo_ta: p.quy_trinh || p.muc_tieu || 'Lộ trình phục hồi toàn diện cá nhân hóa theo phác đồ bác sĩ.',
          quy_trinh: p.quy_trinh,
          muc_tieu: p.muc_tieu,
          tong_so_buoi: p.tong_so_buoi,
          gia_tien: Number(p.gia_tien),
          thoi_luong_phut: p.thoi_luong_phut || 60,
          anh_goi: p.anh_goi || '/goi/images/giai_co_sau.png',
          loai_goi: 'LIEU_TRINH',
          danh_muc_id: p.danh_muc_id,
          luot_dung: Number(p.luot_dung || 0)
        }));

        setItems([...servicesMapped, ...packagesMapped]);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách dịch vụ:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const activeCategories = categories.filter(cat => cat.loai_goi_ap_dung === activeTab);

  const filteredItems = items.filter(item => {
    if (item.loai_goi !== activeTab) return false;
    if (selectedCategoryId !== 'ALL' && item.danh_muc_id !== selectedCategoryId) return false;
    return true;
  });

  const khamCount = items.filter(item => item.loai_goi === 'KHAM').length;
  const leCount = items.filter(item => item.loai_goi === 'LE').length;
  const lieuTrinhCount = items.filter(item => item.loai_goi === 'LIEU_TRINH').length;
  const countByTab = { KHAM: khamCount, LE: leCount, LIEU_TRINH: lieuTrinhCount };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      <div className="max-w-7xl mx-auto px-6">

        {/* Centered Header */}
        <div className="mb-10 max-w-3xl mx-auto text-center">
          <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3 shadow-sm">
            ✨ DỊCH VỤ & LIỆU TRÌNH Y KHOA
          </span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mb-3">
            Giải Pháp <span className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] bg-clip-text text-transparent">Trị Liệu & Phục Hồi</span>
          </h1>
          <p className="text-slate-500 font-semibold text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
            Tất cả dịch vụ được chuẩn hóa y khoa với các thiết bị vật lý trị liệu tân tiến cùng phác đồ cá nhân hóa từ chuyên gia.
          </p>
        </div>

        {/* Primary Pill Filter Row: Loại dịch vụ */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4">
          {TAB_OPTIONS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                  activeTab === tab.key
                    ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-sm shadow-teal-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-[#14B8A6]/40'
                }`}
              >
                <Icon size={13} />
                {tab.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>{countByTab[tab.key]}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Pill Filter Row: Danh mục trong loại đang chọn */}
        {activeCategories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
            <button
              type="button"
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border ${
                selectedCategoryId === 'ALL'
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Tất cả danh mục
            </button>
            {activeCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.ten_danh_muc);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all border ${
                    selectedCategoryId === cat.id
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon size={12} />
                  {cat.ten_danh_muc}
                </button>
              );
            })}
          </div>
        )}

        {/* 3-Column Responsive Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-semibold text-sm">
            Không có dịch vụ nào trong mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, idx) => (
              <ScrollReveal key={item.id} delay={(idx % 3) * 100}>
                <motion.div
                  whileHover={{ y: -6, boxShadow: '0 20px 45px -15px rgba(15,23,42,0.08)' }}
                  className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-sm transition-all duration-300 flex flex-col h-full overflow-hidden"
                >
                  <div>
                    {/* Visual Thumbnail */}
                    <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 relative mb-4">
                      <img
                        src={item.anh_goi || '/goi/images/giai_co_sau.png'}
                        alt={item.ten_goi}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/15 to-transparent"></div>

                      {item.thoi_luong_phut && (
                        <div className="absolute bottom-2.5 left-2.5 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-[9px] font-bold text-white shadow-sm border border-white/5">
                          <Clock size={10} className="text-[#14B8A6]" />
                          <span>{item.thoi_luong_phut} phút</span>
                        </div>
                      )}

                      {item.luot_dung > 0 && (
                        <div className="absolute top-2.5 right-2.5 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1 text-[9px] font-black text-white shadow-sm border border-white/5">
                          <Flame size={10} className="text-amber-400" />
                          <span>{item.luot_dung} lượt đặt</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-black text-sm text-slate-800 leading-snug mb-2.5 min-h-[40px] line-clamp-2">
                      {item.ten_goi}
                    </h3>

                    {/* Price and Session info */}
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-base font-black text-slate-900">
                        {item.gia_tien === 0 ? 'Liên hệ' : item.gia_tien.toLocaleString('vi-VN') + ' đ'}
                      </span>
                      {item.loai_goi === 'LIEU_TRINH' ? (
                        <span className="text-[10px] text-slate-400 font-bold">/ {item.tong_so_buoi} buổi</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">/ buổi</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 mt-auto">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.loai_goi === 'LIEU_TRINH') {
                          navigate(`/packages/${item.id}`);
                        } else {
                          navigate(`/services/${item.id}`);
                        }
                      }}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-center font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 border border-slate-200/60 cursor-pointer active:scale-98"
                    >
                      Chi Tiết
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (item.loai_goi === 'LIEU_TRINH') {
                          setShowLieuTrinhWarning(true);
                        } else {
                          navigate('/booking', {
                            state: {
                              bookingType: item.loai_goi === 'KHAM' ? 'kham' : 'dich_vu',
                              selectedServiceId: item.id
                            }
                          });
                        }
                      }}
                      className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer active:scale-98 shadow-sm shadow-[#2EC4B6]/15"
                    >
                      Đặt Lịch
                    </button>
                  </div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        )}

      </div>

      {/* Gói Liệu Trình Warning Modal */}
      {showLieuTrinhWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-[32px] border border-slate-100 max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowLieuTrinhWarning(false)}
              className="absolute top-6 right-6 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-heading font-black text-slate-900 uppercase tracking-wide">Yêu cầu chỉ định thăm khám</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Gói liệu trình chuyên sâu cần có chỉ định thăm khám lâm sàng từ Bác sĩ chuyên khoa trước khi thực hiện để đảm bảo an toàn & hiệu quả điều trị.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowLieuTrinhWarning(false);
                  navigate('/booking', { state: { bookingType: 'kham' } });
                }}
                className="bg-primary hover:bg-[#25A89C] text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-sm transition-all"
              >
                Tiếp tục đặt lịch khám
              </button>
              <button
                type="button"
                onClick={() => setShowLieuTrinhWarning(false)}
                className="bg-zinc-50 hover:bg-zinc-100 text-slate-650 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl border border-zinc-200 transition-all"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
