import { format } from 'date-fns';

function run() {
  const apt = {
    id: '07c067b4-5fd9-4cca-9182-e593ba7a8fdc',
    ma_lich_dat: 'LD-57399',
    ngay_gio_bat_dau: '2026-06-22T02:00:00.000Z',
    trang_thai: 'da_xac_nhan',
  };

  // Simulate local timezone
  const selectedDate = new Date('2026-06-21T17:34:29+07:00'); // local time on June 21
  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
  console.log("formattedSelectedDate:", formattedSelectedDate);

  const aptDate = new Date(apt.ngay_gio_bat_dau);
  const aptDateStr = format(aptDate, 'yyyy-MM-dd');
  console.log("aptDateStr:", aptDateStr);
  console.log("Is equal:", aptDateStr === formattedSelectedDate);
}

run();
