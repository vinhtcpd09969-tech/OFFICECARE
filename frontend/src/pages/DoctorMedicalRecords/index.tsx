import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { getPatients, getPatientProfile, PatientInfo, PatientProfile } from '../../features/doctor/api/doctor.api';
import { PatientSidebar } from './components/PatientSidebar';
import { PatientDossierTimeline } from './components/PatientDossierTimeline';
import { PlanDetailModal } from './components/PlanDetailModal';
import { VisitDetailModal } from './components/VisitDetailModal';

type ActiveModal = { type: 'plan'; id: string } | { type: 'visit'; id: string } | null;

export default function DoctorMedicalRecords() {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Deep-link từ nơi khác (vd nút "Xem chi tiết" của 1 lịch hẹn đã kết thúc trong AppointmentInfoModal)
  // — tự chọn sẵn bệnh nhân + mở đúng popup buổi khám/phác đồ tương ứng, chỉ áp dụng 1 lần lúc vào trang.
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingDeepLinkModal, setPendingDeepLinkModal] = useState<ActiveModal>(null);

  // Load danh sách bệnh nhân
  useEffect(() => {
    async function loadPatients() {
      setLoadingPatients(true);
      try {
        const res = await getPatients();
        setPatients(res.data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách bệnh nhân:', error);
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, []);

  // Áp dụng deep-link (?patientId=&type=&itemId=) ngay khi danh sách bệnh nhân đã sẵn sàng, rồi xóa
  // param khỏi URL để không tự chọn lại nếu người dùng tự quay ra danh sách chọn bệnh nhân khác.
  useEffect(() => {
    if (loadingPatients) return;
    const patientId = searchParams.get('patientId');
    if (!patientId) return;

    const found = patients.find((p) => p.id === patientId);
    if (found) {
      setSelectedPatient(found);
      const type = searchParams.get('type');
      const itemId = searchParams.get('itemId');
      if ((type === 'plan' || type === 'visit') && itemId) {
        setPendingDeepLinkModal({ type, id: itemId });
      }
    }
    setSearchParams({}, { replace: true });
  }, [patients, loadingPatients, searchParams, setSearchParams]);

  // Load hồ sơ điều trị của bệnh nhân được chọn
  useEffect(() => {
    if (!selectedPatient) {
      setProfile(null);
      return;
    }

    async function loadProfile() {
      setLoadingProfile(true);
      setActiveModal(null);
      try {
        const res = await getPatientProfile(selectedPatient!.id);
        setProfile(res.data);
        if (pendingDeepLinkModal) {
          setActiveModal(pendingDeepLinkModal);
          setPendingDeepLinkModal(null);
        }
      } catch (error) {
        console.error('Lỗi khi tải hồ sơ điều trị bệnh nhân:', error);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [selectedPatient]);

  const activePlan = useMemo(() => {
    if (activeModal?.type !== 'plan' || !profile) return null;
    return profile.treatmentPlans.find((p) => p.id === activeModal.id) || null;
  }, [activeModal, profile]);

  const activeVisit = useMemo(() => {
    if (activeModal?.type !== 'visit' || !profile) return null;
    return profile.visits.find((v) => v.id === activeModal.id) || null;
  }, [activeModal, profile]);

  const linkedPlanForActiveVisit = useMemo(() => {
    if (!activeVisit?.prescribed_plan_id || !profile) return null;
    return profile.treatmentPlans.find((p) => p.id === activeVisit.prescribed_plan_id) || null;
  }, [activeVisit, profile]);

  return (
    <div className="animate-in fade-in duration-500">
      {!selectedPatient ? (
        <PatientSidebar
          patients={patients}
          onSelectPatient={setSelectedPatient}
          loadingPatients={loadingPatients}
        />
      ) : (
        <div>
          {loadingProfile ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="size-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">
                Đang tổng hợp dòng thời gian hồ sơ y tế bệnh nhân...
              </p>
            </div>
          ) : (
            <PatientDossierTimeline
              selectedPatient={selectedPatient}
              profile={profile}
              onBack={() => setSelectedPatient(null)}
              onOpenVisit={(visitId) => setActiveModal({ type: 'visit', id: visitId })}
              onOpenPlan={(planId) => setActiveModal({ type: 'plan', id: planId })}
            />
          )}
        </div>
      )}

      <AnimatePresence>
        {activePlan && (
          <PlanDetailModal
            key={`plan-${activePlan.id}`}
            plan={activePlan}
            onClose={() => setActiveModal(null)}
            onJumpToVisit={(visitId) => setActiveModal({ type: 'visit', id: visitId })}
          />
        )}
        {activeVisit && (
          <VisitDetailModal
            key={`visit-${activeVisit.id}`}
            visit={activeVisit}
            linkedPlan={linkedPlanForActiveVisit}
            onClose={() => setActiveModal(null)}
            onJumpToPlan={(planId) => setActiveModal({ type: 'plan', id: planId })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
