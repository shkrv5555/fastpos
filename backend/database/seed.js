// Demo məlumatlar
import bcrypt from 'bcrypt';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Owner
    const ownerHash = await bcrypt.hash('Owner2024!', 10);
    await client.query(`
      INSERT INTO users (name, username, password_hash, role)
      VALUES ('Müəssisə Sahibi', 'owner', $1, 'owner')
      ON CONFLICT (username) DO NOTHING
    `, [ownerHash]);

    // 2. Demo işçilər
    const empHash = await bcrypt.hash('Employee123!', 10);
    await client.query(`
      INSERT INTO users (name, hr_code, password_hash, role) VALUES
      ('Əli Həsənov',   'EMP001', $1, 'employee'),
      ('Nigar Quliyeva','EMP002', $1, 'employee')
      ON CONFLICT (hr_code) DO NOTHING
    `, [empHash]);

    // 3. Kateqoriyalar
    await client.query(`
      INSERT INTO categories (name, sort_order) VALUES
      ('Burqerlər', 1), ('İçkilər', 2), ('Yanında', 3), ('Desertlər', 4), ('Pizzalar', 5)
      ON CONFLICT (name) DO NOTHING
    `);
    const { rows: cats } = await client.query('SELECT id, name FROM categories ORDER BY sort_order');
    const catId = Object.fromEntries(cats.map(c => [c.name, c.id]));

    // 4. İnqredientlər
    await client.query(`
      INSERT INTO ingredients (name, unit) VALUES
      ('Dana əti',  'q'), ('Pendir',   'q'), ('Pomidor',   'əd'),
      ('Xiyar',     'əd'),('Yarpaq',   'əd'), ('Sous',     'ml'),
      ('Bulka',     'əd'),('Kartof',   'q'),  ('Yağ',      'ml'),
      ('Kola',      'ml'),('Su',       'ml'),  ('Limon',    'əd'),
      ('Wakyu əti', 'q'), ('Trüf sous','ml'),  ('Emmental', 'q'),
      ('Şokolad',   'q'), ('Dondurma', 'q'),  ('Xəmir',    'q')
      ON CONFLICT (name) DO NOTHING
    `);

    // 5. Məhsullar
    const products = [
      // Burqerlər
      { name: 'Klassik Burqer',    desc: 'Dana əti, pendir, pomidor, xiyar, xüsusi sous',  price: 8.50,  seg: 'simple',  qty: 50, cat: 'Burqerlər',  sort: 1 },
      { name: 'Fast Burqer',       desc: 'Sürətli hazırlanma, isti-isti çatdırılır',        price: 9.00,  seg: 'fast',    qty: 40, cat: 'Burqerlər',  sort: 2 },
      { name: 'Premium Burqer',    desc: 'Wagyu əti, trüf sous, emmental pendir',           price: 18.00, seg: 'premium', qty: 20, cat: 'Burqerlər',  sort: 3 },
      { name: 'Double Burqer',     desc: 'İkiqat ət, ikiqat pendir, ikiqat ləzzət',         price: 12.00, seg: 'fast',    qty: 30, cat: 'Burqerlər',  sort: 4 },
      // Yanında
      { name: 'Kartof Qızartması', desc: 'Xüsusi ədviyyat ilə qızardılmış kartof',          price: 4.00,  seg: 'simple',  qty: 80, cat: 'Yanında',    sort: 1 },
      { name: 'Soğan Həlqələri',   desc: 'Unlanmış qızardılmış soğan',                      price: 3.50,  seg: 'simple',  qty: 60, cat: 'Yanında',    sort: 2 },
      // İçkilər
      { name: 'Cola 0.5L',         desc: 'Soyuq Coca-Cola',                                 price: 2.50,  seg: 'simple',  qty: 100,cat: 'İçkilər',    sort: 1 },
      { name: 'Ayran',             desc: 'Təzə ev ayranı',                                  price: 2.00,  seg: 'fast',    qty: 60, cat: 'İçkilər',    sort: 2 },
      { name: 'Limonad',           desc: 'Təbii limon şirəsi ilə',                          price: 3.00,  seg: 'simple',  qty: 50, cat: 'İçkilər',    sort: 3 },
      // Desertlər
      { name: 'Şokolad Browni',    desc: 'İsti şokolad browni, dondurma ilə',               price: 6.00,  seg: 'premium', qty: 25, cat: 'Desertlər',  sort: 1 },
      // Pizzalar
      { name: 'Marqarita Pizza',   desc: 'Pomidor, mozzarella, reyhan',                     price: 10.00, seg: 'simple',  qty: 30, cat: 'Pizzalar',   sort: 1 },
      { name: 'Fast Pizza',        desc: '10 dəqiqəyə hazır — pepperoni və pendir',          price: 11.00, seg: 'fast',    qty: 25, cat: 'Pizzalar',   sort: 2 },
    ];

    for (const p of products) {
      await client.query(`
        INSERT INTO products (name, description, base_price, segment, stock_qty, category_id, sort_order)
        VALUES ($1, $2, $3, $4::product_segment, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, [p.name, p.desc, p.price, p.seg, p.qty, catId[p.cat] || null, p.sort]);
    }

    const { rows: allProds } = await client.query('SELECT id, name, base_price FROM products ORDER BY name');
    const prodId = Object.fromEntries(allProds.map(p => [p.name, p]));

    // 6. İnqredient təyinatları (klassik burqer üçün nümunə)
    if (prodId['Klassik Burqer']) {
      const { rows: ings } = await client.query('SELECT id, name FROM ingredients');
      const ingId = Object.fromEntries(ings.map(i => [i.name, i.id]));
      const pid = prodId['Klassik Burqer'].id;
      for (const [ing, qty] of [['Dana əti',150],['Pendir',30],['Pomidor',1],['Xiyar',1],['Yarpaq',1],['Sous',20],['Bulka',1]]) {
        if (ingId[ing]) {
          await client.query(
            'INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            [pid, ingId[ing], qty]
          );
        }
      }
    }

    // 7. Demo tamamlanmış sifarişlər (statistika üçün)
    const { rows: empRows } = await client.query("SELECT id FROM users WHERE role='employee' LIMIT 1");
    const empUserId = empRows[0]?.id;

    const demoOrders = [
      { items: [['Klassik Burqer',2],['Cola 0.5L',2]], payment: 'cash' },
      { items: [['Fast Burqer',1],['Kartof Qızartması',1],['Ayran',1]], payment: 'card' },
      { items: [['Premium Burqer',1],['Şokolad Browni',1]], payment: 'card' },
      { items: [['Fast Pizza',2],['Cola 0.5L',3]], payment: 'cash' },
      { items: [['Double Burqer',1],['Soğan Həlqələri',1],['Limonad',1]], payment: 'cash' },
    ];

    for (const demo of demoOrders) {
      let subtotal = 0;
      const orderItems = [];
      for (const [pname, qty] of demo.items) {
        const prod = prodId[pname];
        if (!prod) continue;
        const lineTotal = parseFloat(prod.base_price) * qty;
        subtotal += lineTotal;
        orderItems.push({ id: prod.id, name: pname, qty, price: prod.base_price, subtotal: lineTotal });
      }

      const { rows: [ord] } = await client.query(`
        INSERT INTO orders (status, payment_type, subtotal, total_amount, employee_id)
        VALUES ('completed', $1::payment_type, $2, $2, $3) RETURNING id
      `, [demo.payment, subtotal.toFixed(2), empUserId || null]);

      for (const it of orderItems) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [ord.id, it.id, it.name, it.qty, it.price, it.subtotal.toFixed(2)]);
      }

      // Stoku azalt
      for (const it of orderItems) {
        await client.query('UPDATE products SET stock_qty = GREATEST(0, stock_qty - $1) WHERE id = $2', [it.qty, it.id]);
      }
    }

    await client.query('COMMIT');
    console.log('✅ Demo məlumatlar uğurla daxil edildi!');
    console.log('');
    console.log('Demo kimlik məlumatları:');
    console.log('  Owner:    username=owner  / Owner2024!');
    console.log('  İşçi 1:  hr_code=EMP001  / Employee123!');
    console.log('  İşçi 2:  hr_code=EMP002  / Employee123!');
    console.log('');
    console.log(`Məhsul: ${allProds.length}, Kateqoriya: ${cats.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed xətası:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
