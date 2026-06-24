const sql = require('mssql');

const localConfig = {
  user: process.env.DB_LOCAL_USER,
  password: process.env.DB_LOCAL_PASS,
  server: process.env.DB_LOCAL_HOST,
  database: process.env.DB_LOCAL_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false, // Usar hora local en lugar de UTC
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const cloudConfig = {
  user: process.env.DB_CLOUD_USER,
  password: process.env.DB_CLOUD_PASSWORD,
  server: process.env.DB_CLOUD_HOST,
  database: process.env.DB_CLOUD_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    useUTC: false, // Usar hora local en lugar de UTC
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let _localPool = null;
let _cloudPool = null;
let _cloudUnavailable = false;

async function getLocalPool() {
  if (!_localPool) {
    _localPool = await new sql.ConnectionPool(localConfig).connect();
  }
  return _localPool;
}

async function getCloudPool() {
  if (_cloudUnavailable) return null;
  if (!_cloudPool) {
    try {
      _cloudPool = await new sql.ConnectionPool(cloudConfig).connect();
    } catch (err) {
      _cloudUnavailable = true;
      return null;
    }
  }
  return _cloudPool;
}

async function getPool() {
  return getLocalPool();
}

module.exports = {
  getLocalPool,
  getCloudPool,
  getPool,
  sql,
  isCloudAvailable: () => _cloudPool !== null || !_cloudUnavailable,
};
