import pool from '../config/database.js';

const Discount = {
  async findAll() {
    const { rows } = await pool.query(`
      SELECT d.*, p.name AS product_name, p.base_price
      FROM discounts d
      JOIN products p ON p.id = d.product_id
      ORDER BY d.created_at DESC
    `);
    return rows;
  },

  async create({ productId, discountType, discountValue, startsAt, endsAt, createdBy }) {
    const { rows } = await pool.query(`
      INSERT INTO discounts (product_id, discount_type, discount_value, starts_at, ends_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [productId, discountType, discountValue, startsAt || new Date(), endsAt, createdBy]);
    return rows[0];
  },

  async update(id, { discountType, discountValue, startsAt, endsAt, isActive }) {
    const { rows } = await pool.query(`
      UPDATE discounts
      SET discount_type  = COALESCE($1, discount_type),
          discount_value = COALESCE($2, discount_value),
          starts_at      = COALESCE($3, starts_at),
          ends_at        = COALESCE($4, ends_at),
          is_active      = COALESCE($5, is_active)
      WHERE id = $6
      RETURNING *
    `, [discountType, discountValue, startsAt, endsAt, isActive, id]);
    return rows[0];
  },

  async toggle(id) {
    const { rows } = await pool.query(
      'UPDATE discounts SET is_active = NOT is_active WHERE id = $1 RETURNING *',
      [id]
    );
    return rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM discounts WHERE id = $1', [id]);
  },
};

export default Discount;
