import { useEffect, useState, useReducer, useRef } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../../../../api/axios';

interface CheckoutState {
  lichDatId: string;
  soTienNhan: string;
  phuongThuc: string;
  hoaDon: any | null;
  loading: boolean;
}

type CheckoutAction =
  | { type: 'SET_FIELD'; field: keyof CheckoutState; value: any }
  | { type: 'SET_HOA_DON'; hoaDon: any }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'RESET_HOA_DON' };

const checkoutReducer = (state: CheckoutState, action: CheckoutAction): CheckoutState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_HOA_DON':
      return { ...state, hoaDon: action.hoaDon };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'RESET_HOA_DON':
      return { ...state, hoaDon: null, soTienNhan: '', phuongThuc: 'tien_mat' };
    default:
      return state;
  }
};

export const useCheckout = (
  queryLichDatId: string | null,
  isCheckoutMode: boolean,
  queryCustomerId?: string | null,
  queryGoiDichVuId?: string | null
) => {
  const loadedConsultationIdRef = useRef<string | null>(null);
  const lastCalcParamsRef = useRef<string>('');

  const [state, dispatch] = useReducer(checkoutReducer, {
    lichDatId: queryLichDatId || '',
    soTienNhan: '',
    phuongThuc: 'tien_mat',
    hoaDon: null,
    loading: false,
  });

  const [packages, setPackages] = useState<any[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [loaiThanhToan, setLoaiThanhToan] = useState<'tra_thang' | 'tra_gop' | 'tung_buoi'>('tra_thang');
  const [dangKyGoi, setDangKyGoi] = useState<boolean>(true);
  
  useEffect(() => {
    if (selectedPackage?.loai_goi === 'LE') {
      setLoaiThanhToan('tra_thang');
    }
  }, [selectedPackage]);
  const [maVoucher, setMaVoucher] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any | null>(null);
  const [calculatedData, setCalculatedData] = useState<any | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [feedbackLyDo, setFeedbackLyDo] = useState('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<any | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'single' | 'package'>('package');
  const [durationDays, setDurationDays] = useState<number>(60);

  // Load checkout details
  useEffect(() => {
    if (!isCheckoutMode) return;

    const loadCheckoutInfo = async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      try {
        const pkgRes = await axiosInstance.get('/receptionist/packages');
        const pkgs = Array.isArray(pkgRes.data) ? pkgRes.data : [];
        setPackages(pkgs);

        let appt;
        if (queryLichDatId) {
          const billInfoRes = await axiosInstance.get(`/receptionist/appointments/${queryLichDatId}/billing-info`);
          appt = billInfoRes.data;
        } else if (queryCustomerId && queryGoiDichVuId) {
          const billInfoRes = await axiosInstance.get(`/receptionist/customers/${queryCustomerId}/billing-info-by-package?package_id=${queryGoiDichVuId}`);
          appt = billInfoRes.data;
        } else {
          throw new Error('Thiếu thông tin thanh toán');
        }

        setSelectedConsultation(appt);

        if (appt.loai_lich === 'dieu_tri' && appt.hoa_don_goi_id) {
          let sessionPrice = 0;
          const hinhThuc = appt.hinh_thuc_thanh_toan_goi;
          const alreadyPaid = Number(appt.so_tien_da_tra_goi || 0);
          const totalRequired = Number(appt.tong_tien_phai_tra_goi || 0);
          const soThuTu = Number(appt.so_thu_tu_buoi || 1);
          const totalSessions = Number(appt.pd_tong_so_buoi || 10);
 
          if (hinhThuc === 'tra_thang') {
            sessionPrice = 0;
          } else if (hinhThuc === 'tra_gop') {
            if (alreadyPaid >= totalRequired) {
              sessionPrice = 0;
            } else if (soThuTu === Math.floor(totalSessions / 2)) {
              sessionPrice = totalRequired - alreadyPaid;
            } else {
              sessionPrice = 0;
            }
          } else if (hinhThuc === 'tung_buoi') {
            sessionPrice = Number(appt.pd_don_gia_theo_buoi || Math.round(totalRequired / totalSessions));
          } else {
            const totalPackageCost = totalRequired - Number(appt.don_gia_dich_vu || 200000);
            sessionPrice = Math.round(totalPackageCost / totalSessions);
          }
 
          const mockHoaDon = {
            id: appt.hoa_don_goi_id,
            ma_hoa_don: appt.hoa_don_goi_ma,
            khach_hang_id: appt.khach_hang_id,
            loai_hoa_don: 'dich_vu_don',
            tong_tien_truoc_giam: sessionPrice,
            tong_tien_thanh_toan: sessionPrice,
            so_tien_da_tra: appt.so_tien_da_tra_goi,
            trang_thai: appt.trang_thai_hoa_don_goi,
            ten_item: `Buổi trị liệu số ${appt.so_thu_tu_buoi} (${appt.pd_ten_goi})`,
            so_buoi_goi: 1,
            ho_ten_khach: appt.ten_khach_hang,
            so_dien_thoai: appt.sdt_khach_hang,
          };
          dispatch({ type: 'SET_HOA_DON', hoaDon: mockHoaDon });
          setCheckoutTab('single');
          setDangKyGoi(false);
        } else {
          // If loai_lich is exam/consultation, OR loai_lich === 'dieu_tri' but no package invoice (retail service session)
          const targetGoiId = appt.khuyen_nghi_goi_id || appt.goi_dich_vu_id;
          if (targetGoiId) {
            const matchedPkg = pkgs.find((p: any) => String(p.id) === String(targetGoiId));
            if (matchedPkg) {
              setSelectedPackage(matchedPkg);
              if (matchedPkg.loai_goi === 'LIEU_TRINH' || matchedPkg.loai_goi === 'LE') {
                setCheckoutTab('package');
                setDangKyGoi(true);
              } else {
                setCheckoutTab('single');
                setDangKyGoi(false);
              }
            }
          } else {
            setCheckoutTab('single');
            setDangKyGoi(false);
          }
        }
      } catch (err) {
        toast.error('Không tìm thấy ca điều trị cần thanh toán hoặc ca đã được thanh toán rồi!');
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    };

    loadCheckoutInfo();
  }, [queryLichDatId, isCheckoutMode, queryCustomerId, queryGoiDichVuId]);

  // Load single invoice automatically
  useEffect(() => {
    if (
      !isCheckoutMode ||
      !selectedConsultation ||
      state.hoaDon ||
      state.loading ||
      (selectedConsultation.loai_lich === 'dieu_tri' && selectedConsultation.hoa_don_goi_id)
    )
      return;

    if (checkoutTab === 'single') {
      if (loadedConsultationIdRef.current === selectedConsultation.id) return;
      loadedConsultationIdRef.current = selectedConsultation.id;

      const autoLoadSingleInvoice = async () => {
        dispatch({ type: 'SET_LOADING', loading: true });
        const toastId = toast.loading('Đang tải thông tin hóa đơn...');
        try {
          const res = await axiosInstance.post('/receptionist/billing', {
            lich_dat_id: selectedConsultation.id,
          });
          dispatch({ type: 'SET_HOA_DON', hoaDon: res.data.hoa_don });
          if (res.data.hoa_don.isNew) {
            toast.success('Đã lập hóa đơn thành công!', { id: toastId });
          } else {
            toast.dismiss(toastId);
          }
        } catch (error: any) {
          loadedConsultationIdRef.current = null; // reset on error to allow retry
          toast.error(error.response?.data?.message || 'Lỗi lập hóa đơn', { id: toastId });
        } finally {
          dispatch({ type: 'SET_LOADING', loading: false });
        }
      };
      autoLoadSingleInvoice();
    }
  }, [checkoutTab, selectedConsultation, isCheckoutMode]);

  // Fetch package calculations
  useEffect(() => {
    if (!isCheckoutMode || checkoutTab !== 'package' || !selectedConsultation) return;

    const currentParams = JSON.stringify({
      checkoutTab,
      goi_id: selectedPackage?.id || null,
      loaiThanhToan,
      ma_voucher: appliedVoucher?.ma_voucher || null,
      dangKyGoi,
      consultationId: selectedConsultation?.id || null
    });

    if (lastCalcParamsRef.current === currentParams) return;
    lastCalcParamsRef.current = currentParams;

    if (dangKyGoi && selectedPackage) {
      const calculatePackage = async () => {
        setCalculating(true);
        try {
          const res = await axiosInstance.post('/receptionist/billing/calculate', {
            goi_id: selectedPackage.id,
            loai_thanh_toan: loaiThanhToan,
            ma_voucher: appliedVoucher ? appliedVoucher.ma_voucher : null,
            khach_hang_id: selectedConsultation.khach_hang_id,
            lich_dat_id: selectedConsultation.id,
          });
          setCalculatedData(res.data);
        } catch (error: any) {
          lastCalcParamsRef.current = ''; // reset on error to allow retry
          toast.error(error.response?.data?.message || 'Lỗi tính giá gói điều trị');
        } finally {
          setCalculating(false);
        }
      };
      calculatePackage();
    } else {
      const calculateExamOnly = async () => {
        setCalculating(true);
        try {
          const res = await axiosInstance.post('/receptionist/billing/calculate', {
            goi_id: null,
            loai_thanh_toan: 'tra_thang',
            ma_voucher: null,
            khach_hang_id: selectedConsultation.khach_hang_id,
            lich_dat_id: selectedConsultation.id,
          });
          setCalculatedData(res.data);
        } catch (error) {
          lastCalcParamsRef.current = ''; // reset on error to allow retry
          console.error(error);
        } finally {
          setCalculating(false);
        }
      };
      calculateExamOnly();
    }
  }, [
    checkoutTab,
    selectedPackage,
    loaiThanhToan,
    appliedVoucher,
    dangKyGoi,
    selectedConsultation,
    isCheckoutMode,
  ]);

  const handleApplyVoucher = async () => {
    if (!maVoucher.trim() || !selectedConsultation) return;
    const toastId = toast.loading('Đang áp dụng voucher...');
    try {
      const res = await axiosInstance.post('/receptionist/vouchers/apply', {
        ma_voucher: maVoucher,
        khach_hang_id: selectedConsultation.khach_hang_id,
      });
      setAppliedVoucher(res.data.voucher);
      toast.success('Đã áp dụng voucher thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi áp dụng voucher', { id: toastId });
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setMaVoucher('');
  };

  const handleThanhToanSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.hoaDon) return;

    const totalAmount = Number(state.hoaDon.tong_tien_thanh_toan);
    const cleanReceived = state.soTienNhan.replace(/\D/g, '');
    const receivedAmount = Number(cleanReceived);
    if (state.phuongThuc === 'tien_mat' && receivedAmount < totalAmount) {
      toast.error('Số tiền nhận của khách hàng chưa đủ để thanh toán!');
      return;
    }

    const toastId = toast.loading('Đang ghi nhận giao dịch thanh toán...');
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const res = await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: state.hoaDon.id,
        so_tien_nhan: state.phuongThuc === 'tien_mat' ? cleanReceived : totalAmount.toString(),
        phuong_thuc: state.phuongThuc,
        ghi_chu: feedbackLyDo || undefined,
      });

      const matchedPkg = selectedConsultation?.khuyen_nghi_goi_id
        ? packages.find((p) => String(p.id) === String(selectedConsultation.khuyen_nghi_goi_id))
        : null;

      const nextSessionNum = selectedConsultation?.loai_lich === 'dieu_tri' && selectedConsultation?.hinh_thuc_thanh_toan_goi === 'tung_buoi'
        ? Number(selectedConsultation.so_thu_tu_buoi || 1) + 1
        : null;
      const totalSessions = selectedConsultation?.pd_tong_so_buoi ? Number(selectedConsultation.pd_tong_so_buoi) : 10;
      const isTungBuoi = selectedConsultation?.loai_lich === 'dieu_tri' && selectedConsultation?.hinh_thuc_thanh_toan_goi === 'tung_buoi';

      setPaymentSuccessData({
        hoaDon: res.data?.hoa_don || state.hoaDon,
        khachHangId: selectedConsultation?.khach_hang_id,
        tenKhachHang: selectedConsultation?.ten_khach_hang,
        khuyenNghiGoiId: selectedConsultation?.khuyen_nghi_goi_id,
        khuyenNghiTenGoi: matchedPkg ? matchedPkg.ten_goi : null,
        khuyenNghiLoaiGoi: selectedConsultation?.khuyen_nghi_loai_goi,
        daDangKyGoiId: isTungBuoi ? selectedConsultation?.pd_goi_dich_vu_id : null,
        daDangKyGoiTen: isTungBuoi ? selectedConsultation?.pd_ten_goi : null,
        daDangKyGoiLoai: isTungBuoi ? 'LIEU_TRINH' : null,
        nextSessionNum: isTungBuoi && nextSessionNum && nextSessionNum <= totalSessions ? nextSessionNum : null,
        totalSessions: isTungBuoi ? totalSessions : null,
      });

      toast.success('Giao dịch thanh toán y khoa đã hoàn tất thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi ghi nhận thanh toán.', { id: toastId });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const handleThanhToanPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConsultation) return;
    if (dangKyGoi && !selectedPackage) {
      toast.error('Vui lòng chọn gói trị liệu chỉ định!');
      return;
    }
    if (!calculatedData) return;

    const tongCanThu = loaiThanhToan === 'tra_gop' || loaiThanhToan === 'tung_buoi'
      ? Number(calculatedData.so_tien_dot_1)
      : Number(calculatedData.tong_tien_thanh_toan);
    const cleanReceived = state.soTienNhan.replace(/\D/g, '');
    const receivedAmount = tongCanThu === 0 ? 0 : Number(cleanReceived);

    if (state.phuongThuc === 'tien_mat' && receivedAmount < tongCanThu) {
      const formattedValue = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tongCanThu);
      toast.error(`Số tiền nhận chưa đủ! Yêu cầu tối thiểu ${formattedValue}`);
      return;
    }

    const toastId = toast.loading('Đang lập hóa đơn & xử lý thanh toán...');
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const invoiceRes = await axiosInstance.post('/receptionist/billing/create', {
        khach_hang_id: selectedConsultation.khach_hang_id,
        item_type: dangKyGoi ? 'goi' : 'dich_vu',
        item_id: dangKyGoi ? selectedPackage.id : selectedConsultation.goi_dich_vu_id || selectedConsultation.id,
        loai_thanh_toan: dangKyGoi ? loaiThanhToan : 'tra_thang',
        ma_voucher: dangKyGoi && appliedVoucher ? appliedVoucher.ma_voucher : null,
        lich_dat_id: selectedConsultation.id,
        lich_dieu_tri_id: selectedConsultation.phac_do_dieu_tri_id || null,
        ho_ten_khach: selectedConsultation.ten_khach_hang,
        so_dien_thoai: selectedConsultation.sdt_khach_hang,
        dang_ky_goi: dangKyGoi,
        so_ngay_hieu_luc: (dangKyGoi && ['tra_thang', 'tra_gop'].includes(loaiThanhToan)) ? durationDays : null,
      });

      const hoaDonMoi = invoiceRes.data.hoa_don;

      await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: hoaDonMoi.id,
        so_tien_nhan: state.phuongThuc === 'tien_mat' ? (tongCanThu === 0 ? '0' : cleanReceived) : tongCanThu.toString(),
        phuong_thuc: state.phuongThuc,
      });

      const totalSessions = Number(selectedConsultation?.pd_tong_so_buoi || selectedPackage?.tong_so_buoi || 10);
      const nextSessionNum = selectedConsultation?.loai_lich === 'dieu_tri' 
        ? Number(selectedConsultation.so_thu_tu_buoi || 1) + 1
        : (dangKyGoi ? 1 : null);

      setPaymentSuccessData({
        hoaDon: hoaDonMoi,
        khachHangId: selectedConsultation.khach_hang_id,
        tenKhachHang: selectedConsultation.ten_khach_hang,
        khuyenNghiGoiId: null,
        khuyenNghiTenGoi: null,
        khuyenNghiLoaiGoi: null,
        daDangKyGoiId: selectedConsultation?.pd_goi_dich_vu_id || selectedPackage?.id || selectedPackage?.goi_dich_vu_id || hoaDonMoi.goi_dich_vu_id,
        daDangKyGoiTen: selectedConsultation?.pd_ten_goi || selectedPackage?.ten_goi || hoaDonMoi.ten_item,
        daDangKyGoiLoai: selectedPackage?.loai_goi || null,
        nextSessionNum: nextSessionNum && nextSessionNum <= totalSessions ? nextSessionNum : null,
        totalSessions,
      });

      toast.success(
        dangKyGoi
          ? (selectedPackage?.loai_goi === 'LE' ? 'Đăng ký & Thanh toán dịch vụ thành công!' : 'Đăng ký & Thanh toán gói trị liệu thành công!')
          : 'Đã lập hóa đơn & thanh toán phí khám thành công!',
        { id: toastId }
      );
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi xử lý thanh toán gói', { id: toastId });
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  return {
    state,
    dispatch,
    packages,
    selectedConsultation,
    selectedPackage,
    setSelectedPackage,
    loaiThanhToan,
    setLoaiThanhToan,
    dangKyGoi,
    setDangKyGoi,
    maVoucher,
    setMaVoucher,
    appliedVoucher,
    calculatedData,
    calculating,
    feedbackLyDo,
    setFeedbackLyDo,
    paymentSuccessData,
    setPaymentSuccessData,
    checkoutTab,
    setCheckoutTab,
    durationDays,
    setDurationDays,
    handleApplyVoucher,
    handleRemoveVoucher,
    handleThanhToanSingle,
    handleThanhToanPackage,
  };
};
