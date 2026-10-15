import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dirname, '..', '.env.local'),
});

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/agritrack';

console.log('🌱 AgriTrack PostgreSQL Database Initializer');
console.log(`📡 Target Database URL: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);

const { Pool } = pg;
const isRemote =
  databaseUrl.includes('neon.tech') ||
  databaseUrl.includes('supabase.co') ||
  databaseUrl.includes('render.com') ||
  databaseUrl.includes('sslmode=require');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

async function initDb() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error(`❌ schema.sql not found at ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('⏳ Executing schema.sql migrations and initial seeds...');
    await pool.query(sql);
    console.log('✅ PostgreSQL tables and initial seeds created successfully!');
    console.log('   - users table created');
    console.log('   - crop_cycles table created');
    console.log('   - expenses table created');
    console.log('   - income table created');
    console.log('   - activity_logs table created');
    console.log('   - indexes & initial seed data populated');
  } catch (err) {
    console.error('❌ Error executing schema.sql:', err.message);
  } finally {
    await pool.end();
  }
}

initDb();
