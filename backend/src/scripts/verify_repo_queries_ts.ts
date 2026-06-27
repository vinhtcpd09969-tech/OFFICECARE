import receptionistRepository from '../repositories/receptionist.repository';
import doctorRepository from '../repositories/doctor.repository';
import appointmentRepository from '../repositories/appointment.repository';
import adminRepository from '../repositories/admin.repository';
import { pool } from '../config/db';

async function testAll() {
  console.log("Starting TS repository query verification...");
  try {
    console.log("1. Testing receptionistRepository.getTodayAppointments()...");
    await receptionistRepository.getTodayAppointments();
    console.log("-> Success!");

    console.log("2. Testing receptionistRepository.getCompletedAppointments()...");
    await receptionistRepository.getCompletedAppointments();
    console.log("-> Success!");

    console.log("3. Testing doctorRepository.getDoctorQueue('2be0000a-5ef0-470c-b4fe-aa05b5dff2c9')...");
    await doctorRepository.getDoctorQueue('2be0000a-5ef0-470c-b4fe-aa05b5dff2c9');
    console.log("-> Success!");

    console.log("4. Testing doctorRepository.getDoctorAppointments('2be0000a-5ef0-470c-b4fe-aa05b5dff2c9')...");
    await doctorRepository.getDoctorAppointments('2be0000a-5ef0-470c-b4fe-aa05b5dff2c9');
    console.log("-> Success!");

    console.log("5. Testing appointmentRepository.getAllAppointments()...");
    await appointmentRepository.getAllAppointments();
    console.log("-> Success!");

    console.log("6. Testing adminRepository.getCustomers()...");
    await adminRepository.getCustomers();
    console.log("-> Success!");

    console.log("7. Testing adminRepository.getInvoices()...");
    await adminRepository.getInvoices();
    console.log("-> Success!");

    console.log("8. Testing adminRepository.getPayments()...");
    await adminRepository.getPayments();
    console.log("-> Success!");

    console.log("9. Testing adminRepository.getFeedback()...");
    await adminRepository.getFeedback();
    console.log("-> Success!");

    console.log("10. Testing adminRepository.getPackages()...");
    const pkgs = await adminRepository.getPackages();
    console.log(`-> Success! Returned ${pkgs.length} packages.`);
    if (pkgs.length > 0) {
      console.log(`   Sample package detail count: ${pkgs[0].chi_tiet_dich_vu?.length}`);
    }

    console.log("11. Testing receptionistRepository.getActivePackages()...");
    const activePkgs = await receptionistRepository.getActivePackages();
    console.log(`-> Success! Returned ${activePkgs.length} active packages.`);

    if (activePkgs.length > 0) {
      const sampleId = activePkgs[0].id;
      console.log(`12. Testing receptionistRepository.getPackageById('${sampleId}')...`);
      const pkg = await receptionistRepository.getPackageById(sampleId);
      console.log(`-> Success! Package name: ${pkg?.ten_goi}, details count: ${pkg?.chi_tiet_dich_vu?.length}`);
    }

    console.log("ALL TS QUERIES VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("Verification failed with error:", err);
  } finally {
    await pool.end();
  }
}

testAll();
