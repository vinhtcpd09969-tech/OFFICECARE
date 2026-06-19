import prisma from '../config/prisma';
import notificationService from '../services/notification.service';

async function main() {
  console.log('--- Đang tìm kiếm tài khoản Khách Hàng ---');
  // Lấy danh sách tài khoản Khách hàng (vai_tro_id = 1)
  const clientUser = await prisma.nguoi_dung.findFirst({
    where: {
      vai_tro_id: 1,
      deleted_at: null,
    },
  });

  if (!clientUser) {
    console.log('Không tìm thấy tài khoản Khách Hàng nào trong DB.');
    return;
  }

  console.log(`Tìm thấy khách hàng: ${clientUser.ho_ten} (${clientUser.email})`);
  
  // Gửi thông báo thử nghiệm cho khách hàng này
  await notificationService.createNotification(
    clientUser.id,
    'Lịch hẹn của bạn đã xác nhận 🎉',
    `Chào ${clientUser.ho_ten}, đây là thông báo thử nghiệm trên tài khoản Khách Hàng để bạn kiểm tra giao diện quả chuông.`,
    'lich_hen'
  );

  console.log(`Đã gửi thông báo thử nghiệm đến khách hàng này.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
