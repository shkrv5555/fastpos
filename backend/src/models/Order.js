import pool, { transaction } from '../config/database.js';

const Order = {
  // Yeni sifariş yarat (tranzaksiya içində)
  async create({ items, sessionId, notes }) {
    return transaction(async (client) => {
      // 1. Sifarişi yarat
      const { rows: [order] } = await client.query(`
        INSERT INTO orders (session_id, notes)
        VALUES ($1, $2)
        RETURNING *
      `, [sessionId, notes]);

      let subtotal = 0;
      let discountAmount = 0;

      // 2. Hər məhsul üçün item əlavə et
      for (const item of items) {
        const { rows: [product] } = await client.query(
          'SELECT * FROM products_with_discount WHERE id = $1 AND is_available = TRUE',
          [item.productId]
        );
        if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
        if (product.stock_qty < item.quantity) throw new Error(`STOCK_INSUFFICIENT:${item.productId}`);

        const unitPrice = parseFloat(product.base_price);
        const finalPrice = parseFloat(product.final_price);
        const itemSubtotal = finalPrice * item.quantity;

        subtotal += unitPrice * item.quantity;
        discountAmount += (unitPrice - finalPrice) * item.quantity;

        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, discount_price, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [order.id, item.productId, product.name, item.quantity,
            unitPrice, product.discount_id ? finalPrice : null, itemSubtotal]);

        // Stoku azalt
        await client.query(
          'UPDATE products SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2',
          [item.quantity, item.productId]
        );
      }

      const totalAmount = subtotal - discountAmount;

      // 3. Qiymətləri yenilə
      const { rows: [updated] } = await client.query(`
        UPDATE orders
        SET subtotal = $1, discount_amount = $2, total_amount = $3
        WHERE id = $4
        RETURNING *
      `, [subtotal.toFixed(2), discountAmount.toFixed(2), totalAmount.toFixed(2), order.id]);

      return { ...updated, items };
    });
  },

  async findById(id) {
    const { rows: [order] } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (!order) return null;

    const { rows: items } = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [id]
    );
    return { ...order, items };
  },

  // İşçi dashboardı üçün — aktiv sifarişlər
  async findActive() {
    const { rows } = await pool.query(`
      SELECT o.*, json_agg(
        json_build_object(
          'id', oi.id, 'product_name', oi.product_name,
          'quantity', oi.quantity, 'unit_price', oi.unit_price,
          'discount_price', oi.discount_price, 'subtotal', oi.subtotal
        )
      ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.status NOT IN ('completed', 'cancelled')
      GROUP BY o.id
      ORDER BY o.created_at ASC
    `);
    return rows;
  },

  async updateStatus(id, status, employeeId = null) {
    const { rows } = await pool.query(`
      UPDATE orders
      SET status = $1, employee_id = COALESCE($2, employee_id)
      WHERE id = $3
      RETURNING *
    `, [status, employeeId, id]);
    return rows[0];
  },

  async setPaymentAndConfirm(id, paymentType, employeeId) {
    const { rows } = await pool.query(`
      UPDATE orders
      SET status = 'confirmed', payment_type = $1, employee_id = $2
      WHERE id = $3 AND status = 'pending'
      RETURNING *
    `, [paymentType, employeeId, id]);
    return rows[0] || null;
  },

  // Owner üçün statistika
  async getDailyStats(date) {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed')                    AS completed_count,
        COUNT(*) FILTER (WHERE status = 'cancelled')                    AS cancelled_count,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'
          AND payment_type = 'cash'), 0)                                AS cash_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'
          AND payment_type = 'card'), 0)                                AS card_revenue
      FROM orders
      WHERE DATE(created_at) = $1
    `, [date]);
    return rows[0];
  },

  async getWeeklyStats() {
    const { rows } = await pool.query(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) FILTER (WHERE status = 'completed') AS order_count,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY day
    `);
    return rows;
  },

  async getMonthlyStats(year, month) {
    const { rows } = await pool.query(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) FILTER (WHERE status = 'completed') AS order_count,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS revenue
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = $1
        AND EXTRACT(MONTH FROM created_at) = $2
      GROUP BY DATE(created_at)
      ORDER BY day
    `, [year, month]);
    return rows;
  },
};

export default Order;
