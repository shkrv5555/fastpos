import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const SALT_ROUNDS = 10;

const User = {
  async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND role = \'owner\'',
      [username]
    );
    return rows[0] || null;
  },

  async findByHrCode(hrCode) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE hr_code = $1 AND role = \'employee\' AND is_blocked = FALSE',
      [hrCode]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, username, hr_code, role, is_blocked, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async verifyPassword(plainText, hash) {
    return bcrypt.compare(plainText, hash);
  },

  async hashPassword(plainText) {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  },

  async createEmployee({ name, hrCode, password }) {
    const hash = await this.hashPassword(password);
    const { rows } = await pool.query(`
      INSERT INTO users (name, hr_code, password_hash, role)
      VALUES ($1, $2, $3, 'employee')
      RETURNING id, name, hr_code, role, is_blocked, created_at
    `, [name, hrCode, hash]);
    return rows[0];
  },

  async getAllEmployees() {
    const { rows } = await pool.query(`
      SELECT id, name, hr_code, is_blocked, created_at
      FROM users
      WHERE role = 'employee'
      ORDER BY created_at DESC
    `);
    return rows;
  },

  async update(id, { name, hrCode }) {
    const { rows } = await pool.query(`
      UPDATE users SET name = COALESCE($1, name), hr_code = COALESCE($2, hr_code)
      WHERE id = $3
      RETURNING id, name, hr_code, role, is_blocked
    `, [name, hrCode, id]);
    return rows[0];
  },

  async setBlocked(id, blocked) {
    const { rows } = await pool.query(
      'UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, name, is_blocked',
      [blocked, id]
    );
    return rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1 AND role = \'employee\'', [id]);
  },
};

export default User;
