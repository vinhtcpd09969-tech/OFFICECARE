const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/office_care'
});

async function main() {
  try {
    const { rows: users } = await pool.query('SELECT count(1)::int as count FROM nguoi_dung');
    const { rows: schedules } = await pool.query('SELECT count(1)::int as count FROM lich_lam_viec');
    const { rows: rooms } = await pool.query('SELECT count(1)::int as count FROM phong');
    const { rows: invalidSchedules } = await pool.query("SELECT count(1)::int as count FROM lich_lam_viec llv JOIN phong p ON llv.phong_id = p.id WHERE p.loai_phong NOT IN ('phong_tri_lieu_chuan', 'tri_lieu')");
    console.log(`DATABASE COUNTS:`);
    console.log(`Users: ${users[0].count}`);
    console.log(`Schedules: ${schedules[0].count}`);
    console.log(`Rooms: ${rooms[0].count}`);
    console.log(`Schedules assigned to non-therapy rooms: ${invalidSchedules[0].count}`);
    
    if (users[0].count > 0) {
      console.log('\nUsers samples:');
      const { rows: userSamples } = await pool.query('SELECT id, ho_ten, email FROM nguoi_dung LIMIT 5');
      console.log(userSamples);
    }
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

main();
