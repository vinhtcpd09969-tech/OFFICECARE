import dotenv from 'dotenv';
dotenv.config();

import { getAllAppointments } from '../controllers/appointment.controller';
import { getCustomers, getInvoices, getPayments, getFeedback } from '../controllers/admin.controller';

async function testController(name: string, fn: any) {
  console.log(`Testing controller: ${name}...`);
  const req: any = {
    user: { id: '2be0000a-5ef0-470c-b4fe-aa05b5dff2c9' },
    query: {},
    params: {}
  };
  const res: any = {
    json: (data: any) => {
      console.log(`  -> Success! returned ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
    },
    status: (code: number) => {
      console.log(`  -> Status code: ${code}`);
      return res;
    }
  };
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`  -> Failed with catch error:`, err);
  }
}

async function run() {
  await testController('getAllAppointments', getAllAppointments);
  await testController('getCustomers', getCustomers);
  await testController('getInvoices', getInvoices);
  await testController('getPayments', getPayments);
  await testController('getFeedback', getFeedback);
}

run();
