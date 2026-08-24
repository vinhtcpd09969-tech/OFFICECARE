import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PatientDossierTimeline } from '@/features/clinical/components/PatientDossierTimeline';
import { getPatientProfile, PatientProfile } from '@/features/doctor/api/doctor.api';
import { useAuthStore } from '@/stores/authStore';
import { BookNextSessionModal } from '@/features/customer/components/BookNextSessionModal';

export default function CustomerMedicalRecord() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingSessionPlan, setBookingSessionPlan] = useState<any | null>(null);

  const reloadProfile = () => {
    if (!currentUser?.id) return;
    getPatientProfile(String(currentUser.id))
      .then((res: { data: PatientProfile }) => setProfile(res.data))
      .catch((err: unknown) => console.error('Failed to reload customer profile', err));
  };

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getPatientProfile(String(currentUser.id))
      .then((res: { data: PatientProfile }) => setProfile(res.data))
      .catch((err: unknown) => console.error('Failed to load customer patient profile', err))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="size-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">
          Đang tải hồ sơ điều trị & dòng thời gian...
        </p>
      </div>
    );
  }

  const patient = profile?.patient;

  if (!patient) {
    return (
      <div className="max-w-3xl mx-auto p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 space-y-2">
        <h3 className="text-base font-black text-slate-800 dark:text-zinc-200">Chưa tìm thấy dữ liệu hồ sơ cá nhân</h3>
        <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
          Bạn chưa có dữ liệu lịch sử lượng giá hoặc gói liệu trình điều trị nào trên hệ thống.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PatientDossierTimeline
        selectedPatient={{
          id: patient.id,
          ma_khach_hang: patient.ma_khach_hang || `KH-${patient.id.substring(0, 8).toUpperCase()}`,
          ho_ten: patient.ho_ten,
          so_dien_thoai: patient.so_dien_thoai || '',
          email: patient.email || '',
        }}
        profile={profile}
        onBack={() => navigate('/')}
        onBookNextSession={(plan) => {
          setBookingSessionPlan({
            id: plan.id,
            phac_do_id: plan.id,
            ten_goi: (plan as any).ten_goi_dich_vu || (plan as any).ten_goi || plan.ten_dich_vu || 'Gói điều trị',
            goi_dich_vu_id: (plan as any).goi_dich_vu_id || plan.id,
            thoi_luong_phut: (plan as any).thoi_luong_phut || 45,
            tong_so_buoi: plan.tong_so_buoi,
            so_buoi_da_dung: plan.so_buoi_da_dung || 0,
            khach_hang_id: patient.id,
          });
        }}
      />

      {bookingSessionPlan && (
        <BookNextSessionModal
          isOpen={!!bookingSessionPlan}
          packagePlan={bookingSessionPlan}
          onClose={() => setBookingSessionPlan(null)}
          onSuccess={() => {
            setBookingSessionPlan(null);
            reloadProfile();
          }}
        />
      )}
    </div>
  );
}
