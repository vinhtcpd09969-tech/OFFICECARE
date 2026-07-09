import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../../../api/axios';

interface Invoice {
  id: string;
  ma_hoa_don: string;
  ten_khach_hang: string;
  so_dien_thoai?: string;
  tong_tien_goc: number;
  hinh_thuc_thanh_toan_goi?: string;
  ti_le_giam_gia_goi?: number;
  so_tien_giam_voucher?: number;
  tong_tien_thanh_toan: number;
  da_thanh_toan: number;
  trang_thai: string;
  ngay_tao: string;
  ten_dich_vu?: string;
  ghi_chu?: string;
  phac_do_dieu_tri_id?: string | null;
  cuoc_hen_id?: string | null;
  loai_goi?: string;
  so_buoi_goi?: number;
  so_buoi_da_dung?: number;
  tong_so_buoi?: number;
  ngay_kham?: string;
  ngay_kham_ket_thuc?: string;
}

interface Payment {
  id: string;
  ma_giao_dich: string;
  hoa_don_id: string;
  ma_hoa_don: string;
  ten_khach_hang: string;
  so_tien: number;
  phuong_thuc: string;
  trang_thai: string;
  thoi_gian_giao_dich: string;
  loai_giao_dich: string;
}

export const useFinanceDashboard = (isCheckoutMode: boolean) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');

  // Fast Payment Sub-Modal inside detailed modal
  const [fastPayInvoice, setFastPayInvoice] = useState<Invoice | null>(null);
  const [fastPayMethod, setFastPayMethod] = useState('tien_mat');
  const [fastPayReceived, setFastPayReceived] = useState('');
  const [fastPayNote, setFastPayNote] = useState('');
  const [fastPayLoading, setFastPayLoading] = useState(false);

  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        axiosInstance.get('/admin/invoices'),
        axiosInstance.get('/admin/payments'),
      ]);
      setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      setPayments(Array.isArray(payRes.data) ? payRes.data : []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tài chính:', error);
      toast.error('Không thể kết nối API tải dữ liệu tài chính.');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckoutMode) {
      fetchDashboardData();
    }
  }, [isCheckoutMode]);

  const handleRefund = async (paymentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn tiền cho giao dịch này?')) return;
    const toastId = toast.loading('Đang thực hiện hoàn tiền...');
    try {
      await axiosInstance.post(`/admin/payments/${paymentId}/refund`, {
        ly_do_hoan_tien: 'Admin requested refund',
      });
      toast.success('Hoàn tiền thành công!', { id: toastId });
      fetchDashboardData();
      if (selectedInvoice) {
        const updatedInvoices = await axiosInstance.get('/admin/invoices');
        const matched = updatedInvoices.data.find((i: any) => i.id === selectedInvoice.id);
        if (matched) setSelectedInvoice(matched);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi hoàn tiền.', { id: toastId });
    }
  };

  const handlePackageRefund = async (
    invoiceId: string,
    usedSessions: number,
    penalty: number,
    reason: string
  ) => {
    const toastId = toast.loading('Đang xử lý hủy gói và hoàn tiền...');
    try {
      await axiosInstance.post(`/admin/invoices/${invoiceId}/refund-package`, {
        so_buoi_dung: usedSessions,
        phi_phat: penalty,
        ly_do: reason
      });
      toast.success('Hủy gói và hoàn tiền thành công!', { id: toastId });
      fetchDashboardData();
      setSelectedInvoice(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi hủy gói hoàn tiền.', { id: toastId });
      throw error;
    }
  };

  const handleFastPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fastPayInvoice) return;
    const requiredAmount = fastPayInvoice.trang_thai === 'da_hoan_tien' || fastPayInvoice.trang_thai === 'da_huy'
      ? 0
      : Number(fastPayInvoice.tong_tien_thanh_toan) - Number(fastPayInvoice.da_thanh_toan);
    const cleanReceived = fastPayReceived.replace(/\D/g, '');
    const entered = Number(cleanReceived);

    if (fastPayMethod === 'tien_mat' && entered < requiredAmount) {
      const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(requiredAmount);
      toast.error(`Số tiền khách đưa không đủ! Tối thiểu cần ${formattedAmount}`);
      return;
    }

    setFastPayLoading(true);
    const toastId = toast.loading('Đang ghi nhận giao dịch thanh toán nhanh...');
    try {
      const res = await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: fastPayInvoice.id,
        so_tien_nhan: fastPayMethod === 'tien_mat' ? cleanReceived : requiredAmount.toString(),
        phuong_thuc: fastPayMethod,
        ghi_chu: fastPayNote || undefined,
      });

      toast.success('Giao dịch thanh toán ghi nhận thành công!', { id: toastId });
      setFastPayInvoice(null);
      setFastPayReceived('');
      setFastPayNote('');
      fetchDashboardData();

      const matched = res.data?.hoa_don;
      if (matched) {
        setSelectedInvoice(matched);
      } else {
        const updated = await axiosInstance.get('/admin/invoices');
        const matchedUpdated = updated.data.find((i: any) => i.id === fastPayInvoice.id);
        if (matchedUpdated) setSelectedInvoice(matchedUpdated);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi ghi nhận thanh toán.', { id: toastId });
    } finally {
      setFastPayLoading(false);
    }
  };

  const getFilteredInvoices = () => {
    return invoices.filter((inv) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        (inv.ma_hoa_don?.toLowerCase() || '').includes(query) ||
        (inv.ten_khach_hang?.toLowerCase() || '').includes(query) ||
        (inv.so_dien_thoai || '').includes(query);
      if (!matchesSearch) return false;

      if (statusFilter !== 'all' && inv.trang_thai !== statusFilter) return false;

      if (dateFilter !== 'all') {
        const date = new Date(inv.ngay_tao);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === 'today') {
          if (date < today) return false;
        } else if (dateFilter === '7days') {
          const limit = new Date(today);
          limit.setDate(limit.getDate() - 7);
          if (date < limit) return false;
        } else if (dateFilter === 'thisMonth') {
          if (date.getMonth() !== today.getMonth() || date.getFullYear() !== today.getFullYear()) return false;
        }
      }

      if (itemTypeFilter !== 'all') {
        const itemType = (inv.ten_dich_vu || '').toLowerCase();
        if (itemTypeFilter === 'goi') {
          if (!itemType.includes('gói') && !inv.hinh_thuc_thanh_toan_goi) return false;
        } else if (itemTypeFilter === 'kham_lam_sang') {
          if (!itemType.includes('khám lâm sàng') && !itemType.includes('khám sơ khởi')) return false;
        } else if (itemTypeFilter === 'buoi_le') {
          if (itemType.includes('khám') || itemType.includes('gói') || inv.hinh_thuc_thanh_toan_goi) return false;
        }
      }

      return true;
    });
  };

  return {
    invoices,
    setInvoices,
    payments,
    setPayments,
    selectedInvoice,
    setSelectedInvoice,
    activeTab,
    setActiveTab,
    dashboardLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    dateFilter,
    setDateFilter,
    itemTypeFilter,
    setItemTypeFilter,
    fastPayInvoice,
    setFastPayInvoice,
    fastPayMethod,
    setFastPayMethod,
    fastPayReceived,
    setFastPayReceived,
    fastPayNote,
    setFastPayNote,
    fastPayLoading,
    fetchDashboardData,
    handleRefund,
    handlePackageRefund,
    handleFastPaySubmit,
    getFilteredInvoices,
  };
};
export type { Invoice, Payment };
