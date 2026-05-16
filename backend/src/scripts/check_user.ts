import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/physioflow_db' });

pool.query("SELECT * FROM nguoi_dung WHERE email LIKE '%letan%'").then(res => { 
  console.log(res.rows); 
  process.exit(0); 
});
