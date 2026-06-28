import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:5001/api/admin/equipment-types');
    console.log('API response status:', res.status);
    console.log('API data length:', res.data.length);
  } catch (err: any) {
    console.error('API call failed:', err.message);
    if (err.response) {
      console.error('API response status:', err.response.status);
      console.error('API response data:', err.response.data);
    }
  }
}

test();
