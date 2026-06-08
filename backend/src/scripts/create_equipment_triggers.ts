import { pool } from '../config/db';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Tạo hàm tự động điều phối thiết bị (auto_allocate_equipment_on_session_change)...');
    await client.query(`
      CREATE OR REPLACE FUNCTION auto_allocate_equipment_on_session_change()
      RETURNS TRIGGER AS $$
      DECLARE
        v_thiet_bi_yeu_cau VARCHAR(100);
        v_eq_id UUID;
        v_co_the_di_chuyen BOOLEAN;
        v_so_lan_su_dung INTEGER;
        v_nguong_bat_buoc_bao_tri INTEGER;
        v_store_room_id BIGINT;
        v_next_status VARCHAR(20);
        v_next_room_id BIGINT;
      BEGIN
        -- 1. Nếu là buổi trị liệu (buoi_tri_lieu) thay đổi trạng thái
        IF (TG_TABLE_NAME = 'buoi_tri_lieu') THEN
          -- Khi bắt đầu điều trị
          IF (NEW.trang_thai = 'dang_thuc_hien' AND (OLD.trang_thai IS NULL OR OLD.trang_thai != 'dang_thuc_hien')) THEN
            SELECT thiet_bi_yeu_cau INTO v_thiet_bi_yeu_cau 
            FROM dich_vu 
            WHERE id = NEW.dich_vu_id;

            IF (v_thiet_bi_yeu_cau IS NOT NULL AND v_thiet_bi_yeu_cau != 'không có' AND v_thiet_bi_yeu_cau != 'Không cần thiết bị') THEN
              -- Tìm thiết bị sẵn sàng cùng phòng trước
              SELECT id, co_the_di_chuyen INTO v_eq_id, v_co_the_di_chuyen
              FROM thiet_bi_y_te
              WHERE trang_thai = 'san_sang' 
                AND phong_id_hien_tai = NEW.phong_id 
                AND (ten_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%' OR loai_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%')
              LIMIT 1;

              -- Nếu không có, tìm máy di động trong kho (kho_thiet_bi)
              IF (v_eq_id IS NULL) THEN
                SELECT tb.id, tb.co_the_di_chuyen INTO v_eq_id, v_co_the_di_chuyen
                FROM thiet_bi_y_te tb
                JOIN phong p ON tb.phong_id_hien_tai = p.id
                WHERE tb.trang_thai = 'san_sang' 
                  AND p.loai_phong = 'kho_thiet_bi' 
                  AND (tb.ten_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%' OR tb.loai_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%')
                  AND tb.co_the_di_chuyen = true
                LIMIT 1;
              END IF;

              IF (v_eq_id IS NOT NULL) THEN
                UPDATE thiet_bi_y_te 
                SET trang_thai = 'dang_su_dung', 
                    phong_id_hien_tai = NEW.phong_id
                WHERE id = v_eq_id;
              END IF;
            END IF;

          -- Khi hoàn thành hoặc hủy buổi trị liệu
          ELSIF (NEW.trang_thai IN ('hoan_thanh', 'da_huy') AND OLD.trang_thai = 'dang_thuc_hien') THEN
            SELECT thiet_bi_yeu_cau INTO v_thiet_bi_yeu_cau 
            FROM dich_vu 
            WHERE id = NEW.dich_vu_id;

            IF (v_thiet_bi_yeu_cau IS NOT NULL AND v_thiet_bi_yeu_cau != 'không có' AND v_thiet_bi_yeu_cau != 'Không cần thiết bị') THEN
              SELECT id, co_the_di_chuyen, so_lan_su_dung, nguong_bat_buoc_bao_tri INTO v_eq_id, v_co_the_di_chuyen, v_so_lan_su_dung, v_nguong_bat_buoc_bao_tri
              FROM thiet_bi_y_te
              WHERE trang_thai = 'dang_su_dung' 
                AND phong_id_hien_tai = OLD.phong_id 
                AND (ten_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%' OR loai_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%')
              LIMIT 1;

              IF (v_eq_id IS NOT NULL) THEN
                IF (NEW.trang_thai = 'hoan_thanh') THEN
                  v_so_lan_su_dung := COALESCE(v_so_lan_su_dung, 0) + 1;
                END IF;

                v_next_status := 'san_sang';
                IF (v_nguong_bat_buoc_bao_tri IS NOT NULL AND v_so_lan_su_dung >= v_nguong_bat_buoc_bao_tri) THEN
                  v_next_status := 'dang_bao_tri';
                END IF;

                v_next_room_id := OLD.phong_id;
                IF (v_co_the_di_chuyen = true) THEN
                  SELECT id INTO v_store_room_id FROM phong WHERE loai_phong = 'kho_thiet_bi' LIMIT 1;
                  IF (v_store_room_id IS NOT NULL) THEN
                    v_next_room_id := v_store_room_id;
                  END IF;
                END IF;

                UPDATE thiet_bi_y_te 
                SET trang_thai = v_next_status, 
                    phong_id_hien_tai = v_next_room_id, 
                    so_lan_su_dung = v_so_lan_su_dung
                WHERE id = v_eq_id;
              END IF;
            END IF;
          END IF;
        END IF;

        -- 2. Nếu là lịch đặt khám (lich_dat) thay đổi trạng thái
        IF (TG_TABLE_NAME = 'lich_dat') THEN
          -- Khi check-in lịch khám
          IF (NEW.trang_thai = 'da_checkin' AND (OLD.trang_thai IS NULL OR OLD.trang_thai != 'da_checkin')) THEN
            SELECT thiet_bi_yeu_cau INTO v_thiet_bi_yeu_cau 
            FROM dich_vu 
            WHERE id = NEW.dich_vu_id;

            IF (v_thiet_bi_yeu_cau IS NOT NULL AND v_thiet_bi_yeu_cau != 'không có' AND v_thiet_bi_yeu_cau != 'Không cần thiết bị') THEN
              SELECT id, co_the_di_chuyen INTO v_eq_id, v_co_the_di_chuyen
              FROM thiet_bi_y_te
              WHERE trang_thai = 'san_sang' 
                AND phong_id_hien_tai = NEW.phong_id 
                AND (ten_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%' OR loai_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%')
              LIMIT 1;

              IF (v_eq_id IS NULL) THEN
                SELECT tb.id, tb.co_the_di_chuyen INTO v_eq_id, v_co_the_di_chuyen
                FROM thiet_bi_y_te tb
                JOIN phong p ON tb.phong_id_hien_tai = p.id
                WHERE tb.trang_thai = 'san_sang' 
                  AND p.loai_phong = 'kho_thiet_bi' 
                  AND (tb.ten_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%' OR tb.loai_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%')
                  AND tb.co_the_di_chuyen = true
                LIMIT 1;
              END IF;

              IF (v_eq_id IS NOT NULL) THEN
                UPDATE thiet_bi_y_te 
                SET trang_thai = 'dang_su_dung', 
                    phong_id_hien_tai = NEW.phong_id
                WHERE id = v_eq_id;
              END IF;
            END IF;

          -- Khi kết thúc lịch khám
          ELSIF (NEW.trang_thai IN ('hoan_thanh', 'da_huy', 'khong_den') AND OLD.trang_thai = 'da_checkin') THEN
            SELECT thiet_bi_yeu_cau INTO v_thiet_bi_yeu_cau 
            FROM dich_vu 
            WHERE id = NEW.dich_vu_id;

            IF (v_thiet_bi_yeu_cau IS NOT NULL AND v_thiet_bi_yeu_cau != 'không có' AND v_thiet_bi_yeu_cau != 'Không cần thiết bị') THEN
              SELECT id, co_the_di_chuyen, so_lan_su_dung, nguong_bat_buoc_bao_tri INTO v_eq_id, v_co_the_di_chuyen, v_so_lan_su_dung, v_nguong_bat_buoc_bao_tri
              FROM thiet_bi_y_te
              WHERE trang_thai = 'dang_su_dung' 
                AND phong_id_hien_tai = OLD.phong_id 
                AND (ten_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%' OR loai_thiet_bi ILIKE '%' || v_thiet_bi_yeu_cau || '%')
              LIMIT 1;

              IF (v_eq_id IS NOT NULL) THEN
                IF (NEW.trang_thai = 'hoan_thanh') THEN
                  v_so_lan_su_dung := COALESCE(v_so_lan_su_dung, 0) + 1;
                END IF;

                v_next_status := 'san_sang';
                IF (v_nguong_bat_buoc_bao_tri IS NOT NULL AND v_so_lan_su_dung >= v_nguong_bat_buoc_bao_tri) THEN
                  v_next_status := 'dang_bao_tri';
                END IF;

                v_next_room_id := OLD.phong_id;
                IF (v_co_the_di_chuyen = true) THEN
                  SELECT id INTO v_store_room_id FROM phong WHERE loai_phong = 'kho_thiet_bi' LIMIT 1;
                  IF (v_store_room_id IS NOT NULL) THEN
                    v_next_room_id := v_store_room_id;
                  END IF;
                END IF;

                UPDATE thiet_bi_y_te 
                SET trang_thai = v_next_status, 
                    phong_id_hien_tai = v_next_room_id, 
                    so_lan_su_dung = v_so_lan_su_dung
                WHERE id = v_eq_id;
              END IF;
            END IF;
          END IF;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Đã tạo/cập nhật hàm trigger auto_allocate_equipment_on_session_change');

    console.log('2. Tạo trigger trg_auto_allocate_equipment_btl trên bảng buoi_tri_lieu...');
    await client.query(`
      DROP TRIGGER IF EXISTS trg_auto_allocate_equipment_btl ON buoi_tri_lieu;
      CREATE TRIGGER trg_auto_allocate_equipment_btl
        AFTER UPDATE ON buoi_tri_lieu
        FOR EACH ROW
        EXECUTE FUNCTION auto_allocate_equipment_on_session_change();
    `);

    console.log('3. Tạo trigger trg_auto_allocate_equipment_ld trên bảng lich_dat...');
    await client.query(`
      DROP TRIGGER IF EXISTS trg_auto_allocate_equipment_ld ON lich_dat;
      CREATE TRIGGER trg_auto_allocate_equipment_ld
        AFTER UPDATE ON lich_dat
        FOR EACH ROW
        EXECUTE FUNCTION auto_allocate_equipment_on_session_change();
    `);

    await client.query('COMMIT');
    console.log('🎉 Đã kích hoạt triggers đồng bộ thiết bị thành công!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi khi thiết lập triggers:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
