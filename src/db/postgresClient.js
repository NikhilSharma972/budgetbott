const { Pool } = require('pg');
require('dotenv').config();


const pool_ = new Pool({
  host: process.env.POSTGRES_DB_HOST,
  user: process.env.POSTGRES_DB_USER,
  database: process.env.POSTGRES_DB_NAME,
  password: process.env.POSTGRES_DB_PASSWORD,
  port: +process.env.POSTGRES_DB_PORT
});

module.exports = pool_;

