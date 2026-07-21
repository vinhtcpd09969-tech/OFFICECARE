import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { updateCustomer, toggleCustomerLock } from '../../../api/admin.api';

export interface CustomerEditForm {
  ho_ten: string;
  so_dien_thoai: string;
  email: string;
  gioi_tinh: string;
  dia_chi: string;
  ngay_sinh: string;
  diem_uy_tin: number;
}

const EMPTY_FORM: CustomerEditForm = {
  ho_ten: '', so_dien_thoai: '', email: '', gioi_tinh: 'khac', dia_chi: '', ngay_sinh: '', diem_uy_tin: 100
};

// Sửa thông tin hành chính + khóa/mở khóa tài khoản — dùng ConfirmDialog thay window.confirm cho
// đúng convention xác nhận của codebase.
export function useCustomerActions(onChanged: () => void) {
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomerEditForm>(EMPTY_FORM);
  const [lockTarget, setLockTarget] = useState<{ id: string; ho_ten: string; isLocked: boolean } | null>(null);

  const startEdit = (customer: any) => {
    setEditingCustomerId(customer.id);
    setEditForm({
      ho_ten: customer.ho_ten || '',
      so_dien_thoai: customer.so_dien_thoai || '',
      email: customer.email || '',
      gioi_tinh: customer.gioi_tinh || 'khac',
      dia_chi: customer.dia_chi || '',
      ngay_sinh: customer.ngay_sinh ? format(new Date(customer.ngay_sinh), 'yyyy-MM-dd') : '',
      // Cap 0-100 theo thang badge uy tín mới — không còn cho nhập tới 500 như bản cũ.
      diem_uy_tin: Math.min(100, customer.diem_uy_tin || 0)
    });
  };

  const cancelEdit = () => setEditingCustomerId(null);

  const saveProfile = async () => {
    if (!editingCustomerId) return;
    try {
      const payload = { ...editForm, diem_uy_tin: Math.max(0, Math.min(100, editForm.diem_uy_tin)) };
      await updateCustomer(editingCustomerId, payload);
      toast.success('Đã cập nhật thông tin khách hàng thành công!');
      setEditingCustomerId(null);
      onChanged();
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Có lỗi xảy ra khi lưu thông tin khách hàng.');
    }
  };

  const requestToggleLock = (customer: any) => {
    setLockTarget({ id: customer.id, ho_ten: customer.ho_ten, isLocked: customer.trang_thai !== 'vo_hieu' });
  };
  const cancelToggleLock = () => setLockTarget(null);

  const confirmToggleLock = async () => {
    if (!lockTarget) return;
    try {
      await toggleCustomerLock(lockTarget.id, lockTarget.isLocked);
      toast.success(lockTarget.isLocked ? 'Đã khóa tài khoản khách hàng thành công' : 'Đã mở khóa tài khoản khách hàng thành công');
      setLockTarget(null);
      onChanged();
    } catch (error: any) {
      console.error('Failed to toggle customer lock:', error);
      setLockTarget(null);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác.', {
        style: {
          background: '#E11D48',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: '13px',
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: '0 20px 25px -5px rgba(225, 29, 72, 0.3)'
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#E11D48',
        },
        duration: 6000,
      });
    }
  };

  return {
    editingCustomerId, editForm, setEditForm, startEdit, cancelEdit, saveProfile,
    lockTarget, requestToggleLock, cancelToggleLock, confirmToggleLock
  };
}
