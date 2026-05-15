import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../../api/admin.api';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs();
      setLogs(res.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchAction = filterAction === 'ALL' || log.action === filterAction;
    const matchDate = !filterDate || (log.created_at && log.created_at.startsWith(filterDate));
    return matchAction && matchDate;
  });

  // Extract unique actions for the filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Nhật ký Hệ thống (Audit Log)</h2>
          <p className="text-slate-500 mt-1">Lưu trữ các thao tác quan trọng trên hệ thống (Chỉ đọc).</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4 items-end shrink-0">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Loại hành động</label>
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none min-w-[200px]"
            >
              <option value="ALL">-- Tất cả --</option>
              {uniqueActions.map(action => (
                <option key={action as string} value={action as string}>{action as string}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Ngày thực hiện</label>
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <button 
            onClick={() => { setFilterAction('ALL'); setFilterDate(''); }}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors"
          >
            Xóa Lọc
          </button>
        </div>

        {/* Data Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 shadow-sm z-10">
              <tr className="text-slate-600 text-sm">
                <th className="p-4 font-semibold whitespace-nowrap">Thời gian</th>
                <th className="p-4 font-semibold">Tài khoản</th>
                <th className="p-4 font-semibold">Hành động</th>
                <th className="p-4 font-semibold">Đối tượng</th>
                <th className="p-4 font-semibold">ID Đối tượng</th>
                <th className="p-4 font-semibold">Chi tiết (Payload)</th>
                <th className="p-4 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Đang tải nhật ký...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Không tìm thấy bản ghi nào phù hợp.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="p-4 text-slate-600 whitespace-nowrap">
                      {log.created_at ? format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss') : '-'}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {log.user_email || <span className="text-slate-400 italic">Hệ thống</span>}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2 py-1 rounded bg-blue-50 text-blue-700 font-mono text-xs">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{log.entity_type}</td>
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      {log.entity_id ? log.entity_id.split('-')[0] + '...' : '-'}
                    </td>
                    <td className="p-4 max-w-xs truncate text-slate-500 font-mono text-xs cursor-help" title={JSON.stringify(log.payload)}>
                      {log.payload ? JSON.stringify(log.payload) : '-'}
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-xs">{log.ip_address || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
