const receptionistRepository = require('../../dist/src/repositories/receptionist.repository').default;
const doctorRepository = require('../../dist/src/repositories/doctor.repository').default;
const appointmentRepository = require('../../dist/src/repositories/appointment.repository').default;
const adminRepository = require('../../dist/src/repositories/admin.repository').default;
const { pool } = require('../../dist/src/config/db');

async function testAll() {
  console.log("Starting repository query verification...");
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

    console.log("ALL QUERIES VERIFIED SUCCESSFULLY!");
  } catch (err) {
    console.error("Verification failed with error:", err);
  } finally {
    await pool.end();
  }
}

testAll();
