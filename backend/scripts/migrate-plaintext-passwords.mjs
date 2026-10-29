import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:12345@localhost:5432/agriculture_db',
});

async function migrate() {
  try {
    const res = await pool.query('SELECT uid, email, password_hash FROM users');
    for (const row of res.rows) {
      const hash = row.password_hash || '';
      if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
        console.log(`Hashing plaintext password for ${row.email}...`);
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(hash, salt);
        await pool.query('UPDATE users SET password_hash = $1 WHERE uid = $2', [newHash, row.uid]);
        console.log(`Successfully updated ${row.email} to bcrypt hash.`);
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();

