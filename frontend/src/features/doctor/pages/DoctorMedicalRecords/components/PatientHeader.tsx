import React from 'react';
import { Phone, Mail, Calendar, ChevronLeft } from 'lucide-react';
import { PatientInfo } from '../../../api/doctor.api';

interface PatientHeaderProps {
  selectedPatient: PatientInfo;
  onBack: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ selectedPatient, onBack }) => {
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="p-6 border-b border-slate-150 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
      {/* Patient Avatar & Personal Info */}
      <div className="flex items-start gap-4 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="p-2.5 bg-white dark:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:text-secondary dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 shrink-0 mt-0.5"
        >
          <ChevronLeft size={16} className="stroke-[3]" />
        </button>
        <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-sm shrink-0">
          {selectedPatient.ho_ten.charAt(0).toUpperCase()}
        </div>
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-base font-extrabold text-secondary dark:text-slate-100 truncate">
              {selectedPatient.ho_ten}
            </h2>
            <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              selectedPatient.gioi_tinh === 'nam' 
                ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border border-blue-100 dark:border-blue-900/25' 
                : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/25'
            }`}>
              {selectedPatient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
            </span>
            {selectedPatient.ngay_sinh && (
              <span className="text-[8px] font-extrabold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 uppercase">
                {getAge(selectedPatient.ngay_sinh)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Phone size={13} className="text-slate-400 shrink-0" />
              {selectedPatient.so_dien_thoai}
            </span>
            {selectedPatient.email && (
              <span className="flex items-center gap-1.5 min-w-0">
                <Mail size={13} className="text-slate-400 shrink-0" />
                <span className="truncate">{selectedPatient.email}</span>
              </span>
            )}
            {selectedPatient.ngay_sinh && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400 shrink-0" />
                <span>NS: {formatDate(selectedPatient.ngay_sinh)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
