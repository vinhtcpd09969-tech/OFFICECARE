import appointmentRepository from '../repositories/appointment.repository';

async function run() {
  try {
    console.log("Fetching appointments via repository...");
    const appts = await appointmentRepository.getAllAppointments();
    console.log("Total appointments:", appts.length);
    const target = appts.find((a: any) => a.id === '07c067b4-5fd9-4cca-9182-e593ba7a8fdc');
    console.log("Target appointment:", target);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
