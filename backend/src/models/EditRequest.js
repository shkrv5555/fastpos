import pool from '../config/database.js';
import { getIO } from '../config/socket.js';

const EditRequest = {
  async create({ employeeId, productId, requestedChanges, comment }) {
    const { rows } = await pool.query(`
      INSERT INTO edit_requests (employee_id, product_id, requested_changes, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [employeeId, productId, JSON.stringify(requestedChanges), comment]);

    // Owner-ə bildiriş göndər
    await pool.query(`
      INSERT INTO notifications (recipient_role, type, title, message, data)
      VALUES ('owner', 'edit_request', 'Redaktə icazəsi sorğusu',
              $1, $2)
    `, [
      `İşçi "${comment}" şərhi ilə məhsulda dəyişiklik istəyir`,
      JSON.stringify({ requestId: rows[0].id, productId }),
    ]);

    // Real-time push — owner-ə
    try {
      getIO().to('role:owner').emit('notification:edit-request', rows[0]);
    } catch {}

    return rows[0];
  },

  async findAll(status = null) {
    const params = [];
    const where  = status ? (params.push(status), `WHERE er.status = $1`) : '';
    const { rows } = await pool.query(`
      SELECT er.*,
             u.name AS employee_name, u.hr_code,
             p.name AS product_name
      FROM edit_requests er
      JOIN users u ON u.id = er.employee_id
      JOIN products p ON p.id = er.product_id
      ${where}
      ORDER BY er.created_at DESC
    `, params);
    return rows;
  },

  async approve(id, ownerId) {
    const { rows: [request] } = await pool.query(
      'SELECT * FROM edit_requests WHERE id = $1 AND status = \'pending\'',
      [id]
    );
    if (!request) return null;

    // Dəyişiklikləri tətbiq et
    const changes = request.requested_changes;
    const allowed = ['name', 'description', 'base_price', 'segment', 'image_url'];
    const fields = [];
    const values = [];
    let i = 1;
    for (const key of Object.keys(changes)) {
      if (allowed.includes(key)) {
        fields.push(`${key} = $${i++}`);
        values.push(changes[key]);
      }
    }
    if (fields.length) {
      values.push(request.product_id);
      await pool.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = $${i}`,
        values
      );
    }

    const { rows } = await pool.query(`
      UPDATE edit_requests
      SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
      WHERE id = $2 RETURNING *
    `, [ownerId, id]);
    return rows[0];
  },

  async reject(id, ownerId) {
    const { rows } = await pool.query(`
      UPDATE edit_requests
      SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW()
      WHERE id = $2 AND status = 'pending'
      RETURNING *
    `, [ownerId, id]);
    return rows[0] || null;
  },
};

export default EditRequest;
