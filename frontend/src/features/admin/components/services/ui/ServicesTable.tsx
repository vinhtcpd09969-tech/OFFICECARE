import React from 'react';
import { Service } from '../types';
import { ServiceRow } from './ServiceRow';
import { ServiceDetailRow } from './ServiceDetailRow';

interface ServicesTableProps {
  loading: boolean;
  filteredServices: Service[];
  selectedType: 'chinh' | 'bo_sung';
  searchQuery: string;
  onSearchChange: (val: string) => void;
  packageCountMap: Record<string | number, number>;
  serviceUsageNamesMap: Record<string | number, string[]>;
  expandedServiceIds: Record<string | number, boolean>;
  toggleExpandService: (id: string | number) => void;
  handleToggleStatus: (svc: Service) => void;
  handleEdit: (svc: Service) => void;
  handleDelete: (svc: Service) => void;
}

export function ServicesTable({
  loading,
  filteredServices,
  selectedType,
  searchQuery,
  onSearchChange,
  packageCountMap,
  serviceUsageNamesMap,
  expandedServiceIds,
  toggleExpandService,
  handleToggleStatus,
  handleEdit,
  handleDelete
}: ServicesTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
      {/* Search & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-zinc-50 p-4 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider">
            {selectedType === 'chinh' 
              ? `Danh sách kỹ thuật lâm sàng nội bộ (${filteredServices.length})`
              : `Danh sách dịch vụ đơn lẻ & bổ trợ (${filteredServices.length})`
            }
          </span>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder={selectedType === 'chinh' ? "Tìm kiếm tên kỹ thuật nội bộ..." : "Tìm tên dịch vụ lẻ..."}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-secondary placeholder-zinc-400 transition-all shadow-inner font-semibold" 
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 text-[11px] font-bold font-heading uppercase tracking-wider">
              <th className="p-4">{selectedType === 'chinh' ? 'Dịch vụ kỹ thuật nội bộ' : 'Dịch vụ lẻ bổ trợ'}</th>
              {selectedType === 'chinh' ? (
                <th className="p-4">Dùng trong gói</th>
              ) : (
                <>
                  <th className="p-4">Chuyên khoa</th>
                  <th className="p-4 text-right">Thời lượng</th>
                  <th className="p-4 text-right">Đơn giá</th>
                </>
              )}
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading ? (
              <tr>
                <td colSpan={selectedType === 'chinh' ? 5 : 6} className="p-12 text-center text-zinc-400 font-sans text-xs">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                  ĐANG TRUY VẤN CƠ SỞ DỮ LIỆU...
                </td>
              </tr>
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan={selectedType === 'chinh' ? 5 : 6} className="p-12 text-center text-zinc-400 font-sans text-xs">
                  CHƯA CÓ THIẾT LẬP DỊCH VỤ NÀO CHO PHÂN PHÂN LOẠI NÀY
                </td>
              </tr>
            ) : (
              filteredServices.map((svc) => {
                const isExpanded = !!expandedServiceIds[svc.id];
                const pkgCount = packageCountMap[svc.id] || 0;
                const usageNames = serviceUsageNamesMap[svc.id] || [];

                return (
                  <React.Fragment key={svc.id}>
                    <ServiceRow
                      svc={svc}
                      selectedType={selectedType}
                      pkgCount={pkgCount}
                      usageNames={usageNames}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpandService(svc.id)}
                      onToggleStatus={() => handleToggleStatus(svc)}
                      onEdit={() => handleEdit(svc)}
                      onDelete={() => handleDelete(svc)}
                    />
                    {isExpanded && (
                      <ServiceDetailRow
                        svc={svc}
                        selectedType={selectedType}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="p-4 border-t border-zinc-200 flex items-center justify-between bg-zinc-50/50 text-zinc-500 text-xs">
        <p className="font-semibold">
          Hiển thị <span className="font-bold text-secondary">1 - {filteredServices.length}</span> trong tổng số <span className="font-bold text-secondary">{filteredServices.length}</span> mục
        </p>
        <div className="flex items-center gap-1">
          <button type="button" className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-400 active:scale-95 font-bold transition-all">TRƯỚC</button>
          <button type="button" className="px-3.5 py-1.5 rounded-lg border border-primary/20 bg-primary text-white font-bold transition-all shadow-sm">1</button>
          <button type="button" className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-400 active:scale-95 font-bold transition-all">KẾ TIẾP</button>
        </div>
      </div>
    </div>
  );
}
export default ServicesTable;
