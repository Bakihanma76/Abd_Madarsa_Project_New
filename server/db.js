import 'dotenv/config';
import mysql from 'mysql2/promise';

export const dbName = process.env.DB_NAME || 'madarsa_management';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

export const all = async (table) => {
  const [rows] = await pool.query(`SELECT * FROM \`${table}\` ORDER BY id DESC`);
  return rows;
};

export const one = async (table, id) => {
  const [rows] = await pool.query(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]);
  return rows[0] || null;
};

export const insert = async (table, data) => {
  const keys = Object.keys(data);
  const columns = keys.map((key) => `\`${key}\``).join(', ');
  const placeholders = keys.map((key) => `:${key}`).join(', ');
  const [result] = await pool.execute(
    `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`,
    data,
  );
  return one(table, result.insertId);
};

export const update = async (table, id, data) => {
  const keys = Object.keys(data);
  const assignments = keys.map((key) => `\`${key}\` = :${key}`).join(', ');
  await pool.execute(
    `UPDATE \`${table}\` SET ${assignments} WHERE id = :id`,
    { ...data, id },
  );
  return one(table, id);
};

export const remove = async (table, id) => {
  await pool.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
};

export const scalar = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return Object.values(rows[0] || {})[0] ?? 0;
};

export const rows = async (sql, params = []) => {
  const [result] = await pool.query(sql, params);
  return result;
};
