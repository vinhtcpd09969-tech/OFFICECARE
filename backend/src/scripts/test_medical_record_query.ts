import adminRepository from '../repositories/admin.repository';
import { pool } from '../config/db';

async function run() {
  try {
    console.log("Running getMedicalRecords()...");
    const records = await adminRepository.getMedicalRecords();
    console.log("Success! Returned records count:", records.length);
  } catch (err: any) {
    console.error("Error executing getMedicalRecords():");
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
