const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super_secret_jwt_key';

const token = jwt.sign(
  { id: '2be0000a-5ef0-470c-b4fe-aa05b5dff2c9', vai_tro_id: 5, email: 'admin@physioflow.com' },
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
    const response = await client.get('/admin/appointments');
    console.log("API appointments:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}

run();
