import { Pool, types } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Fix timezone bug: parse TIMESTAMP WITHOUT TIME ZONE (OID 1114) as UTC
// This ensures that dates stored as UTC are correctly parsed as UTC dates in JS,
// preventing node-postgres from parsing them using the server's local system timezone.
types.setTypeParser(1114, (stringValue) => {
  return new Date(stringValue.replace(' ', 'T') + 'Z');
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL Database via Pool.');
});

pool.on('error', (err) => {
  console.log('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export { pool };

