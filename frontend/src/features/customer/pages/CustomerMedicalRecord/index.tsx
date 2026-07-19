import { HeartPulse, Sparkles, FileText } from 'lucide-react';
import { useMedicalRecord } from './hooks/useMedicalRecord';
import { RecordHeader } from './components/RecordHeader';
import { RecordTabs } from './components/RecordTabs';
import { PackageCard } from './components/PackageCard';
import { SingleTreatmentCard } from './components/SingleTreatmentCard';
import { ExamHistoryCard } from './components/ExamHistoryCard';
import { EmptyRecordState } from './components/EmptyRecordState';

export default function CustomerMedicalRecord() {
  const record = useMedicalRecord();

  if (record.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-zinc-500">Đang tải hồ sơ &amp; hóa đơn y khoa...</p>
      </div>
    );
  }

  const { khach_hang, lich_su_kham = [], goi_dieu_tri = [], dieu_tri_le = [] } = record.data || {};

  if (!khach_hang) {
    return (
      <div className="max-w-3xl mx-auto">
        <EmptyRecordState
          icon={<HeartPulse size={22} />}
          title="Không thể tải hồ sơ trị liệu"
          description="Đã có lỗi khi tải dữ liệu. Vui lòng thử tải lại trang hoặc liên hệ lễ tân nếu tình trạng này lặp lại."
          showCta={false}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <RecordHeader khachHang={khach_hang} goiDieuTri={goi_dieu_tri} />

      <RecordTabs
        activeTab={record.activeTab}
        goiCount={goi_dieu_tri.length}
        leCount={dieu_tri_le.length}
        khamCount={lich_su_kham.length}
        onChange={record.setActiveTab}
      />

      {record.activeTab === 'goi' && (
        <div className="space-y-6">
          {goi_dieu_tri.length === 0 ? (
            <EmptyRecordState
              icon={<HeartPulse size={22} />}
              title="Bạn chưa đăng ký gói trị liệu nào"
              description="Đăng ký gói liệu trình để theo dõi tiến trình phục hồi, lịch sử từng buổi và thang đo giảm đau theo thời gian."
            />
          ) : (
            goi_dieu_tri.map((pkg) => (
              <PackageCard
                key={pkg.phac_do_id}
                pkg={pkg}
                isExpanded={!!record.expandedPackages[pkg.phac_do_id]}
                onToggleExpand={() => record.togglePackage(pkg.phac_do_id)}
              />
            ))
          )}
        </div>
      )}

      {record.activeTab === 'le' && (
        <div className="space-y-6">
          {dieu_tri_le.length === 0 ? (
            <EmptyRecordState
              icon={<Sparkles size={22} />}
              title="Chưa có dịch vụ lẻ nào"
              description="Các buổi trị liệu lẻ (không thuộc gói liệu trình) bạn từng thực hiện sẽ hiển thị ở đây, kèm chẩn đoán và hóa đơn liên quan."
            />
          ) : (
            dieu_tri_le.map((item) => (
              <SingleTreatmentCard key={item.cuoc_hen_id} item={item} />
            ))
          )}
        </div>
      )}

      {record.activeTab === 'kham' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lich_su_kham.length === 0 ? (
            <div className="col-span-full">
              <EmptyRecordState
                icon={<FileText size={22} />}
                title="Bạn chưa có lịch sử khám lâm sàng nào"
                description="Mọi phiếu chẩn đoán lâm sàng đầu vào từ Bác sĩ sẽ được số hóa và hiển thị ở đây."
              />
            </div>
          ) : (
            lich_su_kham.map((exam) => (
              <ExamHistoryCard key={exam.cuoc_hen_id} exam={exam} onJumpToPackage={record.jumpToPackage} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
