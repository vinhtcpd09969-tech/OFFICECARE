import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';

interface Invoice {
  id: string;
  ma_hoa_don: string;
  ten_khach_hang: string;
  tong_tien_thanh_toan: number;
  da_thanh_toan: number;
  trang_thai: string;
  ngay_tao: string;
}

interface Payment {
  id: string;
  ma_giao_dich: string;
  ma_hoa_don: string;
  ten_khach_hang: string;
  so_tien: number;
  phuong_thuc: string;
  trang_thai: string;
  thoi_gian_giao_dich: string;
}

export default function ManageFinance() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, payRes] = await Promise.all([
        axios.get('/api/admin/invoices'),
        axios.get('/api/admin/payments')
      ]);
      setInvoices(invRes.data);
      setPayments(payRes.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tài chính:', error);
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn tiền cho giao dịch này?')) return;
    try {
      await axios.post(`/api/admin/payments/${paymentId}/refund`, { ly_do_hoan_tien: 'Admin refund' });
      alert('Hoàn tiền thành công');
      fetchData();
    } catch (error) {
      alert('Lỗi khi hoàn tiền');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      da_thanh_toan: 'bg-emerald-500/10 text-emerald-500',
      thanh_cong: 'bg-emerald-500/10 text-emerald-500',
      chua_thanh_toan: 'bg-amber-500/10 text-amber-500',
      da_hoan_tien: 'bg-rose-500/10 text-rose-500',
      cho_xu_ly: 'bg-slate-500/10 text-slate-500',
    };
    return badges[status] || 'bg-slate-500/10 text-slate-500';
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.ma_hoa_don?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.ten_khach_hang?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPayments = payments.filter(pay =>
    pay.ma_giao_dich?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pay.ten_khach_hang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pay.ma_hoa_don?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Tài chính</h1>
          <p className="text-slate-500">Theo dõi dòng tiền, hóa đơn và giao dịch hoàn tiền.</p>
        </div>
        <div className="relative w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã HĐ, mã GD, hoặc tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'invoices' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Hóa đơn
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'payments' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          Giao dịch thanh toán
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Tổng doanh thu</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">
            {formatCurrency(invoices.reduce((acc, inv) => acc + Number(inv.da_thanh_toan), 0))}
          </h3>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Đang chờ thanh toán</p>
          <h3 className="text-2xl font-bold text-amber-500 mt-1">
            {formatCurrency(invoices.reduce((acc, inv) => acc + (inv.trang_thai === 'chua_thanh_toan' ? Number(inv.tong_tien_thanh_toan) : 0), 0))}
          </h3>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500">Đã hoàn tiền</p>
          <h3 className="text-2xl font-bold text-rose-500 mt-1">
            {formatCurrency(payments.filter(p => p.trang_thai === 'da_hoan_tien').reduce((acc, p) => acc + Number(p.so_tien), 0))}
          </h3>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'invoices' ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Mã hóa đơn</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Đã trả</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Ngày tạo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{inv.ma_hoa_don}</td>
                  <td className="px-6 py-4 text-slate-600">{inv.ten_khach_hang}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(inv.tong_tien_thanh_toan)}</td>
                  <td className="px-6 py-4 text-slate-600">{formatCurrency(inv.da_thanh_toan)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(inv.trang_thai)}`}>
                      {inv.trang_thai}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{new Date(inv.ngay_tao).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Mã GD</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Hóa đơn</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Khách hàng</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Số tiền</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Phương thức</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{pay.ma_giao_dich}</td>
                  <td className="px-6 py-4 text-slate-600">{pay.ma_hoa_don}</td>
                  <td className="px-6 py-4 text-slate-600">{pay.ten_khach_hang}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(pay.so_tien)}</td>
                  <td className="px-6 py-4 text-slate-600">{pay.phuong_thuc}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(pay.trang_thai)}`}>
                      {pay.trang_thai}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {pay.trang_thai === 'thanh_cong' && (
                      <button
                        onClick={() => handleRefund(pay.id)}
                        className="text-xs font-medium text-rose-500 hover:text-rose-600 underline"
                      >
                        Hoàn tiền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
