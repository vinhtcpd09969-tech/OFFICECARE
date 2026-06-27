const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super_secret_jwt_key';

// Doctor user id: '00000000-0000-0000-0000-000000000005'
const token = jwt.sign(
  { id: '00000000-0000-0000-0000-000000000005', vai_tro_id: 4, email: 'bacsi1@physioflow.vn' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const client = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    Authorization: `Bearer ${token}`
  }
});

async function run() {
  try {
    // 1. Get for June 21
    console.log("Calling getDoctorAppointments for June 21...");
    const res21 = await client.get('/doctor/appointments', {
      params: {
        startDate: '2026-06-21T00:00:00.000Z',
        endDate: '2026-06-21T23:59:59.999Z'
      }
    });
    console.log("June 21 count:", res21.data.length);
    console.log("June 21 appointments:", res21.data);

    // 2. Get for June 22
    console.log("\nCalling getDoctorAppointments for June 22...");
    const res22 = await client.get('/doctor/appointments', {
      params: {
        startDate: '2026-06-22T00:00:00.000Z',
        endDate: '2026-06-22T23:59:59.999Z'
      }
    });
    console.log("June 22 count:", res22.data.length);
    console.log("June 22 appointments:", res22.data);
  } catch (err) {
    if (err.response) {
      console.error("Failed with status:", err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

run();
