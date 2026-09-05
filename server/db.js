/**
 * @file server/db.js
 * Pool de connexion PostgreSQL pour MollyMarket
 */
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'mollymarket_backend',
  user: process.env.DB_USER || 'mollymarket_user',
  password: process.env.DB_PASSWORD || 'molly225',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Erreur inattendue du pool PostgreSQL', err);
});

export default pool;
