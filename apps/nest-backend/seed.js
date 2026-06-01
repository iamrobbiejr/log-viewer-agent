require('dotenv').config();
const bcrypt = require('bcrypt');
const path = require('path');

async function seedPostgres() {
  const { Client } = require('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const email = 'admin@lafrontiere.co.zw';
  const name = 'Admin';
  const role = 'admin';
  const is_active = true;
  const rawPassword = 'password123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
  
  if (res.rows.length > 0) {
    console.log(`[Neon DB] User with email ${email} already exists.`);
  } else {
    await client.query(
      'INSERT INTO users (name, email, password, is_active, role, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
      [name, email, hashedPassword, is_active, role]
    );
    console.log(`[Neon DB] Successfully seeded user: ${email} with password: ${rawPassword}`);
  }

  await client.end();
}

async function seedSqlite() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const email = 'admin@lafrontiere.co.zw';
  const name = 'Admin';
  const role = 'admin';
  const is_active = 1;
  const rawPassword = 'password123';
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const now = new Date().toISOString();

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('[SQLite] Error querying user:', err.message);
      db.close();
      return;
    }

    if (row) {
      console.log(`[SQLite] User with email ${email} already exists.`);
      db.close();
      return;
    }

    const stmt = db.prepare('INSERT INTO users (name, email, password, is_active, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run([name, email, hashedPassword, is_active, role, now, now], function (err) {
      if (err) {
        console.error('[SQLite] Error inserting user:', err.message);
      } else {
        console.log(`[SQLite] Successfully seeded user: ${email} with password: ${rawPassword}`);
      }
      stmt.finalize();
      db.close();
    });
  });
}

async function run() {
  if (process.env.DATABASE_URL) {
    console.log('Detected DATABASE_URL. Seeding Neon Postgres Database...');
    await seedPostgres();
  } else {
    console.log('No DATABASE_URL found. Seeding local SQLite Database...');
    await seedSqlite();
  }
}

run();
