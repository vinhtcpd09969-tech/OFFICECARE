interface ServicesHeaderProps {
  selectedType: 'chinh' | 'bo_sung';
  onAddClick: () => void;
}

export function ServicesHeader({ selectedType, onAddClick }: ServicesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden">
      <div className="absolute right-0 top-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
          <span className="text-xs font-heading tracking-wider text-primary uppercase font-bold">Không gian làm việc</span>
        </div>
        <h2 className="text-2xl font-bold font-heading text-secondary tracking-tight">CẤU HÌNH DỊCH VỤ</h2>
        <p className="text-zinc-500 text-xs mt-1">Cấu hình thời lượng trị liệu, đơn giá và quản lý định danh dịch vụ kỹ thuật y khoa & đơn lẻ</p>
      </div>
      <button 
        onClick={onAddClick}
        className="bg-primary hover:bg-primary/90 hover:shadow-soft-button active:scale-95 text-white px-5 py-2.5 rounded-xl font-heading text-xs font-bold tracking-wide transition-all shadow-sm flex items-center gap-2 shrink-0"
      >
        [+] THÊM {selectedType === 'chinh' ? 'KỸ THUẬT MỚI' : 'DỊCH VỤ MỚI'}
      </button>
    </div>
  );
}
export default ServicesHeader;
