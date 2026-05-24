// Demo məlumatlar — development üçün
import bcrypt from 'bcrypt';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
      ('Əli Həsənov',  'EMP001', $1, 'employee'),
      ('Nigar Quliyeva','EMP002', $1, 'employee')
      ON CONFLICT (hr_code) DO NOTHING
    `, [empHash]);

    // 3. Kateqoriyalar
    await client.query(`
      INSERT INTO categories (name, sort_order) VALUES
      ('Burqerlər', 1), ('İçkilər', 2), ('Yanında', 3), ('Desertlər', 4)
      ON CONFLICT (name) DO NOTHING
    `);

    // 4. İnqredientlər
    await client.query(`
      INSERT INTO ingredients (name, unit) VALUES
      ('Dana əti', 'q'), ('Pendir', 'q'), ('Pomidor', 'əd'),
      ('Xiyar', 'əd'), ('Yarpaq', 'əd'), ('Sous', 'ml'),
      ('Bulka', 'əd'), ('Kartof', 'q'), ('Yağ', 'ml'),
      ('Kola', 'ml'), ('Su', 'ml')
      ON CONFLICT (name) DO NOTHING
    `);

    // 5. Məhsullar
    const productData = [
      ['Klassik Burqer',    'Ət, pendir, pomidor, xiyar, yarpaq', 8.50,  'simple',  50],
      ['Fast Burqer',       'Xüsusi sous ilə sürətli klassik',    9.00,  'fast',    40],
      ['Premium Burqer',    'Wagyu əti, trüf sous, emmental',     18.00, 'premium', 20],
      ['Kartof Qızartması', 'Xüsusi ədviyyat ilə',                4.00,  'simple',  80],
      ['Cola 0.5L',         'Soyuq içki',                         2.50,  'simple',  100],
      ['Ayran',             'Ev ayranı',                          2.00,  'fast',    60],
    ];
    for (const [name, desc, price, seg, qty] of productData) {
      await client.query(`
        INSERT INTO products (name, description, base_price, segment, stock_qty)
        VALUES ($1, $2, $3, $4::product_segment, $5)
        ON CONFLICT DO NOTHING
      `, [name, desc, price, seg, qty]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed məlumatlar daxil edildi.');
    console.log('');
    console.log('Demo kimlik məlumatları:');
    console.log('  Owner:   username=owner       / Owner2024!');
    console.log('  İşçi 1:  hr_code=EMP001       / Employee123!');
    console.log('  İşçi 2:  hr_code=EMP002       / Employee123!');
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
