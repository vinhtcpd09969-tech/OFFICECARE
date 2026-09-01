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

let cachedTransporter: nodemailer.Transporter | null = null;

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (cachedTransporter) return cachedTransporter;

  if (checkSMTPConfigured()) {
    const isGmail = (process.env.EMAIL_HOST || '').includes('gmail') || (process.env.EMAIL_USER || '').includes('@gmail.com');
    if (isGmail) {
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
        family: 4,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      } as any);
    } else {
      cachedTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
        family: 4,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      } as any);
    }
  } else {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return cachedTransporter;
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

