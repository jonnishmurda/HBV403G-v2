import pg from 'pg';
import { environment } from './environment.js';
import { logger as loggerSingleton } from './logger.js';

export class Database {
  constructor(connectionString, logger) {
    this.connectionString = connectionString;
    this.logger = logger;
  }

  pool = null;

  open() {
    this.pool = new pg.Pool({
      connectionString: this.connectionString,
      ssl: { rejectUnauthorized: false } 
    });

    this.pool.on('error', (err) => {
      this.logger.error('error in database pool', err);
      this.close();
    });

    console.log("✅ Database connected successfully!");
  }

  async close() {
    if (!this.pool) {
      this.logger.error('Trying to close a non-open database connection.');
      return false;
    }

    try {
      await this.pool.end();
      return true;
    } catch (e) {
      this.logger.error('Error closing database pool:', e);
      return false;
    } finally {
      this.pool = null;
    }
  }

  async connect() {
    if (!this.pool) {
      console.error("Database not initialized!");
      return null;
    }
    try {
      return await this.pool.connect();
    } catch (e) {
      console.error("Error connecting to the database:", e);
      return null;
    }
  }

  async query(query, values = []) {
    const client = await this.connect();
    if (!client) {
      return null;
    }

    try {
      return await client.query(query, values);
    } catch (e) {
      console.error("Error running query:", e);
      return null;
    } finally {
      client.release();
    }
  }
}

let db = null;

export function getDatabase() {
  if (db) {
    return db;
  }

  const env = environment(process.env, loggerSingleton);
  if (!env) {
    console.error("Failed to load environment variables.");
    return null;
  }

  db = new Database(env.connectionString, loggerSingleton);
  db.open();
  return db;
}
