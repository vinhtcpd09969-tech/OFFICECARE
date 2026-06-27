import { useState } from 'react';
import { useSchedulesState } from '../components/schedules/hooks/useSchedulesState';
import { SchedulesHeader } from '../components/schedules/ui/SchedulesHeader';
import { SchedulesKpis } from '../components/schedules/ui/SchedulesKpis';
import { SchedulesGrid } from '../components/schedules/ui/SchedulesGrid';
import { SchedulesSidebar } from '../components/schedules/ui/SchedulesSidebar';
import { ScheduleFormModal } from '../components/schedules/ui/ScheduleFormModal';
import { Schedule } from '../components/schedules/types';

export default function ManageSchedules() {
  const {
    schedules,
    staff,
    rooms,
    loading,
    selectedWeek,
    setSelectedWeek,
    roleFilter,
    setRoleFilter,
    weekDates,
    groupedStaff,
    conflicts,
    stats,
    weeklyStatsByStaff,
    handleDeleteScheduleById,
    fetchData
  } = useSchedulesState();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [prefilledStaffId, setPrefilledStaffId] = useState<string | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<'morning' | 'afternoon' | 'tam_nghi'>('morning');

  const handleOpenAddModal = (userId: string, dateStr?: string) => {
    setEditingSchedule(null);
    setPrefilledStaffId(userId);
    setPrefilledDate(dateStr || null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sched: Schedule) => {
    setEditingSchedule(sched);
    setPrefilledStaffId(sched.nguoi_dung_id);
    setPrefilledDate(sched.ngay);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setPrefilledStaffId(null);
    setPrefilledDate(null);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingSchedule(null);
    setPrefilledStaffId(null);
    setPrefilledDate(null);
    fetchData();
  };

  const handleDeleteSchedule = async () => {
    if (!editingSchedule) return;
    const success = await handleDeleteScheduleById(editingSchedule.id);
    if (success) {
      handleSuccess();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-semibold select-none">Đang tải dữ liệu lịch trực...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-sans text-sm text-gray-800">
      
      {/* Header, Week Selector, Role selector */}
      <SchedulesHeader
        selectedWeek={selectedWeek}
        onSelectWeek={setSelectedWeek}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
      />

      {/* KPI Cards */}
      <SchedulesKpis stats={stats} />

      {/* Main Grid Layout */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left: Schedule Grid */}
        <SchedulesGrid
          weekDates={weekDates}
          groupedStaff={groupedStaff}
          schedules={schedules}
          conflicts={conflicts}
          onOpenModal={handleOpenAddModal}
          onOpenEditModal={handleOpenEditModal}
        />

        {/* Right: Conflict & Weekly Stats Sidebar */}
        <SchedulesSidebar
          conflicts={conflicts}
          weeklyStatsByStaff={weeklyStatsByStaff}
          onOpenModal={handleOpenAddModal}
        />
      </div>

      {/* Modal Popup for scheduling */}
      <ScheduleFormModal
        isOpen={isModalOpen}
        staff={staff}
        rooms={rooms}
        schedules={schedules}
        editingSchedule={editingSchedule}
        prefilledStaffId={prefilledStaffId}
        prefilledDate={prefilledDate}
        selectedShiftType={selectedShiftType}
        setSelectedShiftType={setSelectedShiftType}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        onDeleteSchedule={handleDeleteSchedule}
      />
    </div>
  );
}
