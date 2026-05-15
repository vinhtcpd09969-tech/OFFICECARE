import React, { useState, useEffect } from 'react';
import { getCustomers } from '../../api/admin.api';
import { format } from 'date-fns';

export default function ManageCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomers();
      setCustomers(res.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản lý Khách hàng</h2>
          <p className="text-slate-500 mt-1">Danh sách toàn bộ khách hàng và lịch sử tài khoản.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Mã KH</th>
                <th className="p-4 font-semibold">Họ Tên</th>
                <th className="p-4 font-semibold">Số điện thoại</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold text-center">Giới tính</th>
                <th className="p-4 font-semibold text-center">Ngày tạo</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Chưa có khách hàng nào.</td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.khach_hang_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{cust.ma_khach_hang || '-'}</td>
                    <td className="p-4 font-medium text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                          {cust.ho_ten ? cust.ho_ten.charAt(0) : '?'}
                        </div>
                        {cust.ho_ten}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-sm">{cust.so_dien_thoai || '-'}</td>
                    <td className="p-4 text-slate-600 text-sm">{cust.email || '-'}</td>
                    <td className="p-4 text-center text-slate-600 text-sm">
                      {cust.gioi_tinh === 'nam' ? 'Nam' : cust.gioi_tinh === 'nu' ? 'Nữ' : 'Khác'}
                    </td>
                    <td className="p-4 text-center text-slate-600 text-sm">
                      {cust.created_at ? format(new Date(cust.created_at), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-teal-600 hover:text-teal-800 text-sm font-medium mr-3">Chi tiết</button>
                      <button className="text-amber-600 hover:text-amber-800 text-sm font-medium">Reset Pass</button>
                    </td>
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
