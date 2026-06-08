import appointmentService from '../services/appointment.service';

async function main() {
  const date = '2026-06-04';
  console.log(`Checking booked slots for date: ${date}`);
  try {
    const res = await appointmentService.getBookedSlots(date);
    console.log('Booked Slots returned:', res);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
