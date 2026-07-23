import React, { useState, useMemo } from 'react';
import { Search, ClipboardPlus, Inbox } from 'lucide-react';
import { PatientInfo } from '../../../api/doctor.api';
import { formatDaysAgo } from '../../../../../utils/date';

interface PatientSidebarProps {
  patients: PatientInfo[];
  onSelectPatient: (patient: PatientInfo) => void;
  loadingPatients: boolean;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patients,
  onSelectPatient,
  loadingPatients,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getAge = (birthday?: string) => {
    if (!birthday) return '';
    try {
      const birthYear = new Date(birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} tuổi`;
    } catch {
      return '';
    }
  };

  // Lọc tìm kiếm
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const name = p.ho_ten.toLowerCase();
      const phone = p.so_dien_thoai || '';
      const search = searchTerm.toLowerCase();
      return name.includes(search) || phone.includes(search);
    });
  }, [patients, searchTerm]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Search Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black text-secondary dark:text-slate-100 uppercase tracking-wider">
            Hồ sơ Bệnh nhân
          </h3>
          <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
            Tìm kiếm & truy xuất EHR nhanh
          </p>
        </div>
        <div className="relative group w-full sm:w-72 shrink-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nhập tên hoặc số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-secondary dark:text-slate-100 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[14%]" />
            <col className="w-[20%]" />
            <col className="w-[16%]" />
            <col className="w-[24%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4 font-black">Bệnh nhân</th>
              <th className="p-4 font-black">Giới tính / Tuổi</th>
              <th className="p-4 font-black">Liên hệ</th>
              <th className="p-4 font-black">Lần cuối dùng dịch vụ</th>
              <th className="p-4 font-black text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {loadingPatients ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="p-4">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" style={{ width: j === 0 ? '70%' : '50%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                    <Inbox size={28} className="stroke-[1.5]" />
                    <span className="font-semibold text-xs">Không tìm thấy bệnh nhân nào</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onSelectPatient(p)}
                  className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-[11px] uppercase shrink-0">
                        {p.ho_ten.charAt(0)}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-secondary dark:text-slate-100 font-bold truncate">{p.ho_ten}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 font-semibold">
                    {p.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'} • {getAge(p.ngay_sinh) || 'N/A'}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{p.so_dien_thoai || '-'}</span>
                      <span className="text-[10px] text-slate-400">{p.email || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 dark:text-slate-400 font-semibold">
                    {formatDaysAgo(p.lan_cuoi_su_dung)}
                  </td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/40 bg-primary/5 text-primary dark:text-primary rounded-lg text-[10px] font-black">
                      <ClipboardPlus size={13} />
                      Xem hồ sơ
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
