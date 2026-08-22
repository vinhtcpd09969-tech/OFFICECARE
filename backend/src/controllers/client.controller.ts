import { Request, Response } from 'express';
import clientService from '../services/client.service';
import axios from 'axios';

export const getServices = async (req: Request, res: Response): Promise<any> => {
  try {
    const services = await clientService.getPublicServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách dịch vụ' });
  }
};

export const getPackages = async (req: Request, res: Response): Promise<any> => {
  try {
    const packages = await clientService.getPublicPackages();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách gói dịch vụ' });
  }
};

export const getTopServices = async (req: Request, res: Response): Promise<any> => {
  try {
    const topServices = await clientService.getTopServices();
    res.json(topServices);
  } catch (error) {
    console.error('Lỗi khi lấy top dịch vụ:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy top dịch vụ' });
  }
};

export const getSpecialists = async (req: Request, res: Response): Promise<any> => {
  try {
    const specialists = await clientService.getSpecialists();
    res.json(specialists);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách chuyên gia' });
  }
};

export const getSpecialistById = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const specialist = await clientService.getSpecialistById(id);
    if (!specialist) {
      return res.status(404).json({ message: 'Không tìm thấy chuyên gia' });
    }
    res.json(specialist);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin chi tiết chuyên gia' });
  }
};

export const getSpecialistReviews = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const reviews = await clientService.getSpecialistReviews(id);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá của chuyên gia' });
  }
};

export const getServiceReviews = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const reviews = await clientService.getServiceReviews(id);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá của gói dịch vụ' });
  }
};

export const getTestimonials = async (req: Request, res: Response): Promise<any> => {
  try {
    const testimonials = await clientService.getTestimonials();
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy đánh giá' });
  }
};

export const getTreatmentPlans = async (req: Request, res: Response): Promise<any> => {
  try {
    const customerId = (req as any).user?.id;
    if (!customerId) {
      return res.json([]);
    }
    const plans = await clientService.getActiveTreatmentPlans(customerId);
    res.json(plans);
  } catch (error) {
    console.error('Lỗi khi lấy gói liệu trình active của client:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy gói liệu trình' });
  }
};

export const getPendingRatingAppointments = async (req: Request, res: Response): Promise<any> => {
  try {
    const customerId = (req as any).user?.id;
    const appts = await clientService.getPendingRatingAppointments(customerId);
    res.json(appts);
  } catch (error) {
    console.error('Lỗi khi lấy lịch hẹn chưa đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const rateAppointment = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const customerId = (req as any).user.id;
    const result = await clientService.submitAppointmentRating(id, customerId, req.body);
    res.status(200).json(result);
  } catch (error: any) {
    if (error?.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Lỗi khi lưu đánh giá:', error);
    res.status(500).json({ message: 'Lỗi server khi lưu đánh giá' });
  }
};

export const getMyReviews = async (req: Request, res: Response): Promise<any> => {
  try {
    const customerId = (req as any).user.id;
    const reviews = await clientService.getMyReviews(customerId);
    res.json(reviews);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đánh giá của khách hàng:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateServiceReview = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { rating, comment } = req.body;
    const customerId = (req as any).user.id;
    await clientService.updateServiceReview(id, customerId, Number(rating), comment);
    res.json({ message: 'Cập nhật đánh giá dịch vụ thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật đánh giá' });
  }
};

export const updateStaffReview = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { rating, comment } = req.body;
    const customerId = (req as any).user.id;
    await clientService.updateStaffReview(id, customerId, Number(rating), comment);
    res.json({ message: 'Cập nhật đánh giá nhân sự thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật đánh giá' });
  }
};

export const agreeTerms = async (req: Request, res: Response): Promise<any> => {
  try {
    const customerId = (req as any).user.id;
    await clientService.agreeTerms(customerId);
    res.json({ success: true, message: 'Đồng ý điều khoản thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đồng ý điều khoản' });
  }
};

export const getTtsProxy = async (req: Request, res: Response): Promise<any> => {
  const text = req.query.text as string;
  if (!text) {
    return res.status(400).send('Missing text parameter');
  }

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;
    const response = await axios({
      method: 'get',
      url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
      }
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (error: any) {
    console.error('TTS proxy error:', error.message);
    res.status(500).send('Error generating TTS');
  }
};

export const getActiveVouchers = async (req: Request, res: Response): Promise<any> => {
  try {
    const vouchers = await clientService.getActiveVouchers();
    res.json({ vouchers });
  } catch (error: any) {
    console.error('Lỗi lấy danh sách voucher client:', error);
    res.status(500).json({ message: 'Lỗi server', error: error?.message });
  }
};

export const createPayosPaymentLink = async (req: Request, res: Response): Promise<any> => {
  try {
    const { amount, phone, description } = req.body;
    const linkRes = await clientService.createPayOSPaymentLink(amount, phone, description);
    res.json(linkRes);
  } catch (error: any) {
    if (error?.status) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error('Lỗi khi tạo PayOS link client:', error);
    res.status(500).json({ message: error.message || 'Lỗi server khi tạo PayOS QR' });
  }
};

export const getPayosPaymentStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const orderCode = req.params.orderCode as string;
    if (!orderCode) {
      return res.status(400).json({ message: 'Thiếu orderCode' });
    }
    const statusRes = await clientService.checkPayOSPaymentStatus(orderCode);
    res.json(statusRes);
  } catch (error: any) {
    console.error('Lỗi kiểm tra trạng thái PayOS orderCode:', error?.message);
    res.json({ status: 'PENDING', paid: false });
  }
};
