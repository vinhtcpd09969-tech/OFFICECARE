import nodemailer from 'nodemailer';

// Khởi tạo Transporter.
// Ở môi trường Dev, chúng ta dùng Ethereal Email để tạo test account on-the-fly.
export const sendOTP = async (toEmail: string, otpCode: string, userName: string) => {
  try {
    // 1. Tạo một tài khoản test giả lập (chỉ chạy 1 lần tự lưu trong bộ nhớ)
    const testAccount = await nodemailer.createTestAccount();

    // 2. Tạo transporter kết nối tới Ethereal
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });

    // 3. Nội dung Email (HTML)
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0F172A; text-align: center;">Xác thực tài khoản PhysioFlow</h2>
        <p style="color: #475569; font-size: 16px;">Chào <strong>${userName}</strong>,</p>
        <p style="color: #475569; font-size: 16px;">Cảm ơn bạn đã đăng ký tài khoản tại PhysioFlow. Để hoàn tất đăng ký, vui lòng sử dụng mã OTP dưới đây:</p>
        
        <div style="background-color: #f1f5f9; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2EC4B6;">${otpCode}</span>
        </div>
        
        <p style="color: #475569; font-size: 14px;">Mã OTP này sẽ hết hạn trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 PhysioFlow. All rights reserved.</p>
      </div>
    `;

    // 4. Gửi mail
    const info = await transporter.sendMail({
      from: '"PhysioFlow System" <noreply@physioflow.com>', 
      to: toEmail, 
      subject: 'PhysioFlow - Mã xác thực OTP của bạn', 
      html: htmlContent, 
    });

    console.log('----------------------------------------------------');
    console.log('✅ Đã gửi Email OTP tới: %s', toEmail);
    console.log('📩 Bấm vào Link này để XEM EMAIL (Ethereal): %s', nodemailer.getTestMessageUrl(info));
    console.log('----------------------------------------------------');

    return info;
  } catch (error) {
    console.error('Lỗi khi gửi email OTP:', error);
    throw new Error('Không thể gửi email lúc này');
  }
};
