import pool from '../config/database.js';

const Product = {
  // Menyü üçün — aktiv endirim qiyməti ilə (ownerView=true olduqda gizlədilmiş məhsullar da göstərilir)
  async findAll({ segment, categoryId, search, ownerView = false } = {}) {
    const conditions = ownerView ? [] : ['p.is_available = TRUE'];
    const params = [];

    if (segment) {
      params.push(segment);
      conditions.push(`p.segment = $${params.length}`);
    }
    if (categoryId) {
      params.push(categoryId);
      conditions.push(`p.category_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`p.name ILIKE $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await pool.query(`
      SELECT
        pwd.*,
        c.name AS category_name,
        COALESCE(tsp.total_sold, 0) AS total_sold,
        COALESCE(
          json_agg(
            json_build_object('name', i.name, 'quantity', pi.quantity, 'unit', i.unit)
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS ingredients
      FROM products_with_discount pwd
      JOIN products p ON p.id = pwd.id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN top_selling_products tsp ON tsp.product_id = p.id
      LEFT JOIN product_ingredients pi ON pi.product_id = p.id
      LEFT JOIN ingredients i ON i.id = pi.ingredient_id
      ${where}
      GROUP BY pwd.id, pwd.category_id, pwd.name, pwd.description, pwd.image_url,
               pwd.base_price, pwd.segment, pwd.stock_qty, pwd.is_available,
               pwd.sort_order, pwd.created_at, pwd.updated_at,
               pwd.discount_id, pwd.discount_type, pwd.discount_value, pwd.final_price,
               c.name, tsp.total_sold, tsp.total_revenue
      ORDER BY
        CASE WHEN pwd.segment = 'fast'    THEN COALESCE(tsp.total_sold, 0) END DESC NULLS LAST,
        CASE WHEN pwd.segment = 'premium' THEN COALESCE(tsp.total_revenue, 0) END DESC NULLS LAST,
        pwd.sort_order, pwd.name
    `, params);

    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query(`
      SELECT
        pwd.*,
        c.name AS category_name,
        COALESCE(
          json_agg(
            json_build_object('id', i.id, 'name', i.name, 'quantity', pi.quantity, 'unit', i.unit)
          ) FILTER (WHERE i.id IS NOT NULL),
          '[]'
        ) AS ingredients
      FROM products_with_discount pwd
      JOIN products p ON p.id = pwd.id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN product_ingredients pi ON pi.product_id = p.id
      LEFT JOIN ingredients i ON i.id = pi.ingredient_id
      WHERE p.id = $1
      GROUP BY pwd.id, pwd.category_id, pwd.name, pwd.description, pwd.image_url,
               pwd.base_price, pwd.segment, pwd.stock_qty, pwd.is_available,
               pwd.sort_order, pwd.created_at, pwd.updated_at,
               pwd.discount_id, pwd.discount_type, pwd.discount_value, pwd.final_price,
               c.name
    `, [id]);
    return rows[0] || null;
  },

  async create(data, client = pool) {
    const { rows } = await client.query(`
      INSERT INTO products (name, description, image_url, base_price, segment, category_id, stock_qty, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [data.name, data.description, data.image_url, data.base_price,
        data.segment || 'simple', data.category_id, data.stock_qty || 0, data.sort_order || 0]);
    return rows[0];
  },

  async update(id, data, client = pool) {
    const fields = [];
    const values = [];
    let i = 1;

    const allowed = ['name', 'description', 'image_url', 'base_price', 'segment',
                     'category_id', 'stock_qty', 'is_available', 'sort_order'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(data[key]);
      }
    }
    if (!fields.length) return null;

    values.push(id);
    const { rows } = await client.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] || null;
  },

  async delete(id) {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
  },

  // Stok artır (işçi stok daxil edəndə)
  async increaseStock(id, qty, client = pool) {
    const { rows } = await client.query(
      'UPDATE products SET stock_qty = stock_qty + $1 WHERE id = $2 RETURNING stock_qty',
      [qty, id]
    );
    return rows[0];
  },

  // Stok azalt (sifariş veriləndə)
  async decreaseStock(id, qty, client = pool) {
    const { rows } = await client.query(
      'UPDATE products SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2 RETURNING stock_qty',
      [qty, id]
    );
    return rows[0];
  },

  // İnqredientlər siyahısını dəyiş
  async syncIngredients(productId, ingredients, client = pool) {
    await client.query('DELETE FROM product_ingredients WHERE product_id = $1', [productId]);
    for (const ing of ingredients) {
      await client.query(
        'INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
        [productId, ing.ingredient_id, ing.quantity]
      );
    }
  },
};

export default Product;
