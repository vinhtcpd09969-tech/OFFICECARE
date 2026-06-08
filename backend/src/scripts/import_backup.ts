import { pool } from '../config/db';
import fs from 'fs';
import path from 'path';

async function importBackup() {
  try {
    console.log('Đang đọc tệp tin SQL backup...');
    const filePath = path.join(__dirname, '../../../backup_services_and_packages.sql');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Không tìm thấy tệp tin backup tại đường dẫn: ${filePath}`);
    }

    let sqlContent = fs.readFileSync(filePath, 'utf8');

    console.log('Đang xử lý nội dung SQL (lọc bỏ các lệnh meta CLI)...');
    // Lọc bỏ các dòng psql slash commands (bắt đầu bằng \)
    sqlContent = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('\\'))
      .join('\n');

    console.log('Đang kết nối database và thực thi các câu lệnh SQL...');
    
    // Thực thi toàn bộ chuỗi SQL chứa nhiều câu lệnh INSERT
    await pool.query(sqlContent);
    
    console.log('================================================');
    console.log('🎉 KHÔI PHỤC DỮ LIỆU DỊCH VỤ VÀ GÓI THÀNH CÔNG! 🎉');
    console.log('================================================');
  } catch (error) {
    console.error('❌ Lỗi khi khôi phục dữ liệu:', error);
  } finally {
    // Đóng pool kết nối để kết thúc tiến trình Node.js sạch sẽ
    await pool.end();
  }
}

importBackup();
