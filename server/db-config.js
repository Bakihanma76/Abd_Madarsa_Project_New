import 'dotenv/config';

export const dbName = process.env.DB_NAME || 'madarsa_management';

const sslEnabled = ['true', '1', 'required'].includes(String(process.env.DB_SSL || '').toLowerCase());
const sslCa = process.env.DB_CA_CERT?.replace(/\\n/g, '\n');

export const dbSsl = sslEnabled || sslCa
  ? {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
      ...(sslCa ? { ca: sslCa } : {}),
    }
  : undefined;

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ...(dbSsl ? { ssl: dbSsl } : {}),
};

export const publicDbConfig = () => ({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbName,
  sslEnabled: Boolean(dbSsl),
});
