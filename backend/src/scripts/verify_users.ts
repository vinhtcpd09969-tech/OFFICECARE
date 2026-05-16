import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/physioflow_db' });

pool.query("UPDATE nguoi_dung SET da_xac_thuc_email = true").then(res => { 
  console.log('Updated users:', res.rowCount); 
  process.exit(0); 
}).catch(err => {
  console.error(err);
  process.exit(1);
});
