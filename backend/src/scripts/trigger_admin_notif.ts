import prisma from '../config/prisma';
import notificationService from '../services/notification.service';

async function main() {
  console.log('--- Đang gửi thông báo thử nghiệm ---');
  // Lấy danh sách các tài khoản có vai trò Admin (5) hoặc Quản lý (6)
  const adminUsers = await prisma.nguoi_dung.findMany({
    where: {
      vai_tro_id: { in: [5, 6] },
      deleted_at: null,
    },
  });

  if (adminUsers.length === 0) {
    console.log('Không tìm thấy người dùng Admin hoặc Quản lý nào.');
    return;
  }

  console.log(`Tìm thấy ${adminUsers.length} tài khoản Admin/Quản lý.`);
  for (const user of adminUsers) {
    console.log(`Gửi thông báo đến: ${user.ho_ten} (${user.email})`);
    
    // Tạo một thông báo thử nghiệm
    await notificationService.createNotification(
      user.id,
      'Thông báo hệ thống thử nghiệm 🚀',
      `Chào ${user.ho_ten}, đây là thông báo thử nghiệm từ hệ thống để kiểm tra chức năng hiển thị thông báo. Thời gian tạo: ${new Date().toLocaleTimeString('vi-VN')}`,
      'he_thong'
    );
  }
  
  console.log('--- Hoàn tất gửi thông báo thử nghiệm ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
