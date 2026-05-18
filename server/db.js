import pg from 'pg'

const { Pool } = pg

function readEnv(name, fallback = '') {
  return process.env[name] || fallback
}

function shouldUseSsl(host) {
  if (!host) return false
  if (readEnv('DB_SSL', '').toLowerCase() === 'false') return false
  return !['localhost', '127.0.0.1'].includes(host)
}

const host = readEnv('DB_HOST', readEnv('PGHOST'))
const port = Number(readEnv('DB_PORT', readEnv('PGPORT', '5432')))
const database = readEnv('DB_NAME', readEnv('PGDATABASE', 'postgres'))
const user = readEnv('DB_USER', readEnv('PGUSER', 'postgres'))
const password = readEnv('DB_PASSWORD', readEnv('PGPASSWORD'))

export const hasDatabaseConfig = Boolean(host && password)

export const pool = hasDatabaseConfig
  ? new Pool({
      host,
      port,
      database,
      user,
      password,
      ssl: shouldUseSsl(host) ? { rejectUnauthorized: false } : false,
    })
  : null

export async function queryDb(text, params = []) {
  if (!pool) {
    throw new Error('Database connection is not configured. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env.')
  }
  return pool.query(text, params)
}
