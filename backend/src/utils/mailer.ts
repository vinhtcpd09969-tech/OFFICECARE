import 'dotenv/config';
import nodemailer from 'nodemailer';
import {
  PaymentReceiptEmailParams,
  BookingSuccessEmailParams,
  renderOtpEmail,
  renderForgotPasswordEmail,
  renderBookingConfirmationEmail,
  renderBookingSuccessEmail,
  renderAppointmentReminderEmail,
  renderAccountLockedEmail,
  renderPaymentReceiptEmail,
  renderAdminSecurityOtpEmail,
} from '../templates/emails/emailTemplates';

export { PaymentReceiptEmailParams, BookingSuccessEmailParams };

const checkSMTPConfigured = () => Boolean(
  process.env.EMAIL_USER && 
  process.env.EMAIL_USER !== 'your_email@gmail.com' && 
  process.env.EMAIL_PASS && 
  process.env.EMAIL_PASS !== 'your_app_password'
);

import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

const customIpv4Lookup = (hostname: string, _options: any, callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
  dns.lookup(hostname, { family: 4, all: false }, callback);
};

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (checkSMTPConfigured()) {
    const user = (process.env.EMAIL_USER || '').trim();
    const pass = (process.env.EMAIL_PASS || '').trim();
    const host = (process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const port = parseInt(process.env.EMAIL_PORT || '465', 10);
    const isGmail = host.includes('gmail') || user.includes('@gmail.com');

    if (isGmail) {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        family: 4,
        lookup: customIpv4Lookup,
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
      } as any);
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      family: 4,
      lookup: customIpv4Lookup,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    } as any);
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const getFromAddress = (senderName = 'OfficeCare Clinic', customEmail?: string) => {
  return checkSMTPConfigured()
    ? `"${senderName}" <${customEmail || process.env.EMAIL_USER}>`
    : `"${senderName}" <noreply@officareclinic.com>`;
};

export const sendOTP = async (toEmail: string, otpCode: string, userName: string) => {
  try {
    const transporter = await getTransporter();
    const htmlContent = renderOtpEmail(userName, otpCode);

    const info = await transporter.sendMail({
      from: getFromAddress('OffiCare'),
      to: toEmail,
      subject: 'Mã xác thực OTP đăng ký tài khoản OffiCare',
      html: htmlContent,
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP CỦA BẠN LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP tới: %s', toEmail);
    if (!checkSMTPConfigured()) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};

export const sendForgotPasswordOTP = async (toEmail: string, otpCode: string, userName: string) => {
  try {
    const transporter = await getTransporter();
    const htmlContent = renderForgotPasswordEmail(userName, otpCode);

    const info = await transporter.sendMail({
      from: getFromAddress('OffiCare'),
      to: toEmail,
      subject: 'Mã xác thực khôi phục mật khẩu OffiCare',
      html: htmlContent,
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP QUÊN MẬT KHẨU CỦA BẠN LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP khôi phục tới: %s', toEmail);
    if (!checkSMTPConfigured()) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};

export const sendBookingConfirmationOTP = async (
  toEmail: string,
  userName: string,
  otpCode: string,
  dateStr: string,
  timeStr: string,
  serviceName: string
) => {
  try {
    const transporter = await getTransporter();
    const htmlContent = renderBookingConfirmationEmail({ userName, otpCode, dateStr, timeStr, serviceName });

    const info = await transporter.sendMail({
      from: getFromAddress('OffiCare Clinic'),
      to: toEmail,
      subject: 'Mã OTP xác nhận lịch hẹn tại OffiCare Clinic',
      html: htmlContent,
    });

    console.log('----------------------------------------------------');
    console.log('🔑 MÃ OTP LỊCH HẸN CỦA BẠN LÀ: %s', otpCode);
    console.log('✅ Đã gửi Email OTP xác thực lịch hẹn tới: %s', toEmail);
    if (!checkSMTPConfigured()) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP xác thực lịch hẹn:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};

export const sendAppointmentReminder = async (
  toEmail: string,
  userName: string,
  appointmentDetails: {
    tenGoi: string;
    thoiGian: string;
    tenPhong: string;
  }
) => {
  try {
    const transporter = await getTransporter();
    const htmlContent = renderAppointmentReminderEmail(userName, appointmentDetails);

    const info = await transporter.sendMail({
      from: getFromAddress('OfficeCare Clinic'),
      to: toEmail,
      subject: `[Nhắc Lịch Hẹn] Lịch hẹn trị liệu tại OfficeCare`,
      html: htmlContent,
    });

    console.log('----------------------------------------------------');
    console.log('✅ Đã gửi Email Nhắc hẹn tới: %s', toEmail);
    if (!checkSMTPConfigured()) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email nhắc hẹn:', error);
  }
};

export const sendAccountLockedNotification = async (toEmail: string, userName: string) => {
  try {
    const transporter = await getTransporter();
    const htmlContent = renderAccountLockedEmail(userName);

    const info = await transporter.sendMail({
      from: getFromAddress('OfficeCare Clinic'),
      to: toEmail,
      subject: `[Thông báo quan trọng] Tài khoản của bạn tại OfficeCare đã bị khóa`,
      html: htmlContent,
    });

    console.log('----------------------------------------------------');
    console.log('🔒 Đã gửi Email Thông báo Khóa tài khoản tới: %s', toEmail);
    if (!checkSMTPConfigured()) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email thông báo khóa tài khoản:', error);
  }
};

export const sendPaymentReceiptEmail = async (params: PaymentReceiptEmailParams) => {
  try {
    const { toEmail, maHoaDon } = params;

    if (!toEmail || !toEmail.includes('@')) {
      console.log('⚠️ Không có địa chỉ email hợp lệ để gửi biên nhận thanh toán:', toEmail);
      return;
    }

    const transporter = await getTransporter();
    const htmlContent = renderPaymentReceiptEmail(params);

    const info = await transporter.sendMail({
      from: getFromAddress('OfficeCare Clinic'),
      to: toEmail,
      subject: `[OfficeCare] Biên lai xác nhận thanh toán thành công - Hóa đơn #${maHoaDon}`,
      html: htmlContent,
    });

    console.log('----------------------------------------------------');
    console.log('✅ Đã gửi Email Biên lai Thanh toán tới: %s (Hóa đơn: %s)', toEmail, maHoaDon);
    if (!checkSMTPConfigured()) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email biên lai thanh toán:', error);
  }
};

export const sendAdminSecurityOTP = async (
  toEmail: string,
  otpCode: string,
  actionTitle: string,
  userName: string
) => {
  try {
    const transporter = await getTransporter();
    const htmlContent = renderAdminSecurityOtpEmail(userName, otpCode, actionTitle);

    const info = await transporter.sendMail({
      from: getFromAddress('OfficeCare Security', 'security@officecare.vn'),
      to: toEmail,
      subject: `[OfficeCare Security] Mã OTP xác thực: ${actionTitle}`,
      html: htmlContent,
    });

    console.log('----------------------------------------------------');
    console.log('🛡️ Đã gửi OTP Bảo mật Admin tới: %s (Hành động: %s)', toEmail, actionTitle);
    if (!checkSMTPConfigured()) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP bảo mật Admin:', error);
  }
};

export const sendBookingSuccessEmail = async (toEmail: string, params: BookingSuccessEmailParams) => {
  try {
    if (!toEmail || !toEmail.includes('@') || toEmail.endsWith('@officecare.placeholder')) {
      console.log('⚠️ Không có địa chỉ email hợp lệ để gửi thông báo đặt lịch:', toEmail);
      return;
    }

    const transporter = await getTransporter();
    const htmlContent = renderBookingSuccessEmail(params);

    const info = await transporter.sendMail({
      from: getFromAddress('OfficeCare Clinic'),
      to: toEmail,
      subject: `[OfficeCare] Xác nhận đặt lịch hẹn thành công - Mã #${params.maLichDat}`,
      html: htmlContent,
    });

    console.log('----------------------------------------------------');
    console.log('✅ Đã gửi Email Xác nhận Đặt lịch tới: %s (Mã LH: #%s)', toEmail, params.maLichDat);
    if (!checkSMTPConfigured()) {
      console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    }
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email xác nhận đặt lịch hẹn:', error);
  }
};

