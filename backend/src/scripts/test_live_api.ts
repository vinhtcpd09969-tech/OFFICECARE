import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

// Tạo token admin (vai_tro_id: 5)
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

async function runTests() {
  const endpoints = [
    '/admin/rooms',
    '/admin/appointments',
    '/admin/customers',
    '/admin/medical-records',
    '/admin/equipment',
    '/admin/payments',
    '/admin/invoices',
    '/admin/feedback'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTesting HTTP GET ${endpoint}...`);
    try {
      const response = await client.get(endpoint);
      console.log(`  -> Status: ${response.status}`);
      console.log(`  -> Data: returned ${Array.isArray(response.data) ? response.data.length + ' items' : 'object'}`);
    } catch (err: any) {
      if (err.response) {
        console.error(`  -> Failed with status ${err.response.status}:`, err.response.data);
      } else {
        console.error(`  -> Failed with error:`, err.message);
      }
    }
  }
}

runTests();
