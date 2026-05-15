import { pool } from '../config/db';
import { Request } from 'express';

export const logAudit = async (
  req: Request | null,
  action: string,
  entity_type: string,
  entity_id?: string,
  payload?: any
) => {
  try {
    const user_id = req?.user?.id || null;
    const ip_address = req?.ip || req?.headers['x-forwarded-for'] || null;

    await pool.query(
      `INSERT INTO system_audit_log (user_id, action, entity_type, entity_id, payload, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user_id,
        action,
        entity_type,
        entity_id || null,
        payload ? JSON.stringify(payload) : null,
        ip_address
      ]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
    // Don't throw error to avoid breaking the main business flow
  }
};
